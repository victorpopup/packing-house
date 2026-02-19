// Script de Migração de Dados para Packing House
class DataMigrator {
    constructor() {
        this.db = window.packingHouseDB;
    }

    // Migrar dados iniciais do HTML para o banco de dados
    async migrateInitialData() {
        try {
            console.log('Iniciando migração de dados...');
            
            // Verificar se já existem dados
            const existingMaterials = await this.db.getAllMaterials();
            if (existingMaterials.length > 0) {
                console.log('Dados já existem no banco de dados. Migração cancelada.');
                return;
            }

            // Materiais iniciais baseados no HTML
            const initialMaterials = [
                {
                    name: 'Caixa Roxa',
                    quantity: 250,
                    unit: 'unidade',
                    minStock: 20,
                    status: 'Normal'
                },
                {
                    name: 'Bolsão',
                    quantity: 15,
                    unit: 'unidade',
                    minStock: 20,
                    status: 'Baixo'
                },
                {
                    name: 'Gerador',
                    quantity: 180,
                    unit: 'unidade',
                    minStock: 20,
                    status: 'Normal'
                },
                {
                    name: 'Strado',
                    quantity: 50,
                    unit: 'unidade',
                    minStock: 20,
                    status: 'Normal'
                }
            ];

            // Movimentações iniciais baseadas no HTML
            const initialMovements = [
                {
                    materialName: 'Caixa Roxa',
                    type: 'entrada',
                    quantity: 50,
                    unit: 'unidade',
                    date: '2026-02-15T14:30:00',
                    description: 'Entrada de caixas roxas'
                },
                {
                    materialName: 'Bolsão',
                    type: 'saida',
                    quantity: 20,
                    unit: 'unidade',
                    date: '2026-02-15T10:15:00',
                    description: 'Saída de bolsões'
                },
                {
                    materialName: 'Gerador',
                    type: 'entrada',
                    quantity: 30,
                    unit: 'unidade',
                    date: '2026-02-14T16:45:00',
                    description: 'Entrada de geradores'
                },
                {
                    materialName: 'Strado',
                    type: 'saida',
                    quantity: 10,
                    unit: 'unidade',
                    date: '2026-02-14T09:20:00',
                    description: 'Saída de strados'
                },
                {
                    materialName: 'Bolsão',
                    type: 'entrada',
                    quantity: 25,
                    unit: 'unidade',
                    date: '2026-02-13T11:30:00',
                    description: 'Entrada de bolsões'
                },
                {
                    materialName: 'Caixa Roxa',
                    type: 'saida',
                    quantity: 15,
                    unit: 'unidade',
                    date: '2026-02-12T15:20:00',
                    description: 'Saída de caixas roxas'
                },
                {
                    materialName: 'Strado',
                    type: 'entrada',
                    quantity: 40,
                    unit: 'unidade',
                    date: '2026-02-12T09:10:00',
                    description: 'Entrada de strados'
                }
            ];

            // Configurações iniciais
            const initialSettings = {
                'app_version': '1.0.0',
                'migration_date': new Date().toISOString(),
                'default_min_stock': 20,
                'company_name': 'Packing House',
                'currency': 'BRL'
            };

            // Migrar materiais
            console.log('Migrando materiais...');
            for (const material of initialMaterials) {
                await this.db.addMaterial(material);
                console.log(`Material migrado: ${material.name}`);
            }

            // Migrar movimentações
            console.log('Migrando movimentações...');
            for (const movement of initialMovements) {
                await this.db.addMovement(movement);
                console.log(`Movimentação migrada: ${movement.materialName} - ${movement.type}`);
            }

            // Migrar configurações
            console.log('Migrando configurações...');
            for (const [key, value] of Object.entries(initialSettings)) {
                await this.db.saveSetting(key, value);
                console.log(`Configuração migrada: ${key}`);
            }

            console.log('Migração concluída com sucesso!');
            
            // Salvar flag de migração
            await this.db.saveSetting('data_migrated', 'true');
            
            return {
                materialsMigrated: initialMaterials.length,
                movementsMigrated: initialMovements.length,
                settingsMigrated: Object.keys(initialSettings).length
            };

        } catch (error) {
            console.error('Erro durante a migração:', error);
            throw error;
        }
    }

    // Verificar se a migração já foi feita
    async isMigrated() {
        try {
            const migrated = await this.db.getSetting('data_migrated');
            return migrated === 'true';
        } catch (error) {
            console.error('Erro ao verificar migração:', error);
            return false;
        }
    }

    // Forçar nova migração (limpa dados existentes)
    async forceMigration() {
        try {
            console.log('Forçando nova migração...');
            
            // Limpar dados existentes
            await this.db.clearAll();
            
            // Remover flag de migração
            await this.db.saveSetting('data_migrated', 'false');
            
            // Executar migração
            return await this.migrateInitialData();
            
        } catch (error) {
            console.error('Erro ao forçar migração:', error);
            throw error;
        }
    }

    // Exportar dados atuais para backup
    async exportBackup() {
        try {
            const data = await this.db.exportData();
            
            // Criar blob para download
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            // Criar URL para download
            const url = URL.createObjectURL(blob);
            
            // Criar link de download
            const link = document.createElement('a');
            link.href = url;
            link.download = `packing-house-backup-${new Date().toISOString().split('T')[0]}.json`;
            
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

    // Importar dados de backup
    async importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    await this.db.importData(data);
                    console.log('Backup importado com sucesso');
                    resolve(data);
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

    // Obter informações sobre o banco de dados
    async getDatabaseInfo() {
        try {
            const materials = await this.db.getAllMaterials();
            const movements = await this.db.getAllMovements();
            const stats = await this.db.getStats();
            const migrated = await this.isMigrated();
            
            return {
                isMigrated: migrated,
                materialsCount: materials.length,
                movementsCount: movements.length,
                stats,
                lastMigration: await this.db.getSetting('migration_date')
            };
        } catch (error) {
            console.error('Erro ao obter informações do banco:', error);
            throw error;
        }
    }
}

// Instância global do migrador
window.dataMigrator = new DataMigrator();

// Iniciar migração automaticamente quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    // Esperar um pouco para garantir que o banco de dados foi inicializado
    setTimeout(async () => {
        try {
            const isMigrated = await window.dataMigrator.isMigrated();
            
            if (!isMigrated) {
                console.log('Iniciando migração automática de dados...');
                const result = await window.dataMigrator.migrateInitialData();
                console.log('Migração automática concluída:', result);
                
                // Mostrar mensagem de sucesso
                if (typeof showSuccessMessage === 'function') {
                    showSuccessMessage('Dados migrados com sucesso para o banco de dados local!');
                }
            } else {
                console.log('Dados já migrados anteriormente');
            }
        } catch (error) {
            console.error('Erro na migração automática:', error);
            
            // Mostrar mensagem de erro
            if (typeof alert === 'function') {
                alert('Erro ao migrar dados para o banco de dados. Por favor, recarregue a página.');
            }
        }
    }, 1000);
});
