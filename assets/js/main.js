/**
 * Main Application Module - Packing House
 * Gerencia o carregamento e inicialização de todos os módulos
 */

class PackingHouseApp {
    constructor() {
        this.modules = new Map();
        this.config = {
            apiBaseUrl: '/api',
            version: '1.0.0',
            debug: true
        };
        this.isInitialized = false;
    }

    /**
     * Registra um módulo na aplicação
     * @param {string} name - Nome do módulo
     * @param {Object} module - Objeto do módulo
     */
    registerModule(name, module) {
        if (typeof module.init === 'function') {
            this.modules.set(name, module);
            this.log(`Módulo '${name}' registrado com sucesso`);
        } else {
            this.error(`Módulo '${name}' não possui método init`);
        }
    }

    /**
     * Inicializa todos os módulos registrados
     */
    async init() {
        if (this.isInitialized) {
            this.warn('Aplicação já foi inicializada');
            return;
        }

        try {
            this.log('Iniciando Packing House App...');

            // Inicializa módulos em ordem de prioridade
            const initOrder = [
                'database',
                'navigation',
                'utils',
                'components',
                'estoque',
                'producao',
                'configuracao',
                'backup'
            ];

            for (const moduleName of initOrder) {
                const module = this.modules.get(moduleName);
                if (module) {
                    try {
                        await module.init(this.config);
                        this.log(`Módulo '${moduleName}' inicializado`);
                    } catch (error) {
                        this.error(`Erro ao inicializar módulo '${moduleName}':`, error);
                    }
                }
            }

            // Inicializa módulos restantes
            for (const [name, module] of this.modules) {
                if (!initOrder.includes(name)) {
                    try {
                        await module.init(this.config);
                        this.log(`Módulo '${name}' inicializado`);
                    } catch (error) {
                        this.error(`Erro ao inicializar módulo '${name}':`, error);
                    }
                }
            }

            this.isInitialized = true;
            this.log('Packing House App inicializado com sucesso');

            // Dispara evento de inicialização completa
            document.dispatchEvent(new CustomEvent('app:initialized'));

        } catch (error) {
            this.error('Erro crítico na inicialização:', error);
        }
    }

    /**
     * Obtém um módulo registrado
     * @param {string} name - Nome do módulo
     * @returns {Object|null} Módulo ou null se não encontrado
     */
    getModule(name) {
        return this.modules.get(name) || null;
    }

    /**
     * Atualiza a configuração da aplicação
     * @param {Object} newConfig - Nova configuração
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.log('Configuração atualizada:', newConfig);
    }

    /**
     * Sistema de logging
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[Packing House]', ...args);
        }
    }

    warn(...args) {
        if (this.config.debug) {
            console.warn('[Packing House]', ...args);
        }
    }

    error(...args) {
        console.error('[Packing House]', ...args);
    }

    /**
     * Reinicializa a aplicação
     */
    async restart() {
        this.log('Reiniciando aplicação...');
        this.isInitialized = false;
        
        // Limpa eventos e estado dos módulos
        for (const [name, module] of this.modules) {
            if (typeof module.destroy === 'function') {
                try {
                    await module.destroy();
                    this.log(`Módulo '${name}' destruído`);
                } catch (error) {
                    this.error(`Erro ao destruir módulo '${name}':`, error);
                }
            }
        }

        await this.init();
    }
}

// Instância global da aplicação
window.PackingHouse = new PackingHouseApp();

// Auto-inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.PackingHouse.init();
    } catch (error) {
        console.error('Falha na inicialização da aplicação:', error);
    }
});

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PackingHouseApp;
}
