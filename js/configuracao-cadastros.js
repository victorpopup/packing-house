// Sistema de Gerenciamento de Cadastros na Configuração
class ConfiguracaoCadastrosManager {
    constructor() {
        this.materiais = this.loadMateriais();
        this.marcas = this.loadMarcas();
        this.editingMaterialId = null;
        this.editingMarcaId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMaterialsList();
        this.loadMarcasList();
        this.updateStatus();
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
    loadMateriais() {
        const data = localStorage.getItem('materiais');
        return data ? JSON.parse(data) : [];
    }

    saveMateriais() {
        localStorage.setItem('materiais', JSON.stringify(this.materiais));
        this.loadMaterialsList();
        this.updateStatus();
    }

    handleMaterialSubmit() {
        const nome = document.getElementById('materialNome').value.trim();
        const quantidade = parseInt(document.getElementById('materialQuantidade').value);

        if (!nome || !quantidade) {
            this.showMessage('Preencha todos os campos', 'error');
            return;
        }

        if (this.editingMaterialId) {
            // Editar material existente
            const index = this.materiais.findIndex(m => m.id === this.editingMaterialId);
            if (index !== -1) {
                this.materiais[index] = {
                    ...this.materiais[index],
                    nome,
                    quantidade,
                    updatedAt: new Date().toISOString()
                };
                this.showMessage('Material atualizado com sucesso', 'success');
            }
        } else {
            // Adicionar novo material
            const novoMaterial = {
                id: this.generateId(),
                nome,
                quantidade,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.materiais.push(novoMaterial);
            this.showMessage('Material cadastrado com sucesso', 'success');
        }

        this.saveMateriais();
        this.closeMaterialsModal();
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
                    <div class="marca-nome">${material.nome}</div>
                    <div class="marca-peso">Quantidade: ${material.quantidade}</div>
                </div>
                <div class="marca-actions">
                    <button class="btn btn-warning btn-small" onclick="configuracaoCadastrosManager.editMaterial('${material.id}')">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="configuracaoCadastrosManager.deleteMaterial('${material.id}')">Excluir</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    editMaterial(id) {
        const material = this.materiais.find(m => m.id === id);
        if (!material) return;

        this.editingMaterialId = id;
        document.getElementById('materialNome').value = material.nome;
        document.getElementById('materialQuantidade').value = material.quantidade;
        
        // Atualizar título do modal
        document.querySelector('#materialsModal .modal-header h3').textContent = 'Editar Material';
    }

    deleteMaterial(id) {
        if (!confirm('Tem certeza que deseja excluir este material?')) return;

        this.materiais = this.materiais.filter(m => m.id !== id);
        this.saveMateriais();
        this.showMessage('Material excluído com sucesso', 'success');
    }

    // Gerenciamento de Marcas
    loadMarcas() {
        const data = localStorage.getItem('marcas');
        return data ? JSON.parse(data) : [];
    }

    saveMarcas() {
        localStorage.setItem('marcas', JSON.stringify(this.marcas));
        this.loadMarcasList();
        this.updateStatus();
    }

    handleMarcaSubmit() {
        const nome = document.getElementById('nomeMarcaConfig').value.trim();
        const peso = parseFloat(document.getElementById('pesoMarcaConfig').value);

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
                    <div class="marca-nome">${marca.nome}</div>
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

    editMarca(id) {
        const marca = this.marcas.find(m => m.id === id);
        if (!marca) return;

        this.editingMarcaId = id;
        document.getElementById('nomeMarcaConfig').value = marca.nome;
        document.getElementById('pesoMarcaConfig').value = marca.peso;
        
        // Atualizar título do modal
        document.querySelector('#marcasModal .modal-header h3').textContent = 'Editar Marca';
    }

    deleteMarca(id) {
        if (!confirm('Tem certeza que deseja excluir esta marca?')) return;

        // Verificar se há produções vinculadas
        const producoes = JSON.parse(localStorage.getItem('producoes') || '[]');
        const producoesVinculadas = producoes.filter(p => p.marcaId === id);
        
        if (producoesVinculadas.length > 0) {
            this.showMessage('Não é possível excluir marca com produções registradas', 'error');
            return;
        }

        this.marcas = this.marcas.filter(m => m.id !== id);
        this.saveMarcas();
        this.showMessage('Marca excluída com sucesso', 'success');
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
