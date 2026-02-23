// Script de Migração de Dados do LocalStorage para IndexedDB
// Este script migra dados existentes do localStorage para o IndexedDB

class MigrationManager {
    constructor() {
        this.db = window.packingHouseDB;
    }

    async migrateAllData() {
        console.log('Iniciando migração de dados...');
        
        try {
            await this.waitForDatabase();
            
            const results = {
                materials: await this.migrateMaterials(),
                brands: await this.migrateBrands()
            };
            
            console.log('Migração concluída:', results);
            return results;
        } catch (error) {
            console.error('Erro durante migração:', error);
            throw error;
        }
    }

    async waitForDatabase() {
        while (!this.db || !this.db.db) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async migrateMaterials() {
        try {
            // Verificar se já existem materiais no IndexedDB
            const existingMaterials = await this.db.getAllMaterials();
            
            if (existingMaterials.length > 0) {
                console.log(`Já existem ${existingMaterials.length} materiais no IndexedDB. Pulando migração de materiais.`);
                return { migrated: 0, skipped: existingMaterials.length };
            }

            // Buscar materiais do localStorage
            const localStorageMaterials = localStorage.getItem('materiais');
            if (!localStorageMaterials) {
                console.log('Nenhum material encontrado no localStorage para migrar.');
                return { migrated: 0, skipped: 0 };
            }

            const materials = JSON.parse(localStorageMaterials);
            console.log(`Encontrados ${materials.length} materiais no localStorage para migrar.`);

            let migratedCount = 0;
            
            for (const material of materials) {
                try {
                    // Converter formato do localStorage para IndexedDB
                    const dbMaterial = {
                        name: material.nome || material.name,
                        quantity: material.quantidade || material.quantity,
                        status: material.status || (material.quantity < 20 ? 'Baixo' : 'Normal')
                    };

                    await this.db.addMaterial(dbMaterial);
                    migratedCount++;
                    console.log(`Material migrado: ${dbMaterial.name}`);
                } catch (error) {
                    console.error(`Erro ao migrar material ${material.nome || material.name}:`, error);
                }
            }

            // Limpar localStorage após migração bem-sucedida
            if (migratedCount > 0) {
                localStorage.removeItem('materiais');
                console.log('LocalStorage de materiais limpo após migração.');
            }

            return { migrated: migratedCount, skipped: 0 };
        } catch (error) {
            console.error('Erro na migração de materiais:', error);
            throw error;
        }
    }

    async migrateBrands() {
        try {
            // Verificar se já existem marcas no IndexedDB
            const existingBrands = await this.db.getAllBrands();
            
            if (existingBrands.length > 0) {
                console.log(`Já existem ${existingBrands.length} marcas no IndexedDB. Pulando migração de marcas.`);
                return { migrated: 0, skipped: existingBrands.length };
            }

            // Buscar marcas do localStorage
            const localStorageBrands = localStorage.getItem('marcas');
            if (!localStorageBrands) {
                console.log('Nenhuma marca encontrada no localStorage para migrar.');
                return { migrated: 0, skipped: 0 };
            }

            const brands = JSON.parse(localStorageBrands);
            console.log(`Encontradas ${brands.length} marcas no localStorage para migrar.`);

            let migratedCount = 0;
            
            for (const brand of brands) {
                try {
                    // Converter formato do localStorage para IndexedDB
                    const dbBrand = {
                        name: brand.nome || brand.name,
                        peso: brand.peso || brand.peso
                    };

                    await this.db.addBrand(dbBrand);
                    migratedCount++;
                    console.log(`Marca migrada: ${dbBrand.name}`);
                } catch (error) {
                    console.error(`Erro ao migrar marca ${brand.nome || brand.name}:`, error);
                }
            }

            // Limpar localStorage após migração bem-sucedida
            if (migratedCount > 0) {
                localStorage.removeItem('marcas');
                console.log('LocalStorage de marcas limpo após migração.');
            }

            return { migrated: migratedCount, skipped: 0 };
        } catch (error) {
            console.error('Erro na migração de marcas:', error);
            throw error;
        }
    }

    async checkMigrationNeeded() {
        try {
            await this.waitForDatabase();
            
            const localStorageMaterials = localStorage.getItem('materiais');
            const localStorageBrands = localStorage.getItem('marcas');
            const dbMaterials = await this.db.getAllMaterials();
            const dbBrands = await this.db.getAllBrands();
            
            return {
                materialsNeeded: !!localStorageMaterials && dbMaterials.length === 0,
                brandsNeeded: !!localStorageBrands && dbBrands.length === 0,
                localStorageMaterialsCount: localStorageMaterials ? JSON.parse(localStorageMaterials).length : 0,
                localStorageBrandsCount: localStorageBrands ? JSON.parse(localStorageBrands).length : 0,
                dbMaterialsCount: dbMaterials.length,
                dbBrandsCount: dbBrands.length
            };
        } catch (error) {
            console.error('Erro ao verificar necessidade de migração:', error);
            return { error: error.message };
        }
    }
}

// Executar migração automaticamente se necessário
window.migrationManager = new MigrationManager();

document.addEventListener('DOMContentLoaded', async () => {
    // Esperar um pouco para garantir que tudo esteja carregado
    setTimeout(async () => {
        try {
            const check = await window.migrationManager.checkMigrationNeeded();
            
            if (check.materialsNeeded || check.brandsNeeded) {
                console.log('Migração necessária detectada:', check);
                
                // Mostrar mensagem para o usuário
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border-radius: 8px;
                    font-weight: 500;
                    z-index: 10001;
                    max-width: 400px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                `;
                messageDiv.innerHTML = `
                    <div style="margin-bottom: 10px;">🔄 Migração de Dados</div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        Detectamos dados antigos que precisam ser migrados para o novo formato. 
                        Isso levará apenas alguns segundos...
                    </div>
                `;
                document.body.appendChild(messageDiv);
                
                // Executar migração
                const results = await window.migrationManager.migrateAllData();
                
                // Atualizar mensagem
                messageDiv.innerHTML = `
                    <div style="margin-bottom: 10px;">✅ Migração Concluída</div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        Materiais: ${results.materials.migrated} migrados<br>
                        Marcas: ${results.brands.migrated} migradas
                    </div>
                `;
                
                // Remover mensagem após 3 segundos
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 3000);
                
                // Recarregar a página para atualizar tudo
                setTimeout(() => {
                    window.location.reload();
                }, 3500);
            }
        } catch (error) {
            console.error('Erro no processo de migração automática:', error);
        }
    }, 2000);
});
