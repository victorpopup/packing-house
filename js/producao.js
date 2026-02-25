// Sistema de Gerenciamento de Produção
class ProductionManager {
    constructor() {
        this.marcas = [];
        this.producoes = [];
        this.editingProducaoId = null;
        this.selectedMarcaId = null;
        this.selectedMarca = null;
        this.dbReady = false;
        this.init();
    }

    async init() {
        // Esperar o banco de dados estar pronto
        await this.waitForDatabase();
        await this.loadData();
        this.setupEventListeners();
        this.populateFiltroMarcas();
        this.loadProducoesTable();
        this.setDefaultDate();
    }

    async waitForDatabase() {
        console.log('🔄 Produção: Aguardando banco de dados...');
        let attempts = 0;
        while (!window.packingHouseDB || !window.packingHouseDB.db) {
            attempts++;
            if (attempts > 50) {
                console.error('❌ Produção: Timeout aguardando banco de dados');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.dbReady = true;
        console.log('✅ Produção: Banco de dados pronto!');
    }

    async loadData() {
        try {
            // Carregar marcas do IndexedDB
            if (typeof window.packingHouseDB.getAllBrands === 'function') {
                this.marcas = await window.packingHouseDB.getAllBrands();
                console.log(`📦 Produção: ${this.marcas.length} marcas carregadas do IndexedDB`);
                
                // Se não há marcas no IndexedDB, tentar migrar do localStorage
                if (this.marcas.length === 0) {
                    console.log('⚠️ Produção: Nenhuma marca no IndexedDB, tentando migração...');
                    await this.migrateFromLocalStorage();
                }
            } else {
                console.warn('⚠️ Produção: getAllBrands não disponível, usando localStorage');
                this.marcas = this.loadMarcasFromStorage();
            }

            // Carregar produções (mantém do localStorage por enquanto)
            this.producoes = this.loadProducoesFromStorage();
            console.log(`📊 Produção: ${this.producoes.length} produções carregadas`);
            
            // Verificar se há marcas disponíveis
            if (this.marcas.length === 0) {
                console.warn('⚠️ Produção: Nenhuma marca encontrada! O campo de autocomplete não funcionará.');
                this.showMessage('Nenhuma marca cadastrada. Cadastre marcas nas Configurações.', 'warning');
            }
        } catch (error) {
            console.error('❌ Produção: Erro ao carregar dados:', error);
            this.marcas = [];
            this.producoes = [];
        }
    }

    async migrateFromLocalStorage() {
        try {
            const localStorageMarcas = JSON.parse(localStorage.getItem('marcas') || '[]');
            if (localStorageMarcas.length > 0) {
                console.log(`🔄 Produção: Migrando ${localStorageMarcas.length} marcas do localStorage...`);
                
                for (const marca of localStorageMarcas) {
                    try {
                        await window.packingHouseDB.addBrand({
                            name: marca.nome || marca.name,
                            peso: marca.peso
                        });
                        console.log(`✅ Marca migrada: ${marca.nome || marca.name}`);
                    } catch (error) {
                        console.error(`❌ Erro ao migrar marca ${marca.nome || marca.name}:`, error);
                    }
                }
                
                // Recarregar marcas do IndexedDB após migração
                this.marcas = await window.packingHouseDB.getAllBrands();
                console.log(`📦 Produção: ${this.marcas.length} marcas carregadas após migração`);
                
                // Limpar localStorage após migração bem-sucedida
                localStorage.removeItem('marcas');
                console.log('🧹 LocalStorage limpo após migração');
            }
        } catch (error) {
            console.error('❌ Erro na migração do localStorage:', error);
        }
    }

    setupEventListeners() {
        // Formulário de produção
        document.getElementById('formProducao').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProducaoSubmit();
        });

        // Autocompletar de marcas
        const marcaInput = document.getElementById('marcaProducao');
        marcaInput.addEventListener('input', (e) => {
            this.handleMarcaInput(e.target.value);
        });

        marcaInput.addEventListener('focus', () => {
            this.showMarcaSuggestions();
        });

        marcaInput.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideMarcaSuggestions();
            }, 200);
        });

        // Navegação por teclado nas sugestões
        marcaInput.addEventListener('keydown', (e) => {
            this.handleMarcaKeydown(e);
        });

        // Filtros - aplicação automática
        document.getElementById('dataFiltro').addEventListener('change', () => {
            this.filterProducoes();
        });

        document.getElementById('marcaFiltro').addEventListener('change', () => {
            this.filterProducoes();
        });

        // Botão de limpar filtro
        document.getElementById('btnLimparFiltro').addEventListener('click', () => {
            this.clearFilters();
        });

        // Reset do formulário de produção
        document.getElementById('formProducao').addEventListener('reset', () => {
            setTimeout(() => {
                this.selectedMarcaId = null;
                this.selectedMarca = null;
                document.getElementById('marcaProducao').value = '';
            }, 100);
        });


        // Fechar sugestões clicando fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.marca-autocomplete-container')) {
                this.hideMarcaSuggestions();
            }
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dataProducao').value = today;
        document.getElementById('dataFiltro').value = today;
    }

    // Gerenciamento de Marcas
    loadMarcasFromStorage() {
        const data = localStorage.getItem('marcas');
        return data ? JSON.parse(data) : [];
    }

    loadProducoesFromStorage() {
        const data = localStorage.getItem('producoes');
        return data ? JSON.parse(data) : [];
    }

    saveMarcas() {
        localStorage.setItem('marcas', JSON.stringify(this.marcas));
        this.populateFiltroMarcas();
    }

    // Funcionalidades de Autocompletar
    handleMarcaInput(query) {
        this.showMarcaSuggestions(query);
    }

    showMarcaSuggestions(query = '') {
        console.log(`🔍 Produção: Buscando marcas com query: "${query}"`);
        console.log(`📋 Produção: Marcas disponíveis:`, this.marcas);
        
        const suggestionsContainer = document.getElementById('marcaSuggestions');
        
        // Verificar se há marcas disponíveis
        if (!this.marcas || this.marcas.length === 0) {
            console.warn('⚠️ Produção: Nenhuma marca disponível para mostrar');
            suggestionsContainer.innerHTML = '<div class="marca-suggestions-empty">Nenhuma marca cadastrada. <a href="configuracao.html" style="color: #667eea;">Cadastrar marcas</a></div>';
            suggestionsContainer.style.display = 'block';
            return;
        }
        
        const filteredMarcas = this.marcas.filter(marca => {
            const nome = marca.name || marca.nome || '';
            return nome.toLowerCase().includes(query.toLowerCase());
        });
        
        console.log(`🎯 Produção: ${filteredMarcas.length} marcas encontradas para query: "${query}"`);

        if (filteredMarcas.length === 0) {
            suggestionsContainer.innerHTML = '<div class="marca-suggestions-empty">Nenhuma marca encontrada para esta busca</div>';
            suggestionsContainer.style.display = 'block';
            return;
        }

        suggestionsContainer.innerHTML = filteredMarcas.map(marca => `
            <div class="marca-suggestion-item" data-marca-id="${marca.id}">
                <span class="marca-suggestion-name">${marca.name || marca.nome}</span>
                <span class="marca-suggestion-peso">${marca.peso}kg</span>
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';

        // Adicionar event listeners aos itens
        suggestionsContainer.querySelectorAll('.marca-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                console.log(`🖱️ Produção: Marca selecionada: ${item.dataset.marcaId}`);
                this.selectMarca(item.dataset.marcaId);
            });
        });
    }

    hideMarcaSuggestions() {
        const suggestionsContainer = document.getElementById('marcaSuggestions');
        suggestionsContainer.style.display = 'none';
    }

    selectMarca(marcaId) {
        console.log(`🎯 Produção: Selecionando marca ID: ${marcaId}`);
        console.log(`📋 Produção: Marcas disponíveis:`, this.marcas);
        
        const marca = this.marcas.find(m => m.id == marcaId); // Usar == para comparação flexível
        if (!marca) {
            console.error(`❌ Produção: Marca não encontrada com ID: ${marcaId}`);
            this.showMessage('Marca não encontrada', 'error');
            return;
        }

        console.log(`✅ Produção: Marca encontrada:`, marca);

        this.selectedMarcaId = marcaId;
        this.selectedMarca = marca;
        
        const marcaInput = document.getElementById('marcaProducao');
        const marcaNome = marca.name || marca.nome;
        
        console.log(`📝 Produção: Preenchendo input com: "${marcaNome}"`);
        
        marcaInput.value = marcaNome;
        this.hideMarcaSuggestions();
        
        // Disparar evento change para notificar outros sistemas
        const event = new Event('change', { bubbles: true });
        marcaInput.dispatchEvent(event);
        
        console.log(`✅ Produção: Marca selecionada com sucesso: ${marcaNome}`);
    }

    handleMarcaKeydown(e) {
        const suggestionsContainer = document.getElementById('marcaSuggestions');
        const items = suggestionsContainer.querySelectorAll('.marca-suggestion-item');
        
        if (items.length === 0) return;

        let currentIndex = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('selected')) {
                currentIndex = index;
            }
        });

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < items.length - 1) {
                    if (currentIndex >= 0) items[currentIndex].classList.remove('selected');
                    currentIndex++;
                    items[currentIndex].classList.add('selected');
                }
                break;
            
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    items[currentIndex].classList.remove('selected');
                    currentIndex--;
                    items[currentIndex].classList.add('selected');
                }
                break;
            
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0) {
                    this.selectMarca(items[currentIndex].dataset.marcaId);
                }
                break;
            
            case 'Escape':
                this.hideMarcaSuggestions();
                break;
        }
    }

    populateFiltroMarcas() {
        const select = document.getElementById('marcaFiltro');
        select.innerHTML = '<option value="">Todas as marcas</option>';
        
        this.marcas.forEach(marca => {
            const option = document.createElement('option');
            option.value = marca.id;
            option.textContent = marca.name || marca.nome; // Compatibilidade com ambos os formatos
            select.appendChild(option);
        });
    }

    updatePesoCaixa() {
        // Este método não é mais necessário, pois o peso por caixa não é mais exibido
        // Mantido para compatibilidade
    }

    handleProducaoSubmit() {
        const data = document.getElementById('dataProducao').value;
        const quantidade = parseInt(document.getElementById('quantidadeCaixas').value);

        if (!data || !this.selectedMarcaId || !quantidade) {
            this.showMessage('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        const marca = this.marcas.find(m => m.id === this.selectedMarcaId);
        if (!marca) {
            this.showMessage('Marca não encontrada', 'error');
            return;
        }

        const pesoTotal = quantidade * marca.peso;

        const producao = {
            id: this.editingProducaoId || this.generateId(),
            data,
            marcaId: this.selectedMarcaId,
            marcaNome: marca.name || marca.nome,
            quantidade,
            pesoCaixa: marca.peso,
            pesoTotal,
            createdAt: this.editingProducaoId ? 
                this.producoes.find(p => p.id === this.editingProducaoId).createdAt : 
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingProducaoId) {
            const index = this.producoes.findIndex(p => p.id === this.editingProducaoId);
            if (index !== -1) {
                this.producoes[index] = producao;
                this.showMessage('Produção atualizada com sucesso', 'success');
            }
        } else {
            this.producoes.push(producao);
            this.showMessage('Produção registrada com sucesso', 'success');
        }

        this.saveProducoes();
        document.getElementById('formProducao').reset();
        this.setDefaultDate();
        this.editingProducaoId = null;
        this.selectedMarcaId = null;
        this.selectedMarca = null;
    }


    loadProducoesTable(producoesFiltradas = null) {
        const tbody = document.getElementById('productionTableBody');
        const emptyState = document.getElementById('emptyState');
        const producoes = producoesFiltradas || this.producoes;

        // Ordenar por data (mais recente primeiro)
        producoes.sort((a, b) => new Date(b.data) - new Date(a.data));

        tbody.innerHTML = '';

        if (producoes.length === 0) {
            emptyState.style.display = 'block';
            tbody.parentElement.style.display = 'none';
            this.updateSummary(0, 0);
            return;
        }

        emptyState.style.display = 'none';
        tbody.parentElement.style.display = 'table';

        let totalCaixas = 0;
        let totalPeso = 0;

        producoes.forEach(producao => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(producao.data)}</td>
                <td>${producao.marcaNome}</td>
                <td>${producao.quantidade}</td>
                <td>${producao.pesoCaixa.toFixed(1)}</td>
                <td>${producao.pesoTotal.toFixed(1)}</td>
                <td>
                    <button class="btn btn-warning btn-small" onclick="productionManager.editProducao('${producao.id}')">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="productionManager.deleteProducao('${producao.id}')">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);

            totalCaixas += producao.quantidade;
            totalPeso += producao.pesoTotal;
        });

        this.updateSummary(totalCaixas, totalPeso);
    }

    editProducao(id) {
        const producao = this.producoes.find(p => p.id === id);
        if (!producao) return;

        this.editingProducaoId = id;
        this.selectedMarcaId = producao.marcaId;
        this.selectedMarca = this.marcas.find(m => m.id === producao.marcaId);
        
        document.getElementById('dataProducao').value = producao.data;
        document.getElementById('marcaProducao').value = producao.marcaNome;
        document.getElementById('quantidadeCaixas').value = producao.quantidade;
        

        // Rolar para o formulário
        document.querySelector('.production-form-section').scrollIntoView({ behavior: 'smooth' });
        
        this.showMessage('Editando registro de produção', 'info');
    }

    deleteProducao(id) {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;

        this.producoes = this.producoes.filter(p => p.id !== id);
        this.saveProducoes();
        this.showMessage('Registro excluído com sucesso', 'success');
    }

    filterProducoes() {
        const dataFiltro = document.getElementById('dataFiltro').value;
        const marcaFiltro = document.getElementById('marcaFiltro').value;

        let filtradas = this.producoes;

        if (dataFiltro) {
            filtradas = filtradas.filter(p => p.data === dataFiltro);
        }

        if (marcaFiltro) {
            filtradas = filtradas.filter(p => p.marcaId === marcaFiltro);
        }

        this.loadProducoesTable(filtradas);
    }

    clearFilters() {
        document.getElementById('dataFiltro').value = '';
        document.getElementById('marcaFiltro').value = '';
        this.loadProducoesTable();
    }

    updateSummary(totalCaixas, totalPeso) {
        document.getElementById('totalCaixas').textContent = `${totalCaixas} caixas`;
        document.getElementById('totalPeso').textContent = `${totalPeso.toFixed(1)} kg`;
    }

    // Gerenciamento de Produção
    loadProducoes() {
        const data = localStorage.getItem('producoes');
        return data ? JSON.parse(data) : [];
    }

    saveProducoes() {
        localStorage.setItem('producoes', JSON.stringify(this.producoes));
        this.loadProducoesTable();
    }

    // Utilitários
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Função de depuração para diagnóstico
    debugMarcaSystem() {
        console.log('🔍 DEBUG: Sistema de Marcas');
        console.log('📊 Marcas disponíveis:', this.marcas);
        console.log('🎯 selectedMarcaId:', this.selectedMarcaId);
        console.log('🏷️ selectedMarca:', this.selectedMarca);
        console.log('🗄️ dbReady:', this.dbReady);
        
        const marcaInput = document.getElementById('marcaProducao');
        const suggestionsContainer = document.getElementById('marcaSuggestions');
        
        console.log('📝 Input value:', marcaInput?.value);
        console.log('👁️ Suggestions display:', suggestionsContainer?.style.display);
        console.log('📋 Suggestions HTML:', suggestionsContainer?.innerHTML);
        
        // Testar IndexedDB diretamente
        if (window.packingHouseDB && window.packingHouseDB.db) {
            window.packingHouseDB.getAllBrands().then(brands => {
                console.log('🗄️ IndexedDB brands:', brands);
            }).catch(error => {
                console.error('❌ Erro ao buscar marcas do IndexedDB:', error);
            });
        } else {
            console.warn('⚠️ IndexedDB não disponível');
        }
        
        // Verificar localStorage
        const localStorageMarcas = JSON.parse(localStorage.getItem('marcas') || '[]');
        console.log('💾 LocalStorage marcas:', localStorageMarcas);
        
        return {
            marcas: this.marcas,
            selectedMarcaId: this.selectedMarcaId,
            selectedMarca: this.selectedMarca,
            dbReady: this.dbReady,
            inputValue: marcaInput?.value,
            suggestionsDisplay: suggestionsContainer?.style.display
        };
    }

    showMessage(message, type = 'info') {
        // Criar elemento de mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Estilos
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        // Cores por tipo
        const colors = {
            success: 'linear-gradient(135deg, #28a745, #20c997)',
            error: 'linear-gradient(135deg, #dc3545, #c82333)',
            info: 'linear-gradient(135deg, #667eea, #764ba2)',
            warning: 'linear-gradient(135deg, #ffc107, #e0a800)'
        };
        
        messageDiv.style.background = colors[type] || colors.info;

        // Adicionar ao DOM
        document.body.appendChild(messageDiv);

        // Remover após 3 segundos
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar o sistema
let productionManager;
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para garantir que o banco de dados esteja disponível
    setTimeout(() => {
        productionManager = new ProductionManager();
        
        // Adicionar funções globais para diagnóstico
        window.debugProducao = () => {
            if (productionManager) {
                return productionManager.debugMarcaSystem();
            } else {
                console.error('❌ ProductionManager não inicializado');
                return null;
            }
        };
        
        window.testarMarcas = () => {
            if (productionManager) {
                console.log('🧪 Testando sistema de marcas...');
                productionManager.showMarcaSuggestions('');
            } else {
                console.error('❌ ProductionManager não inicializado');
            }
        };
        
        window.cadastrarMarcaTeste = async () => {
            if (window.packingHouseDB && window.packingHouseDB.db) {
                try {
                    await window.packingHouseDB.addBrand({
                        name: 'Marca Teste ' + Date.now(),
                        peso: 10.5
                    });
                    console.log('✅ Marca de teste cadastrada');
                    if (productionManager) {
                        await productionManager.loadData();
                    }
                } catch (error) {
                    console.error('❌ Erro ao cadastrar marca de teste:', error);
                }
            } else {
                console.error('❌ Banco de dados não disponível');
            }
        };
        
        console.log('🔧 Funções de diagnóstico disponíveis:');
        console.log('  - debugProducao() - Diagnóstico completo do sistema');
        console.log('  - testarMarcas() - Testar autocomplete de marcas');
        console.log('  - cadastrarMarcaTeste() - Cadastrar marca de teste');
    }, 500);
});
