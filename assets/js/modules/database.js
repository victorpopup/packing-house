/**
 * Database Module - Packing House
 * Gerencia operações do banco de dados local (IndexedDB)
 */

const DatabaseModule = {
    name: 'database',
    version: '1.0.0',
    
    // Configuração do banco
    config: {
        dbName: 'PackingHouseDB',
        version: 1,
        stores: {
            materials: { keyPath: 'id', autoIncrement: true },
            movements: { keyPath: 'id', autoIncrement: true },
            production: { keyPath: 'id', autoIncrement: true },
            settings: { keyPath: 'key', autoIncrement: false }
        }
    },

    // Estado do módulo
    state: {
        db: null,
        isInitialized: false,
        initPromise: null
    },

    /**
     * Inicializa o módulo de banco de dados
     * @param {Object} appConfig - Configuração da aplicação
     */
    async init(appConfig) {
        this.appConfig = appConfig;
        this.log('Inicializando módulo de banco de dados...');

        // Se já estiver inicializando, aguarda
        if (this.state.initPromise) {
            return this.state.initPromise;
        }

        // Se já estiver inicializado, retorna
        if (this.state.isInitialized) {
            return this.state.db;
        }

        // Inicializa o banco
        this.state.initPromise = this.initializeDatabase();
        
        try {
            await this.state.initPromise;
            this.log('Módulo de banco de dados inicializado');
        } catch (error) {
            this.error('Erro na inicialização do banco:', error);
            throw error;
        }
    },

    /**
     * Inicializa o IndexedDB
     */
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.dbName, this.config.version);

            request.onerror = (event) => {
                this.error('Erro ao abrir banco de dados:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.state.db = event.target.result;
                this.state.isInitialized = true;
                this.log('Banco de dados aberto com sucesso');
                resolve(this.state.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.log('Atualizando estrutura do banco de dados...');

                // Cria object stores
                Object.entries(this.config.stores).forEach(([storeName, options]) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, options);
                        
                        // Cria índices comuns
                        if (storeName === 'materials') {
                            store.createIndex('name', 'name', { unique: false });
                            store.createIndex('quantity', 'quantity', { unique: false });
                        }
                        
                        if (storeName === 'movements') {
                            store.createIndex('materialId', 'materialId', { unique: false });
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('type', 'type', { unique: false });
                        }
                        
                        if (storeName === 'production') {
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('brand', 'brand', { unique: false });
                        }

                        this.log(`Store '${storeName}' criado com sucesso`);
                    }
                });

                this.log('Estrutura do banco atualizada');
            };
        });
    },

    /**
     * Obtém transação do banco
     * @param {string|string[]} storeNames - Nomes das stores
     * @param {string} mode - Modo da transação ('readonly', 'readwrite')
     * @returns {IDBTransaction} Transação
     */
    getTransaction(storeNames, mode = 'readonly') {
        if (!this.state.db) {
            throw new Error('Banco de dados não inicializado');
        }

        const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
        return this.state.db.transaction(stores, mode);
    },

    /**
     * Adiciona item a uma store
     * @param {string} storeName - Nome da store
     * @param {Object} data - Dados a adicionar
     * @returns {Promise} Resultado da operação
     */
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(data);

                request.onsuccess = () => {
                    this.log(`Item adicionado à store '${storeName}':`, data);
                    resolve(request.result);
                };

                request.onerror = () => {
                    this.error(`Erro ao adicionar item à store '${storeName}':`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                this.error(`Erro na transação da store '${storeName}':`, error);
                reject(error);
            }
        });
    },

    /**
     * Obtém item por ID
     * @param {string} storeName - Nome da store
     * @param {any} id - ID do item
     * @returns {Promise} Item encontrado
     */
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction(storeName);
                const store = transaction.objectStore(storeName);
                const request = store.get(id);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    this.error(`Erro ao obter item da store '${storeName}':`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                this.error(`Erro na transação da store '${storeName}':`, error);
                reject(error);
            }
        });
    },

    /**
     * Obtém todos os itens de uma store
     * @param {string} storeName - Nome da store
     * @returns {Promise} Array de itens
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction(storeName);
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    this.log(`Obtidos ${request.result.length} itens da store '${storeName}'`);
                    resolve(request.result);
                };

                request.onerror = () => {
                    this.error(`Erro ao obter itens da store '${storeName}':`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                this.error(`Erro na transação da store '${storeName}':`, error);
                reject(error);
            }
        });
    },

    /**
     * Atualiza item em uma store
     * @param {string} storeName - Nome da store
     * @param {Object} data - Dados a atualizar
     * @returns {Promise} Resultado da operação
     */
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);

                request.onsuccess = () => {
                    this.log(`Item atualizado na store '${storeName}':`, data);
                    resolve(request.result);
                };

                request.onerror = () => {
                    this.error(`Erro ao atualizar item na store '${storeName}':`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                this.error(`Erro na transação da store '${storeName}':`, error);
                reject(error);
            }
        });
    },

    /**
     * Remove item de uma store
     * @param {string} storeName - Nome da store
     * @param {any} id - ID do item a remover
     * @returns {Promise} Resultado da operação
     */
    async remove(storeName, id) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                request.onsuccess = () => {
                    this.log(`Item removido da store '${storeName}':`, id);
                    resolve(request.result);
                };

                request.onerror = () => {
                    this.error(`Erro ao remover item da store '${storeName}':`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                this.error(`Erro na transação da store '${storeName}':`, error);
                reject(error);
            }
        });
    },

    /**
     * Limpa todos os itens de uma store
     * @param {string} storeName - Nome da store
     * @returns {Promise} Resultado da operação
     */
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    this.log(`Store '${storeName}' limpa com sucesso`);
                    resolve(request.result);
                };

                request.onerror = () => {
                    this.error(`Erro ao limpar store '${storeName}':`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                this.error(`Erro na transação da store '${storeName}':`, error);
                reject(error);
            }
        });
    },

    /**
     * Busca itens por índice
     * @param {string} storeName - Nome da store
     * @param {string} indexName - Nome do índice
     * @param {any} value - Valor a buscar
     * @returns {Promise} Array de itens
     */
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction(storeName);
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(value);

                request.onsuccess = () => {
                    this.log(`Busca por índice '${indexName}' na store '${storeName}' retornou ${request.result.length} itens`);
                    resolve(request.result);
                };

                request.onerror = () => {
                    this.error(`Erro na busca por índice '${indexName}':`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                this.error(`Erro na transação da store '${storeName}':`, error);
                reject(error);
            }
        });
    },

    /**
     * Conta itens em uma store
     * @param {string} storeName - Nome da store
     * @returns {Promise} Número de itens
     */
    async count(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction(storeName);
                const store = transaction.objectStore(storeName);
                const request = store.count();

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    this.error(`Erro ao contar itens da store '${storeName}':`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                this.error(`Erro na transação da store '${storeName}':`, error);
                reject(error);
            }
        });
    },

    /**
     * Importa dados em massa
     * @param {string} storeName - Nome da store
     * @param {Array} items - Itens a importar
     * @returns {Promise} Resultado da operação
     */
    async bulkImport(storeName, items) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                let completed = 0;
                let errors = [];

                items.forEach((item, index) => {
                    const request = store.add(item);
                    
                    request.onsuccess = () => {
                        completed++;
                        if (completed === items.length) {
                            if (errors.length > 0) {
                                reject(errors);
                            } else {
                                this.log(`Importados ${completed} itens para store '${storeName}'`);
                                resolve({ completed, errors });
                            }
                        }
                    };
                    
                    request.onerror = () => {
                        errors.push({ index, error: request.error, item });
                        completed++;
                        if (completed === items.length) {
                            reject(errors);
                        }
                    };
                });
            } catch (error) {
                this.error(`Erro na importação em massa para store '${storeName}':`, error);
                reject(error);
            }
        });
    },

    /**
     * Exporta dados de uma store
     * @param {string} storeName - Nome da store
     * @returns {Promise} Array de itens
     */
    async export(storeName) {
        return this.getAll(storeName);
    },

    /**
     * Obtém estatísticas do banco
     * @returns {Promise} Estatísticas
     */
    async getStats() {
        const stats = {};
        
        for (const storeName of Object.keys(this.config.stores)) {
            try {
                stats[storeName] = await this.count(storeName);
            } catch (error) {
                stats[storeName] = 0;
            }
        }
        
        return stats;
    },

    /**
     * Destrói o módulo
     */
    async destroy() {
        if (this.state.db) {
            this.state.db.close();
            this.state.db = null;
            this.state.isInitialized = false;
            this.state.initPromise = null;
            this.log('Conexão com banco de dados fechada');
        }
    },

    /**
     * Sistema de logging
     */
    log(...args) {
        console.log(`[Database]`, ...args);
    },

    warn(...args) {
        console.warn(`[Database]`, ...args);
    },

    error(...args) {
        console.error(`[Database]`, ...args);
    }
};

// Registra o módulo na aplicação principal
if (window.PackingHouse) {
    window.PackingHouse.registerModule('database', DatabaseModule);
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseModule;
}
