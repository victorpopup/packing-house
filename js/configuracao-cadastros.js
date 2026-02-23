// Sistema de Gerenciamento de Cadastros na Configuração
class ConfiguracaoCadastrosManager {
    constructor() {
        this.materiais = [];
        this.marcas = [];
        this.editingMaterialId = null;
        this.editingMarcaId = null;
        this.dbReady = false;
        this.init();
    }

    async init() {
        // Esperar o banco de dados estar pronto
        await this.waitForDatabase();
        this.setupEventListeners();
        await this.loadData();
        this.updateStatus();
    }

    async waitForDatabase() {
        console.log('Aguardando banco de dados ficar pronto...');
        let attempts = 0;
        while (!window.packingHouseDB || !window.packingHouseDB.db) {
            attempts++;
            if (attempts > 50) { // Timeout após 5 segundos
                console.error('Timeout aguardando banco de dados');
                throw new Error('Banco de dados não ficou pronto a tempo');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('Banco de dados está pronto!');
        this.dbReady = true;
    }

    async loadData() {
        try {
            // Carregar materiais
            try {
                this.materiais = await window.packingHouseDB.getAllMaterials();
                console.log('Materiais carregados:', this.materiais.length);
            } catch (error) {
                console.error('Erro ao carregar materiais:', error);
                this.materiais = [];
            }

            // Carregar marcas (verificando se o método existe)
            try {
                if (typeof window.packingHouseDB.getAllBrands === 'function') {
                    this.marcas = await window.packingHouseDB.getAllBrands();
                    console.log('Marcas carregadas:', this.marcas.length);
                } else {
                    console.log('Método getAllBrands não encontrado, usando array vazio');
                    this.marcas = [];
                }
            } catch (error) {
                console.error('Erro ao carregar marcas:', error);
                this.marcas = [];
            }

            this.loadMaterialsList();
            this.loadMarcasList();
        } catch (error) {
            console.error('Erro geral ao carregar dados:', error);
            this.showMessage('Erro ao carregar dados do banco de dados', 'error');
        }
    }

    setupEventListeners() {
        // Modal de Materiais
        document.getElementById('formMaterial').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMaterialSubmit();
        });

        // Modal de Marcas
        document.getElementById('formMarcaConfig').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMarcaSubmit();
        });

        // Fechar modais clicando fora
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('materialsModal')) {
                this.closeMaterialsModal();
            }
            if (e.target === document.getElementById('marcasModal')) {
                this.closeMarcasModal();
            }
        });
    }

    // Gerenciamento de Materiais
    async loadMateriais() {
        if (!this.dbReady) return [];
        try {
            return await window.packingHouseDB.getAllMaterials();
        } catch (error) {
            console.error('Erro ao carregar materiais:', error);
            return [];
        }
    }

    async saveMateriais() {
        // Dados são salvos diretamente no IndexedDB através das operações individuais
        this.loadMaterialsList();
        this.updateStatus();
    }

    async handleMaterialSubmit() {
        if (!this.dbReady) {
            this.showMessage('Banco de dados não está pronto', 'error');
            return;
        }

        const nome = document.getElementById('materialNome').value.trim();
        const quantidade = parseInt(document.getElementById('materialQuantidade').value);

        if (!nome || !quantidade) {
            this.showMessage('Preencha todos os campos', 'error');
            return;
        }

        try {
            if (this.editingMaterialId) {
                // Editar material existente
                await window.packingHouseDB.updateMaterial(this.editingMaterialId, {
                    name: nome,
                    quantity: quantidade,
                    unit: 'unidade'
                });
                this.showMessage('Material atualizado com sucesso', 'success');
            } else {
                // Adicionar novo material
                await window.packingHouseDB.addMaterial({
                    name: nome,
                    quantity: quantidade,
                    unit: 'unidade'
                });
                this.showMessage('Material cadastrado com sucesso', 'success');
            }

            await this.loadData();
            this.closeMaterialsModal();
        } catch (error) {
            console.error('Erro ao salvar material:', error);
            this.showMessage('Erro ao salvar material: ' + error.message, 'error');
        }
    }

    loadMaterialsList() {
        const container = document.getElementById('materialsContainer');
        container.innerHTML = '';

        if (this.materiais.length === 0) {
            container.innerHTML = '<p style="color: #a8a8a8; text-align: center;">Nenhum material cadastrado</p>';
            return;
        }

        this.materiais.forEach(material => {
            const item = document.createElement('div');
            item.className = 'marca-item'; // Reutilizando estilo
            item.innerHTML = `
                <div class="marca-info">
                    <div class="marca-nome">${material.name}</div>
                    <div class="marca-peso">Quantidade: ${material.quantity}</div>
                </div>
                <div class="marca-actions">
                    <button class="btn btn-warning btn-small" onclick="configuracaoCadastrosManager.editMaterial('${material.id}')">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="configuracaoCadastrosManager.deleteMaterial('${material.id}')">Excluir</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    async editMaterial(id) {
        if (!this.dbReady) return;
        
        try {
            const material = await window.packingHouseDB.getMaterial(id);
            if (!material) return;

            this.editingMaterialId = id;
            document.getElementById('materialNome').value = material.name;
            document.getElementById('materialQuantidade').value = material.quantity;
            
            // Atualizar título do modal
            document.querySelector('#materialsModal .modal-header h3').textContent = 'Editar Material';
        } catch (error) {
            console.error('Erro ao carregar material para edição:', error);
            this.showMessage('Erro ao carregar material para edição', 'error');
        }
    }

    async deleteMaterial(id) {
        if (!confirm('Tem certeza que deseja excluir este material?')) return;
        
        if (!this.dbReady) {
            this.showMessage('Banco de dados não está pronto', 'error');
            return;
        }

        try {
            await window.packingHouseDB.deleteMaterial(id);
            await this.loadData();
            this.showMessage('Material excluído com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao excluir material:', error);
            this.showMessage('Erro ao excluir material: ' + error.message, 'error');
        }
    }

    // Gerenciamento de Marcas
    async loadMarcas() {
        if (!this.dbReady) return [];
        try {
            return await window.packingHouseDB.getAllBrands();
        } catch (error) {
            console.error('Erro ao carregar marcas:', error);
            return [];
        }
    }

    async saveMarcas() {
        // Dados são salvos diretamente no IndexedDB através das operações individuais
        this.loadMarcasList();
        this.updateStatus();
    }

    async handleMarcaSubmit() {
        if (!this.dbReady) {
            this.showMessage('Banco de dados não está pronto', 'error');
            return;
        }

        const nome = document.getElementById('nomeMarcaConfig').value.trim();
        const peso = parseFloat(document.getElementById('pesoMarcaConfig').value);

        if (!nome || !peso) {
            this.showMessage('Preencha todos os campos', 'error');
            return;
        }

        try {
            if (this.editingMarcaId) {
                // Editar marca existente
                await window.packingHouseDB.updateBrand(this.editingMarcaId, {
                    name: nome,
                    peso: peso
                });
                this.showMessage('Marca atualizada com sucesso', 'success');
            } else {
                // Adicionar nova marca
                await window.packingHouseDB.addBrand({
                    name: nome,
                    peso: peso
                });
                this.showMessage('Marca cadastrada com sucesso', 'success');
            }

            await this.loadData();
            this.closeMarcasModal();
        } catch (error) {
            console.error('Erro ao salvar marca:', error);
            this.showMessage('Erro ao salvar marca: ' + error.message, 'error');
        }
    }

    loadMarcasList() {
        const container = document.getElementById('marcasContainerConfig');
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
                    <div class="marca-nome">${marca.name}</div>
                    <div class="marca-peso">Peso: ${marca.peso}kg por caixa</div>
                </div>
                <div class="marca-actions">
                    <button class="btn btn-warning btn-small" onclick="configuracaoCadastrosManager.editMarca('${marca.id}')">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="configuracaoCadastrosManager.deleteMarca('${marca.id}')">Excluir</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    async editMarca(id) {
        if (!this.dbReady) return;
        
        try {
            const marca = await window.packingHouseDB.getBrand(id);
            if (!marca) return;

            this.editingMarcaId = id;
            document.getElementById('nomeMarcaConfig').value = marca.name;
            document.getElementById('pesoMarcaConfig').value = marca.peso;
            
            // Atualizar título do modal
            document.querySelector('#marcasModal .modal-header h3').textContent = 'Editar Marca';
        } catch (error) {
            console.error('Erro ao carregar marca para edição:', error);
            this.showMessage('Erro ao carregar marca para edição', 'error');
        }
    }

    async deleteMarca(id) {
        if (!confirm('Tem certeza que deseja excluir esta marca?')) return;
        
        if (!this.dbReady) {
            this.showMessage('Banco de dados não está pronto', 'error');
            return;
        }

        try {
            // Verificar se há produções vinculadas
            const productions = await window.packingHouseDB.getAllMovements();
            const producoesVinculadas = productions.filter(p => p.brandId === id);
            
            if (producoesVinculadas.length > 0) {
                this.showMessage('Não é possível excluir marca com produções registradas', 'error');
                return;
            }

            await window.packingHouseDB.deleteBrand(id);
            await this.loadData();
            this.showMessage('Marca excluída com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao excluir marca:', error);
            this.showMessage('Erro ao excluir marca: ' + error.message, 'error');
        }
    }

    // Controle de Modais
    openMaterialsModal() {
        document.getElementById('materialsModal').style.display = 'block';
        this.editingMaterialId = null;
        document.getElementById('formMaterial').reset();
        document.querySelector('#materialsModal .modal-header h3').textContent = 'Gerenciar Materiais';
    }

    closeMaterialsModal() {
        document.getElementById('materialsModal').style.display = 'none';
        this.editingMaterialId = null;
        document.getElementById('formMaterial').reset();
    }

    openMarcasModal() {
        document.getElementById('marcasModal').style.display = 'block';
        this.editingMarcaId = null;
        document.getElementById('formMarcaConfig').reset();
        document.querySelector('#marcasModal .modal-header h3').textContent = 'Gerenciar Marcas';
    }

    closeMarcasModal() {
        document.getElementById('marcasModal').style.display = 'none';
        this.editingMarcaId = null;
        document.getElementById('formMarcaConfig').reset();
    }

    // Atualizar Status
    updateStatus() {
        const materialsCount = document.getElementById('materialsCount');
        if (materialsCount) {
            materialsCount.textContent = this.materiais.length;
        }
    }

    // Utilitários
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

// Funções globais para chamada via onclick
function openMaterialsModal() {
    configuracaoCadastrosManager.openMaterialsModal();
}

function closeMaterialsModal() {
    configuracaoCadastrosManager.closeMaterialsModal();
}

function openMarcasModal() {
    configuracaoCadastrosManager.openMarcasModal();
}

function closeMarcasModal() {
    configuracaoCadastrosManager.closeMarcasModal();
}

// Inicializar o sistema
let configuracaoCadastrosManager;
document.addEventListener('DOMContentLoaded', () => {
    configuracaoCadastrosManager = new ConfiguracaoCadastrosManager();
});
