// Script de Verificação de Marcas no Banco de Dados
// Verifica se o gerenciador de marcas está integrado e funcionando

class BrandVerification {
    constructor() {
        this.db = window.packingHouseDB;
        this.results = {
            databaseReady: false,
            brandsTableExists: false,
            brandsOperations: {
                getAll: false,
                add: false,
                update: false,
                delete: false
            },
            sampleData: null,
            configManager: false
        };
    }

    async runFullVerification() {
        console.log('🔍 Iniciando verificação completa de marcas...');
        
        try {
            await this.waitForDatabase();
            await this.checkDatabaseStructure();
            await this.testBrandOperations();
            await this.testConfigManagerIntegration();
            await this.createSampleData();
            
            this.displayResults();
            return this.results;
            
        } catch (error) {
            console.error('❌ Erro na verificação:', error);
            this.results.error = error.message;
            this.displayResults();
            return this.results;
        }
    }

    async waitForDatabase() {
        console.log('⏳ Aguardando banco de dados...');
        let attempts = 0;
        while (!this.db || !this.db.db) {
            attempts++;
            if (attempts > 50) {
                throw new Error('Banco de dados não ficou pronto a tempo');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.results.databaseReady = true;
        console.log('✅ Banco de dados está pronto!');
    }

    async checkDatabaseStructure() {
        console.log('🏗️ Verificando estrutura do banco...');
        
        const tables = Array.from(this.db.db.objectStoreNames);
        console.log('📊 Tabelas encontradas:', tables);
        
        if (tables.includes('brands')) {
            this.results.brandsTableExists = true;
            console.log('✅ Tabela "brands" existe!');
        } else {
            console.log('❌ Tabela "brands" NÃO existe!');
        }
    }

    async testBrandOperations() {
        console.log('🧪 Testando operações de marcas...');
        
        // Testar getAllBrands
        try {
            const brands = await this.db.getAllBrands();
            this.results.brandsOperations.getAll = true;
            console.log(`✅ getAllBrands funcionou! Encontradas: ${brands.length} marcas`);
        } catch (error) {
            console.error('❌ getAllBrands falhou:', error);
        }

        // Testar addBrand
        try {
            const testBrand = { name: 'Marca Teste', peso: 1.5 };
            const id = await this.db.addBrand(testBrand);
            this.results.brandsOperations.add = true;
            console.log('✅ addBrand funcionou! ID:', id);
            
            // Testar updateBrand
            try {
                await this.db.updateBrand(id, { name: 'Marca Teste Atualizada', peso: 2.0 });
                this.results.brandsOperations.update = true;
                console.log('✅ updateBrand funcionou!');
            } catch (error) {
                console.error('❌ updateBrand falhou:', error);
            }
            
            // Testar deleteBrand
            try {
                await this.db.deleteBrand(id);
                this.results.brandsOperations.delete = true;
                console.log('✅ deleteBrand funcionou!');
            } catch (error) {
                console.error('❌ deleteBrand falhou:', error);
            }
            
        } catch (error) {
            console.error('❌ addBrand falhou:', error);
        }
    }

    async testConfigManagerIntegration() {
        console.log('🔗 Testando integração com gerenciador de configurações...');
        
        if (window.configuracaoCadastrosManager) {
            this.results.configManager = true;
            console.log('✅ Gerenciador de configurações encontrado!');
            
            // Verificar se tem dados de marcas
            if (window.configuracaoCadastrosManager.marcas) {
                console.log(`📦 Gerenciador tem ${window.configuracaoCadastrosManager.marcas.length} marcas na memória`);
            }
        } else {
            console.log('❌ Gerenciador de configurações NÃO encontrado!');
        }
    }

    async createSampleData() {
        console.log('🎯 Criando dados de exemplo...');
        
        try {
            // Verificar se já existem marcas
            const existingBrands = await this.db.getAllBrands();
            
            if (existingBrands.length === 0) {
                // Criar marcas de exemplo
                const sampleBrands = [
                    { name: 'Natura', peso: 0.5 },
                    { name: 'Avon', peso: 0.8 },
                    { name: 'O Boticário', peso: 0.6 }
                ];
                
                for (const brand of sampleBrands) {
                    await this.db.addBrand(brand);
                }
                
                this.results.sampleData = 'created';
                console.log('✅ Dados de exemplo criados!');
            } else {
                this.results.sampleData = 'existing';
                console.log(`ℹ️ Já existem ${existingBrands.length} marcas no banco`);
            }
            
        } catch (error) {
            console.error('❌ Erro ao criar dados de exemplo:', error);
            this.results.sampleData = 'error';
        }
    }

    displayResults() {
        console.log('\n📋 RESULTADO DA VERIFICAÇÃO DE MARCAS:');
        console.log('=' .repeat(50));
        console.log(`🗄️ Banco de dados pronto: ${this.results.databaseReady ? '✅' : '❌'}`);
        console.log(`📋 Tabela brands existe: ${this.results.brandsTableExists ? '✅' : '❌'}`);
        console.log(`🔗 Gerenciador integrado: ${this.results.configManager ? '✅' : '❌'}`);
        console.log('\n🧪 Operações do Banco:');
        console.log(`   • getAllBrands: ${this.results.brandsOperations.getAll ? '✅' : '❌'}`);
        console.log(`   • addBrand: ${this.results.brandsOperations.add ? '✅' : '❌'}`);
        console.log(`   • updateBrand: ${this.results.brandsOperations.update ? '✅' : '❌'}`);
        console.log(`   • deleteBrand: ${this.results.brandsOperations.delete ? '✅' : '❌'}`);
        console.log(`\n📦 Dados de exemplo: ${this.results.sampleData}`);
        
        if (this.results.error) {
            console.log(`\n❌ Erro: ${this.results.error}`);
        }
        
        // Status geral
        const allOperationsWorking = Object.values(this.results.brandsOperations).every(v => v === true);
        const everythingWorking = this.results.databaseReady && 
                                this.results.brandsTableExists && 
                                allOperationsWorking && 
                                this.results.configManager;
        
        console.log('\n' + '=' .repeat(50));
        if (everythingWorking) {
            console.log('🎉 SISTEMA DE MARCAS ESTÁ 100% FUNCIONAL!');
        } else {
            console.log('⚠️ SISTEMA DE MARCAS PRECISA DE ATENÇÃO!');
        }
        console.log('=' .repeat(50));
    }
}

// Função global para verificação manual
window.verifyBrands = async () => {
    const verifier = new BrandVerification();
    return await verifier.runFullVerification();
};

// Executar verificação automática ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        console.log('🚀 Iniciando verificação automática de marcas...');
        await window.verifyBrands();
    }, 3000);
});

console.log('🔍 Verificação de marcas disponível. Use window.verifyBrands() para verificação manual.');
