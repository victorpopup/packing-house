// Sistema de Backup e Persistência - Packing House
class BackupManager {
    constructor() {
        this.backupKey = 'packing_house_backup';
        this.settingsKey = 'packing_house_settings';
        this.autoBackupInterval = 5 * 60 * 1000; // 5 minutos
        this.maxBackups = 10;
    }

    // Salvar backup no localStorage
    async saveBackup() {
        try {
            if (!window.packingHouseDB || !window.packingHouseDB.db) {
                console.warn('Banco de dados não disponível para backup');
                return;
            }

            const data = await window.packingHouseDB.exportData();
            const backup = {
                data,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            // Obter backups existentes
            const existingBackups = this.getExistingBackups();
            
            // Adicionar novo backup
            existingBackups.push(backup);
            
            // Manter apenas os backups mais recentes
            if (existingBackups.length > this.maxBackups) {
                existingBackups.splice(0, existingBackups.length - this.maxBackups);
            }

            // Salvar no localStorage
            localStorage.setItem(this.backupKey, JSON.stringify(existingBackups));
            
            console.log('Backup salvo com sucesso:', new Date().toISOString());
            
        } catch (error) {
            console.error('Erro ao salvar backup:', error);
        }
    }

    // Obter backups existentes
    getExistingBackups() {
        try {
            const backups = localStorage.getItem(this.backupKey);
            return backups ? JSON.parse(backups) : [];
        } catch (error) {
            console.error('Erro ao obter backups existentes:', error);
            return [];
        }
    }

    // Restaurar backup mais recente
    async restoreLatestBackup() {
        try {
            const backups = this.getExistingBackups();
            if (backups.length === 0) {
                throw new Error('Nenhum backup encontrado');
            }

            const latestBackup = backups[backups.length - 1];
            await window.packingHouseDB.importData(latestBackup.data);
            
            console.log('Backup restaurado com sucesso:', latestBackup.timestamp);
            return latestBackup;
            
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            throw error;
        }
    }

    // Restaurar backup específico
    async restoreBackup(timestamp) {
        try {
            const backups = this.getExistingBackups();
            const backup = backups.find(b => b.timestamp === timestamp);
            
            if (!backup) {
                throw new Error('Backup não encontrado');
            }

            await window.packingHouseDB.importData(backup.data);
            
            console.log('Backup restaurado com sucesso:', timestamp);
            return backup;
            
        } catch (error) {
            console.error('Erro ao restaurar backup específico:', error);
            throw error;
        }
    }

    // Listar backups disponíveis
    listBackups() {
        const backups = this.getExistingBackups();
        return backups.map(backup => ({
            timestamp: backup.timestamp,
            date: new Date(backup.timestamp).toLocaleString('pt-BR'),
            materialsCount: backup.data.materials ? backup.data.materials.length : 0,
            movementsCount: backup.data.movements ? backup.data.movements.length : 0,
            version: backup.version
        }));
    }

    // Limpar todos os backups
    clearBackups() {
        try {
            localStorage.removeItem(this.backupKey);
            console.log('Backups limpos com sucesso');
        } catch (error) {
            console.error('Erro ao limpar backups:', error);
        }
    }

    // Iniciar backup automático
    startAutoBackup() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
        }

        this.backupTimer = setInterval(async () => {
            await this.saveBackup();
        }, this.autoBackupInterval);

        console.log('Backup automático iniciado');
    }

    // Parar backup automático
    stopAutoBackup() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
            this.backupTimer = null;
            console.log('Backup automático parado');
        }
    }

    // Salvar configurações
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            console.log('Configurações salvas com sucesso');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
        }
    }

    // Obter configurações
    getSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Erro ao obter configurações:', error);
            return {};
        }
    }

    // Exportar backup para arquivo
    async exportBackupToFile(timestamp = null) {
        try {
            let backup;
            
            if (timestamp) {
                const backups = this.getExistingBackups();
                backup = backups.find(b => b.timestamp === timestamp);
                if (!backup) {
                    throw new Error('Backup não encontrado');
                }
            } else {
                // Exportar dados atuais
                backup = {
                    data: await window.packingHouseDB.exportData(),
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                };
            }

            // Criar blob para download
            const blob = new Blob([JSON.stringify(backup, null, 2)], {
                type: 'application/json'
            });
            
            // Criar URL para download
            const url = URL.createObjectURL(blob);
            
            // Criar link de download
            const link = document.createElement('a');
            link.href = url;
            link.download = `packing-house-backup-${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
            
            // Disparar download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpar URL
            URL.revokeObjectURL(url);
            
            console.log('Backup exportado com sucesso');
            
        } catch (error) {
            console.error('Erro ao exportar backup:', error);
            throw error;
        }
    }

    // Importar backup de arquivo
    async importBackupFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const backup = JSON.parse(event.target.result);
                    
                    // Validar estrutura do backup
                    if (!backup.data || !backup.data.materials || !backup.data.movements) {
                        throw new Error('Formato de backup inválido');
                    }

                    // Importar dados
                    await window.packingHouseDB.importData(backup.data);
                    
                    // Salvar backup no localStorage
                    await this.saveBackup();
                    
                    console.log('Backup importado com sucesso');
                    resolve(backup);
                    
                } catch (error) {
                    console.error('Erro ao importar backup:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erro ao ler arquivo de backup'));
            };
            
            reader.readAsText(file);
        });
    }

    // Verificar integridade dos dados
    async checkDataIntegrity() {
        try {
            const materials = await window.packingHouseDB.getAllMaterials();
            const movements = await window.packingHouseDB.getAllMovements();
            
            const issues = [];

            // Verificar materiais com quantidade negativa
            materials.forEach(material => {
                if (material.quantity < 0) {
                    issues.push({
                        type: 'negative_quantity',
                        material: material.name,
                        quantity: material.quantity
                    });
                }
            });

            // Verificar movimentações com materiais inexistentes
            movements.forEach(movement => {
                const materialExists = materials.some(m => m.name === movement.materialName);
                if (!materialExists) {
                    issues.push({
                        type: 'orphaned_movement',
                        movementId: movement.id,
                        materialName: movement.materialName
                    });
                }
            });

            // Verificar consistência das quantidades
            materials.forEach(material => {
                const materialMovements = movements.filter(m => m.materialName === material.name);
                let calculatedQuantity = 0;
                
                materialMovements.forEach(movement => {
                    if (movement.type === 'entrada') {
                        calculatedQuantity += movement.quantity;
                    } else {
                        calculatedQuantity -= movement.quantity;
                    }
                });

                // Se houver diferença significativa, registrar
                if (Math.abs(calculatedQuantity - material.quantity) > 5) {
                    issues.push({
                        type: 'quantity_mismatch',
                        material: material.name,
                        currentQuantity: material.quantity,
                        calculatedQuantity
                    });
                }
            });

            return {
                isValid: issues.length === 0,
                issues,
                materialsCount: materials.length,
                movementsCount: movements.length
            };
            
        } catch (error) {
            console.error('Erro ao verificar integridade:', error);
            throw error;
        }
    }

    // Obter estatísticas de backup
    getBackupStats() {
        const backups = this.getExistingBackups();
        const settings = this.getSettings();
        
        return {
            backupsCount: backups.length,
            oldestBackup: backups.length > 0 ? backups[0].timestamp : null,
            newestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
            autoBackupEnabled: !!this.backupTimer,
            settings
        };
    }
}

// Instância global do gerenciador de backup
window.backupManager = new BackupManager();

// Inicializar sistema de backup
document.addEventListener('DOMContentLoaded', async () => {
    // Esperar um pouco para garantir que o banco de dados foi inicializado
    setTimeout(async () => {
        try {
            // Iniciar backup automático
            window.backupManager.startAutoBackup();
            
            // Fazer backup inicial
            await window.backupManager.saveBackup();
            
            console.log('Sistema de backup inicializado com sucesso');
            
        } catch (error) {
            console.error('Erro ao inicializar sistema de backup:', error);
        }
    }, 2000);
});

// Salvar backup antes de fechar a página
window.addEventListener('beforeunload', async () => {
    try {
        await window.backupManager.saveBackup();
    } catch (error) {
        console.error('Erro ao salvar backup ao fechar página:', error);
    }
});
