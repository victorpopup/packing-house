// Sistema de Gerenciamento de Produção
class ProductionManager {
    constructor() {
        this.marcas = this.loadMarcas();
        this.producoes = this.loadProducoes();
        this.editingMarcaId = null;
        this.editingProducaoId = null;
        this.selectedMarcaId = null;
        this.selectedMarca = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateMarcasSelect();
        this.populateFiltroMarcas();
        this.loadProducoesTable();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // Formulário de produção
        document.getElementById('formProducao').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProducaoSubmit();
        });

        // Botões de gerenciar marcas
        document.getElementById('btnGerenciarMarcas').addEventListener('click', () => {
            this.openMarcasModal();
        });

        document.getElementById('btnGerenciarMarcasHeader').addEventListener('click', () => {
            this.openMarcasModal();
        });

        document.getElementById('btnAddMarca').addEventListener('click', () => {
            this.openMarcasModal();
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

        // Filtros
        document.getElementById('btnFiltrar').addEventListener('click', () => {
            this.filterProducoes();
        });

        document.getElementById('btnLimparFiltro').addEventListener('click', () => {
            this.clearFilters();
        });

        // Auto-cálculo de peso total
        document.getElementById('quantidadeCaixas').addEventListener('input', () => {
            this.calculatePesoTotal();
        });

        // Modal de marcas
        document.querySelector('.close').addEventListener('click', () => {
            this.closeMarcasModal();
        });

        document.getElementById('btnCancelarMarca').addEventListener('click', () => {
            this.closeMarcasModal();
        });

        // Formulário de marcas
        document.getElementById('formMarca').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMarcaSubmit();
        });

        // Reset do formulário de produção
        document.getElementById('formProducao').addEventListener('reset', () => {
            setTimeout(() => {
                this.selectedMarcaId = null;
                this.selectedMarca = null;
                document.getElementById('marcaProducao').value = '';
                this.updatePesoCaixa();
                this.calculatePesoTotal();
            }, 100);
        });

        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modalMarcas');
            if (e.target === modal) {
                this.closeMarcasModal();
            }
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
    loadMarcas() {
        const data = localStorage.getItem('marcas');
        return data ? JSON.parse(data) : [];
    }

    saveMarcas() {
        localStorage.setItem('marcas', JSON.stringify(this.marcas));
        this.populateFiltroMarcas();
        this.loadMarcasList();
    }

    // Funcionalidades de Autocompletar
    handleMarcaInput(query) {
        this.showMarcaSuggestions(query);
    }

    showMarcaSuggestions(query = '') {
        const suggestionsContainer = document.getElementById('marcaSuggestions');
        const filteredMarcas = this.marcas.filter(marca => 
            marca.nome.toLowerCase().includes(query.toLowerCase())
        );

        if (filteredMarcas.length === 0) {
            suggestionsContainer.innerHTML = '<div class="marca-suggestions-empty">Nenhuma marca encontrada</div>';
            suggestionsContainer.style.display = 'block';
            return;
        }

        suggestionsContainer.innerHTML = filteredMarcas.map(marca => `
            <div class="marca-suggestion-item" data-marca-id="${marca.id}">
                <span class="marca-suggestion-name">${marca.nome}</span>
                <span class="marca-suggestion-peso">${marca.peso}kg</span>
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';

        // Adicionar event listeners aos itens
        suggestionsContainer.querySelectorAll('.marca-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectMarca(item.dataset.marcaId);
            });
        });
    }

    hideMarcaSuggestions() {
        const suggestionsContainer = document.getElementById('marcaSuggestions');
        suggestionsContainer.style.display = 'none';
    }

    selectMarca(marcaId) {
        const marca = this.marcas.find(m => m.id === marcaId);
        if (!marca) return;

        this.selectedMarcaId = marcaId;
        this.selectedMarca = marca;
        
        document.getElementById('marcaProducao').value = marca.nome;
        this.hideMarcaSuggestions();
        this.updatePesoCaixa();
        this.calculatePesoTotal();
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

    populateMarcasSelect() {
        // Este método não é mais necessário para o select principal,
        // mas mantido para compatibilidade com outras partes do sistema
    }

    populateFiltroMarcas() {
        const select = document.getElementById('marcaFiltro');
        select.innerHTML = '<option value="">Todas as marcas</option>';
        
        this.marcas.forEach(marca => {
            const option = document.createElement('option');
            option.value = marca.id;
            option.textContent = marca.nome;
            select.appendChild(option);
        });
    }

    handleMarcaSubmit() {
        const nome = document.getElementById('nomeMarca').value.trim();
        const peso = parseFloat(document.getElementById('pesoMarca').value);

        if (!nome || !peso) {
            this.showMessage('Preencha todos os campos', 'error');
            return;
        }

        if (this.editingMarcaId) {
            // Editar marca existente
            const index = this.marcas.findIndex(m => m.id === this.editingMarcaId);
            if (index !== -1) {
                this.marcas[index] = {
                    ...this.marcas[index],
                    nome,
                    peso,
                    updatedAt: new Date().toISOString()
                };
                this.showMessage('Marca atualizada com sucesso', 'success');
            }
        } else {
            // Adicionar nova marca
            const novaMarca = {
                id: this.generateId(),
                nome,
                peso,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.marcas.push(novaMarca);
            this.showMessage('Marca cadastrada com sucesso', 'success');
        }

        this.saveMarcas();
        this.closeMarcasModal();
    }

    loadMarcasList() {
        const container = document.getElementById('marcasContainer');
        container.innerHTML = '';

        if (this.marcas.length === 0) {
            container.innerHTML = '<p style="color: #a8a8a8; text-align: center;">Nenhuma marca cadastrada</p>';
            return;
        }

        this.marcas.forEach(marca => {
            const item = document.createElement('div');
            item.className = 'marca-item';
            item.innerHTML = `
                <div class="marca-info">
                    <div class="marca-nome">${marca.nome}</div>
                    <div class="marca-peso">Peso: ${marca.peso}kg por caixa</div>
                </div>
                <div class="marca-actions">
                    <button class="btn btn-warning btn-small" onclick="productionManager.editMarca('${marca.id}')">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="productionManager.deleteMarca('${marca.id}')">Excluir</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    editMarca(id) {
        const marca = this.marcas.find(m => m.id === id);
        if (!marca) return;

        this.editingMarcaId = id;
        document.getElementById('nomeMarca').value = marca.nome;
        document.getElementById('pesoMarca').value = marca.peso;
        
        // Atualizar título do modal
        document.querySelector('#modalMarcas .modal-header h3').textContent = 'Editar Marca';
    }

    deleteMarca(id) {
        if (!confirm('Tem certeza que deseja excluir esta marca?')) return;

        // Verificar se há produções vinculadas
        const producoesVinculadas = this.producoes.filter(p => p.marcaId === id);
        if (producoesVinculadas.length > 0) {
            this.showMessage('Não é possível excluir marca com produções registradas', 'error');
            return;
        }

        this.marcas = this.marcas.filter(m => m.id !== id);
        this.saveMarcas();
        this.showMessage('Marca excluída com sucesso', 'success');
    }

    openMarcasModal() {
        document.getElementById('modalMarcas').style.display = 'block';
        this.loadMarcasList();
        this.editingMarcaId = null;
        document.getElementById('formMarca').reset();
        document.querySelector('#modalMarcas .modal-header h3').textContent = 'Gerenciar Marcas';
    }

    closeMarcasModal() {
        document.getElementById('modalMarcas').style.display = 'none';
        this.editingMarcaId = null;
        document.getElementById('formMarca').reset();
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

    handleProducaoSubmit() {
        const data = document.getElementById('dataProducao').value;
        const marcaId = document.getElementById('marcaProducao').value;
        const quantidade = parseInt(document.getElementById('quantidadeCaixas').value);
        const pesoCaixa = parseFloat(document.getElementById('pesoCaixa').value);
        const pesoTotal = parseFloat(document.getElementById('pesoTotal').value);

        if (!data || !marcaId || !quantidade || !pesoTotal) {
            this.showMessage('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        const marca = this.marcas.find(m => m.id === marcaId);
        if (!marca) {
            this.showMessage('Marca não encontrada', 'error');
            return;
        }

        const producao = {
            id: this.editingProducaoId || this.generateId(),
            data,
            marcaId,
            marcaNome: marca.nome,
            quantidade,
            pesoCaixa,
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
    }

    updatePesoCaixa() {
        const pesoCaixaInput = document.getElementById('pesoCaixa');

        if (this.selectedMarca) {
            pesoCaixaInput.value = this.selectedMarca.peso;
        } else {
            pesoCaixaInput.value = '';
        }
    }

    handleProducaoSubmit() {
        const data = document.getElementById('dataProducao').value;
        const quantidade = parseInt(document.getElementById('quantidadeCaixas').value);
        const pesoCaixa = parseFloat(document.getElementById('pesoCaixa').value);
        const pesoTotal = parseFloat(document.getElementById('pesoTotal').value);

        if (!data || !this.selectedMarcaId || !quantidade || !pesoTotal) {
            this.showMessage('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        const marca = this.marcas.find(m => m.id === this.selectedMarcaId);
        if (!marca) {
            this.showMessage('Marca não encontrada', 'error');
            return;
        }

        const producao = {
            id: this.editingProducaoId || this.generateId(),
            data,
            marcaId: this.selectedMarcaId,
            marcaNome: marca.nome,
            quantidade,
            pesoCaixa,
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

    calculatePesoTotal() {
        const quantidade = parseInt(document.getElementById('quantidadeCaixas').value) || 0;
        const pesoCaixa = parseFloat(document.getElementById('pesoCaixa').value) || 0;
        const pesoTotal = quantidade * pesoCaixa;
        
        document.getElementById('pesoTotal').value = pesoTotal.toFixed(1);
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
        
        this.updatePesoCaixa();
        document.getElementById('pesoTotal').value = producao.pesoTotal.toFixed(1);

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

    // Utilitários
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
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
    productionManager = new ProductionManager();
});
