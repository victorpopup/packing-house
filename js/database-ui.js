// Interface de Gerenciamento de Banco de Dados - Packing House

class DatabaseUI {
    constructor() {
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createStatusWidget();
        this.createBackupModal();
        this.setupEventListeners();
    }

    createStatusWidget() {
        const widget = document.createElement('div');
        widget.className = 'db-status-container';
        widget.id = 'dbStatusWidget';
        widget.innerHTML = `
            <div class="db-status-header">
                <span class="db-status-title">Banco de Dados</span>
                <div class="db-status-indicator"></div>
            </div>
            <div class="db-status-info">
                <strong>Materiais:</strong> <span id="materialsCount">0</span>
            </div>
            <div class="db-status-info">
                <strong>Movimentações:</strong> <span id="movementsCount">0</span>
            </div>
            <div class="db-status-info">
                <strong>Último Backup:</strong> <span id="lastBackup">Nunca</span>
            </div>
            <div class="db-actions">
                <button class="db-btn" onclick="window.databaseUI.showBackupModal()">Gerenciar Backups</button>
                <button class="db-btn" onclick="window.databaseUI.checkIntegrity()">Verificar Integridade</button>
                <button class="db-btn" onclick="window.databaseUI.exportData()">Exportar Dados</button>
            </div>
        `;

        document.body.appendChild(widget);
        this.updateStatus();
    }

    createBackupModal() {
        const modal = document.createElement('div');
        modal.className = 'backup-modal';
        modal.id = 'backupModal';
        modal.innerHTML = `
            <div class="backup-modal-content">
                <div class="backup-modal-header">
                    <h2 class="backup-modal-title">Gerenciamento de Backups</h2>
                    <span class="backup-close" onclick="window.databaseUI.closeBackupModal()">&times;</span>
                </div>

                <div class="backup-section">
                    <h3 class="backup-section-title">Estatísticas</h3>
                    <div class="backup-stats">
                        <div class="backup-stat-card">
                            <div class="backup-stat-number" id="totalBackups">0</div>
                            <div class="backup-stat-label">Backups Salvos</div>
                        </div>
                        <div class="backup-stat-card">
                            <div class="backup-stat-number" id="totalMaterials">0</div>
                            <div class="backup-stat-label">Materiais</div>
                        </div>
                        <div class="backup-stat-card">
                            <div class="backup-stat-number" id="totalMovements">0</div>
                            <div class="backup-stat-label">Movimentações</div>
                        </div>
                        <div class="backup-stat-card">
                            <div class="backup-stat-number" id="autoBackupStatus">Ativo</div>
                            <div class="backup-stat-label">Backup Auto</div>
                        </div>
                    </div>
                </div>

                <div class="backup-section">
                    <h3 class="backup-section-title">Ações Rápidas</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="backup-btn" onclick="window.databaseUI.createBackup()">Criar Backup Agora</button>
                        <button class="backup-btn" onclick="window.databaseUI.exportData()">Exportar para Arquivo</button>
                        <button class="backup-btn" onclick="window.databaseUI.showImportArea()">Importar Backup</button>
                        <button class="backup-btn backup-btn-danger" onclick="window.databaseUI.clearAllBackups()">Limpar Backups</button>
                    </div>
                </div>

                <div class="backup-section" id="importSection" style="display: none;">
                    <h3 class="backup-section-title">Importar Backup</h3>
                    <div class="backup-upload-area" id="uploadArea">
                        <div class="backup-upload-text">
                            Arraste um arquivo de backup aqui ou clique para selecionar
                        </div>
                        <button class="backup-upload-btn" onclick="document.getElementById('backupFileInput').click()">
                            Selecionar Arquivo
                        </button>
                        <input type="file" id="backupFileInput" accept=".json" style="display: none;">
                    </div>
                </div>

                <div class="backup-section">
                    <h3 class="backup-section-title">Backups Disponíveis</h3>
                    <div class="backup-list" id="backupList">
                        <!-- Backups serão carregados aqui -->
                    </div>
                </div>

                <div class="backup-section">
                    <h3 class="backup-section-title">Verificação de Integridade</h3>
                    <div id="integrityResults">
                        <button class="backup-btn" onclick="window.databaseUI.checkIntegrity()">
                            Verificar Integridade dos Dados
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Upload de arquivo
        const fileInput = document.getElementById('backupFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }

        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileImport({ target: { files } });
                }
            });
        }
    }

    async updateStatus() {
        try {
            if (!window.packingHouseDB || !window.packingHouseDB.db) {
                return;
            }

            const stats = await window.packingHouseDB.getStats();
            const backupStats = window.backupManager.getBackupStats();

            document.getElementById('materialsCount').textContent = stats.totalMaterials || 0;
            document.getElementById('movementsCount').textContent = movements.length || 0;
            
            const lastBackup = backupStats.newestBackup;
            if (lastBackup) {
                const date = new Date(lastBackup);
                document.getElementById('lastBackup').textContent = date.toLocaleString('pt-BR');
            } else {
                document.getElementById('lastBackup').textContent = 'Nunca';
            }

        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    }

    showBackupModal() {
        document.getElementById('backupModal').style.display = 'block';
        this.loadBackupList();
        this.updateBackupStats();
    }

    closeBackupModal() {
        document.getElementById('backupModal').style.display = 'none';
    }

    async loadBackupList() {
        try {
            const backups = window.backupManager.listBackups();
            const backupList = document.getElementById('backupList');
            
            if (backups.length === 0) {
                backupList.innerHTML = '<div style="color: #a8a8a8; text-align: center; padding: 20px;">Nenhum backup encontrado</div>';
                return;
            }

            backupList.innerHTML = backups.map(backup => `
                <div class="backup-item">
                    <div class="backup-info">
                        <div class="backup-date">${backup.date}</div>
                        <div class="backup-details">
                            Materiais: ${backup.materialsCount} | 
                            Movimentações: ${backup.movementsCount} | 
                            Versão: ${backup.version}
                        </div>
                    </div>
                    <div class="backup-actions">
                        <button class="backup-btn" onclick="window.databaseUI.restoreBackup('${backup.timestamp}')">
                            Restaurar
                        </button>
                        <button class="backup-btn" onclick="window.databaseUI.exportBackup('${backup.timestamp}')">
                            Exportar
                        </button>
                        <button class="backup-btn backup-btn-danger" onclick="window.databaseUI.deleteBackup('${backup.timestamp}')">
                            Excluir
                        </button>
                    </div>
                </div>
            `).reverse().join('');

        } catch (error) {
            console.error('Erro ao carregar lista de backups:', error);
        }
    }

    async updateBackupStats() {
        try {
            const stats = window.backupManager.getBackupStats();
            const dbStats = await window.packingHouseDB.getStats();
            
            document.getElementById('totalBackups').textContent = stats.backupsCount;
            document.getElementById('totalMaterials').textContent = dbStats.totalMaterials;
            document.getElementById('totalMovements').textContent = movements.length;
            document.getElementById('autoBackupStatus').textContent = stats.autoBackupEnabled ? 'Ativo' : 'Inativo';
            
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }

    async createBackup() {
        try {
            await window.backupManager.saveBackup();
            this.showSuccess('Backup criado com sucesso!');
            this.loadBackupList();
            this.updateBackupStats();
            this.updateStatus();
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            this.showError('Erro ao criar backup: ' + error.message);
        }
    }

    async restoreBackup(timestamp) {
        if (!confirm('Tem certeza que deseja restaurar este backup? Os dados atuais serão substituídos.')) {
            return;
        }

        try {
            await window.backupManager.restoreBackup(timestamp);
            this.showSuccess('Backup restaurado com sucesso!');
            
            // Recarregar a página para atualizar todos os dados
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            this.showError('Erro ao restaurar backup: ' + error.message);
        }
    }

    async exportBackup(timestamp) {
        try {
            await window.backupManager.exportBackupToFile(timestamp);
            this.showSuccess('Backup exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar backup:', error);
            this.showError('Erro ao exportar backup: ' + error.message);
        }
    }

    async exportData() {
        try {
            await window.backupManager.exportBackupToFile();
            this.showSuccess('Dados exportados com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            this.showError('Erro ao exportar dados: ' + error.message);
        }
    }

    async deleteBackup(timestamp) {
        if (!confirm('Tem certeza que deseja excluir este backup?')) {
            return;
        }

        try {
            const backups = window.backupManager.getExistingBackups();
            const filteredBackups = backups.filter(b => b.timestamp !== timestamp);
            
            localStorage.setItem('packing_house_backup', JSON.stringify(filteredBackups));
            
            this.showSuccess('Backup excluído com sucesso!');
            this.loadBackupList();
            this.updateBackupStats();
            
        } catch (error) {
            console.error('Erro ao excluir backup:', error);
            this.showError('Erro ao excluir backup: ' + error.message);
        }
    }

    async clearAllBackups() {
        if (!confirm('Tem certeza que deseja excluir todos os backups? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            window.backupManager.clearBackups();
            this.showSuccess('Todos os backups foram excluídos!');
            this.loadBackupList();
            this.updateBackupStats();
            
        } catch (error) {
            console.error('Erro ao limpar backups:', error);
            this.showError('Erro ao limpar backups: ' + error.message);
        }
    }

    showImportArea() {
        const importSection = document.getElementById('importSection');
        importSection.style.display = importSection.style.display === 'none' ? 'block' : 'none';
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            this.showError('Por favor, selecione um arquivo JSON válido.');
            return;
        }

        try {
            await window.backupManager.importBackupFromFile(file);
            this.showSuccess('Backup importado com sucesso!');
            
            // Recarregar a página para atualizar todos os dados
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            this.showError('Erro ao importar backup: ' + error.message);
        }
    }

    async checkIntegrity() {
        try {
            const results = await window.backupManager.checkDataIntegrity();
            const integrityResults = document.getElementById('integrityResults');
            
            if (results.isValid) {
                integrityResults.innerHTML = `
                    <div class="integrity-ok">
                        ✓ Todos os dados estão consistentes e íntegros
                    </div>
                `;
            } else {
                const issuesHtml = results.issues.map(issue => 
                    `<div class="integrity-issue">
                        ⚠ ${this.formatIssue(issue)}
                    </div>`
                ).join('');
                
                integrityResults.innerHTML = `
                    <div class="integrity-issues">
                        <div style="color: #ff6b6b; font-weight: 600; margin-bottom: 10px;">
                            Foram encontrados ${results.issues.length} problemas de integridade:
                        </div>
                        ${issuesHtml}
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Erro ao verificar integridade:', error);
            this.showError('Erro ao verificar integridade: ' + error.message);
        }
    }

    formatIssue(issue) {
        switch (issue.type) {
            case 'negative_quantity':
                return `Material "${issue.material}" com quantidade negativa: ${issue.quantity}`;
            case 'orphaned_movement':
                return `Movimentação órfã para material inexistente: ${issue.materialName}`;
            case 'quantity_mismatch':
                return `Inconsistência no material "${issue.material}": atual ${issue.currentQuantity}, calculado ${issue.calculatedQuantity}`;
            default:
                return `Problema desconhecido: ${JSON.stringify(issue)}`;
        }
    }

    showSuccess(message) {
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage(message);
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (typeof showError === 'function') {
            showError(message);
        } else {
            alert('Erro: ' + message);
        }
    }
}

// Inicializar a interface quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.databaseUI = new DatabaseUI();
        
        // Atualizar status periodicamente
        setInterval(() => {
            window.databaseUI.updateStatus();
        }, 30000); // 30 segundos
    }, 3000);
});
