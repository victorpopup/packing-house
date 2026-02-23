// Script para corrigir materiais sem campo 'unit'
// Adiciona 'unidade' como padrão para materiais que não têm este campo

class UnitFixer {
    constructor() {
        this.db = window.packingHouseDB;
    }

    async fixAllMaterials() {
        console.log('🔧 Iniciando correção de unidades...');
        
        try {
            await this.waitForDatabase();
            const materials = await this.db.getAllMaterials();
            
            console.log(`📊 Verificando ${materials.length} materiais...`);
            
            let fixedCount = 0;
            let alreadyFixedCount = 0;
            
            for (const material of materials) {
                if (!material.unit) {
                    // Corrigir material sem unit
                    await this.db.updateMaterial(material.id, {
                        unit: 'unidade'
                    });
                    fixedCount++;
                    console.log(`✅ Material corrigido: ${material.name}`);
                } else {
                    alreadyFixedCount++;
                }
            }
            
            console.log(`🎉 Correção concluída!`);
            console.log(`📦 Corrigidos: ${fixedCount} materiais`);
            console.log(`✅ Já OK: ${alreadyFixedCount} materiais`);
            
            return { fixed: fixedCount, alreadyFixed: alreadyFixedCount };
            
        } catch (error) {
            console.error('❌ Erro ao corrigir materiais:', error);
            throw error;
        }
    }

    async waitForDatabase() {
        while (!this.db || !this.db.db) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

// Executar correção automaticamente quando a página carregar
window.unitFixer = new UnitFixer();

document.addEventListener('DOMContentLoaded', async () => {
    // Esperar um pouco para garantir que tudo esteja carregado
    setTimeout(async () => {
        try {
            const result = await window.unitFixer.fixAllMaterials();
            
            if (result.fixed > 0) {
                // Mostrar mensagem para o usuário
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    border-radius: 8px;
                    font-weight: 500;
                    z-index: 10001;
                    max-width: 400px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                `;
                messageDiv.innerHTML = `
                    <div style="margin-bottom: 10px;">✅ Correção Automática</div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        ${result.fixed} materiais corrigidos para usar "unidade"
                    </div>
                `;
                document.body.appendChild(messageDiv);
                
                // Remover mensagem após 3 segundos
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 3000);
                
                // Recarregar a página para atualizar a exibição
                setTimeout(() => {
                    window.location.reload();
                }, 3500);
            }
        } catch (error) {
            console.error('Erro na correção automática:', error);
        }
    }, 2000);
});

// Adicionar função global para correção manual
window.fixUnits = async () => {
    try {
        const result = await window.unitFixer.fixAllMaterials();
        alert(`✅ Correção concluída!\n\n📦 Corrigidos: ${result.fixed} materiais\n✅ Já OK: ${result.alreadyFixed} materiais`);
        
        if (result.fixed > 0) {
            window.location.reload();
        }
    } catch (error) {
        alert('❌ Erro ao corrigir unidades: ' + error.message);
    }
};

console.log('🔧 Corretor de unidades disponível. Use window.fixUnits() para correção manual.');
