// Script de Migração de Marcas para Produção
// Garante que marcas do localStorage sejam migradas para o IndexedDB

class ProductionBrandMigration {
    constructor() {
        this.db = window.packingHouseDB;
    }

    async migrateIfNeeded() {
        console.log('🔄 Verificando necessidade de migração de marcas para produção...');
        
        try {
            await this.waitForDatabase();
            
            // Verificar marcas no IndexedDB
            const indexedDBBrands = await this.db.getAllBrands();
            console.log(`📊 IndexedDB: ${indexedDBBrands.length} marcas`);
            
            // Verificar marcas no localStorage
            const localStorageBrands = JSON.parse(localStorage.getItem('marcas') || '[]');
            console.log(`💾 LocalStorage: ${localStorageBrands.length} marcas`);
            
            if (indexedDBBrands.length === 0 && localStorageBrands.length > 0) {
                console.log('🚨 Migrando marcas do localStorage para IndexedDB...');
                
                let migratedCount = 0;
                for (const brand of localStorageBrands) {
                    try {
                        await this.db.addBrand({
                            name: brand.nome || brand.name,
                            peso: brand.peso
                        });
                        migratedCount++;
                        console.log(`✅ Marca migrada: ${brand.nome || brand.name}`);
                    } catch (error) {
                        console.error(`❌ Erro ao migrar marca ${brand.nome || brand.name}:`, error);
                    }
                }
                
                if (migratedCount > 0) {
                    console.log(`🎉 Migração concluída! ${migratedCount} marcas migradas`);
                    
                    // Limpar localStorage após migração bem-sucedida
                    localStorage.removeItem('marcas');
                    console.log('🧹 LocalStorage limpo');
                    
                    // Recarregar ProductionManager se existir
                    if (window.productionManager) {
                        await window.productionManager.loadData();
                        window.productionManager.populateFiltroMarcas();
                        console.log('🔄 ProductionManager recarregado');
                    }
                    
                    return { migrated: migratedCount, success: true };
                }
            } else if (indexedDBBrands.length > 0) {
                console.log('✅ Marcas já existem no IndexedDB');
                return { migrated: 0, success: true, existing: indexedDBBrands.length };
            } else {
                console.log('ℹ️ Nenhuma marca encontrada para migrar');
                return { migrated: 0, success: true, existing: 0 };
            }
            
        } catch (error) {
            console.error('❌ Erro na migração de marcas:', error);
            return { migrated: 0, success: false, error: error.message };
        }
    }

    async waitForDatabase() {
        while (!this.db || !this.db.db) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

// Executar migração automaticamente
window.productionBrandMigration = new ProductionBrandMigration();

document.addEventListener('DOMContentLoaded', async () => {
    // Esperar um pouco para garantir que tudo esteja carregado
    setTimeout(async () => {
        const result = await window.productionBrandMigration.migrateIfNeeded();
        
        if (result.migrated > 0) {
            // Mostrar notificação para o usuário
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
                <div style="margin-bottom: 10px;">🔄 Migração de Marcas</div>
                <div style="font-size: 14px; opacity: 0.9;">
                    ${result.migrated} marcas migradas para o novo sistema
                </div>
            `;
            document.body.appendChild(messageDiv);
            
            // Remover mensagem após 3 segundos
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 3000);
        }
    }, 3000);
});

// Função global para migração manual
window.migrateProductionBrands = async () => {
    try {
        const result = await window.productionBrandMigration.migrateIfNeeded();
        
        if (result.success) {
            alert(`✅ Migração concluída!\n\n📦 Migradas: ${result.migrated} marcas\n✅ Existentes: ${result.existing || 0} marcas`);
            
            if (result.migrated > 0 && window.productionManager) {
                window.location.reload();
            }
        } else {
            alert('❌ Erro na migração: ' + result.error);
        }
    } catch (error) {
        alert('❌ Erro ao executar migração: ' + error.message);
    }
};

console.log('🔄 Migração de marcas para produção disponível. Use window.migrateProductionBrands() para migração manual.');
