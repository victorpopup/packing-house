// Script de Debug para Configuração
// Adiciona logs detalhados para identificar o problema

console.log('🔍 Script de debug carregado');

// Adicionar listeners globais para capturar erros
window.addEventListener('error', function(event) {
    console.error('🚨 Erro global capturado:', event.error);
    console.error('📍 Arquivo:', event.filename);
    console.error('📍 Linha:', event.lineno);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Promise rejeitada não tratada:', event.reason);
});

// Verificar estado do banco de dados
function debugDatabaseState() {
    console.log('🔍 Verificando estado do banco de dados...');
    
    if (!window.packingHouseDB) {
        console.error('❌ window.packingHouseDB não existe');
        return false;
    }
    
    if (!window.packingHouseDB.db) {
        console.error('❌ packingHouseDB.db não existe');
        return false;
    }
    
    console.log('✅ Banco de dados parece estar OK');
    console.log('📊 Nome do banco:', window.packingHouseDB.dbName);
    console.log('📊 Versão:', window.packingHouseDB.dbVersion);
    
    // Verificar tabelas
    const tables = Array.from(window.packingHouseDB.db.objectStoreNames);
    console.log('📊 Tabelas disponíveis:', tables);
    
    if (!tables.includes('brands')) {
        console.warn('⚠️ Tabela "brands" não encontrada');
    }
    
    return true;
}

// Função para testar operações do banco de dados
async function testDatabaseOperations() {
    console.log('🧪 Testando operações do banco de dados...');
    
    try {
        // Testar getAllMaterials
        console.log('📦 Testando getAllMaterials...');
        const materials = await window.packingHouseDB.getAllMaterials();
        console.log('✅ getAllMaterials funcionou, materiais:', materials.length);
        
        // Testar getAllBrands se existir
        if (typeof window.packingHouseDB.getAllBrands === 'function') {
            console.log('🏷️ Testando getAllBrands...');
            const brands = await window.packingHouseDB.getAllBrands();
            console.log('✅ getAllBrands funcionou, marcas:', brands.length);
        } else {
            console.warn('⚠️ getAllBrands não é uma função');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao testar operações:', error);
        return false;
    }
}

// Executar debug quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM carregado, iniciando debug...');
    
    // Esperar um pouco para o banco inicializar
    setTimeout(async () => {
        console.log('⏰ Iniciando verificação após 2 segundos...');
        
        const dbState = debugDatabaseState();
        if (dbState) {
            await testDatabaseOperations();
        }
        
        // Verificar se o gerenciador de configurações foi inicializado
        if (window.configuracaoCadastrosManager) {
            console.log('✅ Gerenciador de configurações encontrado');
        } else {
            console.warn('⚠️ Gerenciador de configurações não encontrado');
        }
    }, 2000);
});

// Adicionar função global para debug manual
window.debugConfig = {
    checkDatabase: debugDatabaseState,
    testOperations: testDatabaseOperations,
    reloadPage: () => {
        console.log('🔄 Recarregando página...');
        window.location.reload();
    },
    clearDatabase: async () => {
        if (confirm('Tem certeza que deseja limpar o banco de dados?')) {
            try {
                await window.packingHouseDB.clearAll();
                console.log('✅ Banco de dados limpo');
                window.location.reload();
            } catch (error) {
                console.error('❌ Erro ao limpar banco:', error);
            }
        }
    }
};

console.log('🔧 Funções de debug disponíveis em window.debugConfig');
