// JavaScript da Página de Configuração - Packing House

class ConfiguracaoManager {
    constructor() {
        this.init();
    }

    async init() {
        // Esperar o banco de dados estar pronto
        setTimeout(async () => {
            await this.loadSystemStatus();
            this.setupEventListeners();
            this.startStatusUpdates();
        }, 2000);
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

    async loadSystemStatus() {
        try {
            if (!window.packingHouseDB || !window.packingHouseDB.db) {
                return;
            }

            const stats = await window.packingHouseDB.getStats();
            const backupStats = window.backupManager.getBackupStats();

            // Atualizar contadores
            document.getElementById('materialsCount').textContent = stats.totalMaterials || 0;
            document.getElementById('movementsCount').textContent = movements.length || 0;
            
            // Atualizar status do último backup
            const lastBackup = backupStats.newestBackup;
            if (lastBackup) {
                const date = new Date(lastBackup);
                const now = new Date();
                const diffHours = (now - date) / (1000 * 60 * 60);
                
                let statusText = date.toLocaleString('pt-BR');
                if (diffHours < 1) {
                    statusText += ' (Recente)';
                } else if (diffHours < 24) {
                    statusText += ` (${Math.floor(diffHours)}h atrás)`;
                } else {
                    statusText += ` (${Math.floor(diffHours / 24)}d atrás)`;
                }
                
                document.getElementById('lastBackupStatus').textContent = statusText;
            } else {
                document.getElementById('lastBackupStatus').textContent = 'Nunca';
            }

        } catch (error) {
            console.error('Erro ao carregar status do sistema:', error);
        }
    }

    startStatusUpdates() {
        // Atualizar status a cada 30 segundos
        setInterval(() => {
            this.loadSystemStatus();
        }, 30000);
    }

    // === FUNÇÕES DE BACKUP ===

    async createBackupNow() {
        try {
            await window.backupManager.saveBackup();
            this.showSuccess('Backup criado com sucesso!');
            await this.loadSystemStatus();
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            this.showError('Erro ao criar backup: ' + error.message);
        }
    }

    async exportAllData() {
        try {
            await window.backupManager.exportBackupToFile();
            this.showSuccess('Dados exportados com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            this.showError('Erro ao exportar dados: ' + error.message);
        }
    }

    showImportArea() {
        const importSection = document.getElementById('importSection');
        importSection.style.display = importSection.style.display === 'none' ? 'block' : 'none';
        
        // Rolar para a área de importação
        if (importSection.style.display === 'block') {
            importSection.scrollIntoView({ behavior: 'smooth' });
        }
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
            
            // Recarregar a página após 2 segundos
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            this.showError('Erro ao importar backup: ' + error.message);
        }
    }

    async checkDataIntegrity() {
        try {
            const results = await window.backupManager.checkDataIntegrity();
            
            if (results.isValid) {
                this.showSuccess('✅ Todos os dados estão consistentes e íntegros!');
            } else {
                let message = `⚠️ Foram encontrados ${results.issues.length} problemas:\n\n`;
                results.issues.forEach((issue, index) => {
                    message += `${index + 1}. ${this.formatIssue(issue)}\n`;
                });
                
                this.showError(message);
            }
            
        } catch (error) {
            console.error('Erro ao verificar integridade:', error);
            this.showError('Erro ao verificar integridade: ' + error.message);
        }
    }

    // === FUNÇÕES AVANÇADAS ===

    async confirmClearAllData() {
        const confirmText = prompt('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados do sistema (materiais, movimentações, configurações e backups).\n\nDigite "LIMPAR TUDO" para confirmar:');
        
        if (confirmText === 'LIMPAR TUDO') {
            try {
                await window.packingHouseDB.clearAll();
                window.backupManager.clearBackups();
                
                this.showSuccess('Todos os dados foram limpos com sucesso!');
                
                // Recarregar a página após 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                
            } catch (error) {
                console.error('Erro ao limpar dados:', error);
                this.showError('Erro ao limpar dados: ' + error.message);
            }
        } else if (confirmText !== null) {
            this.showError('Texto de confirmação incorreto. Operação cancelada.');
        }
    }

    async confirmClearBackups() {
        if (!confirm('Tem certeza que deseja excluir todos os backups? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            window.backupManager.clearBackups();
            this.showSuccess('Todos os backups foram excluídos!');
            await this.loadSystemStatus();
        } catch (error) {
            console.error('Erro ao limpar backups:', error);
            this.showError('Erro ao limpar backups: ' + error.message);
        }
    }

    async confirmClearHistory() {
        if (!confirm('Tem certeza que deseja excluir todo o histórico de movimentações? Esta ação não pode ser desfeita, mas os materiais cadastrados serão mantidos.')) {
            return;
        }

        try {
            await window.packingHouseDB.clearMovementsHistory();
            
            // Limpar array de movimentações da memória
            if (typeof movements !== 'undefined') {
                movements.length = 0;
            }
            
            this.showSuccess('Histórico de movimentações excluído com sucesso!');
            
            // Atualizar status do sistema
            await this.loadSystemStatus();
            
        } catch (error) {
            console.error('Erro ao limpar histórico:', error);
            this.showError('Erro ao limpar histórico: ' + error.message);
        }
    }

    async showStatistics() {
        try {
            const stats = await window.packingHouseDB.getStats();
            const backupStats = window.backupManager.getBackupStats();
            const integrity = await window.backupManager.checkDataIntegrity();
            
            let message = '📊 ESTATÍSTICAS DO SISTEMA\n\n';
            message += '📦 MATERIAIS:\n';
            message += `• Total: ${stats.totalMaterials}\n`;
            message += `• Quantidade Total: ${stats.totalQuantity.toLocaleString()}\n`;
            message += `• Estoque Baixo: ${stats.lowStockCount}\n\n`;
            
            message += '🔄 MOVIMENTAÇÕES:\n';
            message += `• Total: ${movements.length}\n`;
            message += `• Hoje: ${stats.todayMovements}\n\n`;
            
            message += '💾 BACKUPS:\n';
            message += `• Salvos: ${backupStats.backupsCount}\n`;
            message += `• Auto: ${backupStats.autoBackupEnabled ? 'Ativo' : 'Inativo'}\n`;
            if (backupStats.oldestBackup) {
                message += `• Mais Antigo: ${new Date(backupStats.oldestBackup).toLocaleString('pt-BR')}\n`;
            }
            if (backupStats.newestBackup) {
                message += `• Mais Recente: ${new Date(backupStats.newestBackup).toLocaleString('pt-BR')}\n`;
            }
            
            message += '\n🔍 INTEGRIDADE:\n';
            message += `• Status: ${integrity.isValid ? '✅ OK' : '⚠️ Problemas'}\n`;
            if (!integrity.isValid) {
                message += `• Problemas: ${integrity.issues.length}\n`;
            }
            
            alert(message);
            
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            this.showError('Erro ao obter estatísticas: ' + error.message);
        }
    }

    showRestoreOptions() {
        this.showBackupModal();
    }

    // === MODAL DE BACKUPS ===

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
                        <button class="backup-btn" onclick="window.configManager.restoreBackup('${backup.timestamp}')">
                            Restaurar
                        </button>
                        <button class="backup-btn" onclick="window.configManager.exportBackup('${backup.timestamp}')">
                            Exportar
                        </button>
                        <button class="backup-btn backup-btn-danger" onclick="window.configManager.deleteBackup('${backup.timestamp}')">
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
            await this.loadSystemStatus();
            
        } catch (error) {
            console.error('Erro ao excluir backup:', error);
            this.showError('Erro ao excluir backup: ' + error.message);
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

    // === UTILITÁRIOS ===

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
            alert('✅ ' + message);
        }
    }

    showError(message) {
        if (typeof showError === 'function') {
            showError(message);
        } else {
            alert('❌ Erro: ' + message);
        }
    }
}

// Variável global para o gerenciador
window.configManager = null;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.configManager = new ConfiguracaoManager();
    }, 1000);
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('backupModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Funções globais para acesso via onclick
window.createBackupNow = () => window.configManager.createBackupNow();
window.exportAllData = () => window.configManager.exportAllData();
window.showImportArea = () => window.configManager.showImportArea();
window.checkDataIntegrity = () => window.configManager.checkDataIntegrity();
window.confirmClearAllData = () => window.configManager.confirmClearAllData();
window.confirmClearBackups = () => window.configManager.confirmClearBackups();
window.confirmClearHistory = () => window.configManager.confirmClearHistory();
window.showStatistics = () => window.configManager.showStatistics();
window.showRestoreOptions = () => window.configManager.showRestoreOptions();
window.closeBackupModal = () => window.configManager.closeBackupModal();
window.checkIntegrity = () => window.configManager.checkIntegrity();
