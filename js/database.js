// Sistema de Banco de Dados Local para Packing House
class PackingHouseDB {
    constructor() {
        this.dbName = 'PackingHouseDB';
        this.dbVersion = 2; // Incrementado para forçar atualização
        this.db = null;
    }

    // Inicializar o banco de dados
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Erro ao abrir o banco de dados:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Banco de dados inicializado com sucesso');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('Atualizando banco de dados para versão:', event.newVersion);
                const db = event.target.result;

                // Criar tabela de materiais
                if (!db.objectStoreNames.contains('materials')) {
                    const materialsStore = db.createObjectStore('materials', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    materialsStore.createIndex('name', 'name', { unique: true });
                    materialsStore.createIndex('status', 'status', { unique: false });
                    console.log('Tabela materials criada');
                }

                // Criar tabela de movimentações
                if (!db.objectStoreNames.contains('movements')) {
                    const movementsStore = db.createObjectStore('movements', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    movementsStore.createIndex('materialName', 'materialName', { unique: false });
                    movementsStore.createIndex('type', 'type', { unique: false });
                    movementsStore.createIndex('date', 'date', { unique: false });
                    console.log('Tabela movements criada');
                }

                // Criar tabela de marcas
                if (!db.objectStoreNames.contains('brands')) {
                    const brandsStore = db.createObjectStore('brands', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    brandsStore.createIndex('name', 'name', { unique: true });
                    console.log('Tabela brands criada');
                }

                // Criar tabela de configurações
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                    console.log('Tabela settings criada');
                }

                console.log('Estrutura do banco de dados atualizada');
            };
        });
    }

    // === OPERAÇÕES COM MATERIAIS ===

    // Adicionar material
    async addMaterial(material) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['materials'], 'readwrite');
            const store = transaction.objectStore('materials');
            
            // Definir status automaticamente baseado na quantidade
            material.status = material.quantity < 20 ? 'Baixo' : 'Normal';
            material.createdAt = new Date().toISOString();
            material.updatedAt = new Date().toISOString();

            const request = store.add(material);

            request.onsuccess = () => {
                console.log('Material adicionado:', material);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Erro ao adicionar material:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Obter todos os materiais
    async getAllMaterials() {
        return new Promise((resolve, reject) => {
            console.log('Buscando todos os materiais no banco de dados...');
            const transaction = this.db.transaction(['materials'], 'readonly');
            const store = transaction.objectStore('materials');
            const request = store.getAll();

            request.onsuccess = () => {
                console.log('Materiais encontrados no banco:', request.result.length, request.result);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Erro ao obter materiais:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Obter material por ID
    async getMaterial(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['materials'], 'readonly');
            const store = transaction.objectStore('materials');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Erro ao obter material:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Obter material por nome
    async getMaterialByName(name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['materials'], 'readonly');
            const store = transaction.objectStore('materials');
            const index = store.index('name');
            const request = index.get(name);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Erro ao obter material por nome:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Atualizar material
    async updateMaterial(id, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['materials'], 'readwrite');
            const store = transaction.objectStore('materials');
            
            // Primeiro obter o material atual
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const material = getRequest.result;
                if (!material) {
                    reject(new Error('Material não encontrado'));
                    return;
                }

                // Atualizar campos
                Object.assign(material, updates);
                material.updatedAt = new Date().toISOString();
                
                // Atualizar status baseado na quantidade
                if (updates.quantity !== undefined) {
                    material.status = material.quantity < 20 ? 'Baixo' : 'Normal';
                }

                const updateRequest = store.put(material);

                updateRequest.onsuccess = () => {
                    console.log('Material atualizado:', material);
                    resolve(material);
                };

                updateRequest.onerror = (event) => {
                    console.error('Erro ao atualizar material:', event.target.error);
                    reject(event.target.error);
                };
            };

            getRequest.onerror = (event) => {
                console.error('Erro ao obter material para atualização:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Excluir material
    async deleteMaterial(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['materials'], 'readwrite');
            const store = transaction.objectStore('materials');
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Material excluído:', id);
                resolve(id);
            };

            request.onerror = (event) => {
                console.error('Erro ao excluir material:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // === OPERAÇÕES COM MARCAS ===

    // Adicionar marca
    async addBrand(brand) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['brands'], 'readwrite');
            const store = transaction.objectStore('brands');
            
            brand.createdAt = new Date().toISOString();
            brand.updatedAt = new Date().toISOString();

            const request = store.add(brand);

            request.onsuccess = () => {
                console.log('Marca adicionada:', brand);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Erro ao adicionar marca:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Obter todas as marcas
    async getAllBrands() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['brands'], 'readonly');
            const store = transaction.objectStore('brands');
            const request = store.getAll();

            request.onsuccess = () => {
                console.log('Marcas encontradas no banco:', request.result.length, request.result);
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Erro ao obter marcas:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Obter marca por ID
    async getBrand(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['brands'], 'readonly');
            const store = transaction.objectStore('brands');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Erro ao obter marca:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Obter marca por nome
    async getBrandByName(name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['brands'], 'readonly');
            const store = transaction.objectStore('brands');
            const index = store.index('name');
            const request = index.get(name);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('Erro ao obter marca por nome:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Atualizar marca
    async updateBrand(id, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['brands'], 'readwrite');
            const store = transaction.objectStore('brands');
            
            // Primeiro obter a marca atual
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const brand = getRequest.result;
                if (!brand) {
                    reject(new Error('Marca não encontrada'));
                    return;
                }

                // Atualizar campos
                Object.assign(brand, updates);
                brand.updatedAt = new Date().toISOString();

                const updateRequest = store.put(brand);

                updateRequest.onsuccess = () => {
                    console.log('Marca atualizada:', brand);
                    resolve(brand);
                };

                updateRequest.onerror = (event) => {
                    console.error('Erro ao atualizar marca:', event.target.error);
                    reject(event.target.error);
                };
            };

            getRequest.onerror = (event) => {
                console.error('Erro ao obter marca para atualização:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Excluir marca
    async deleteBrand(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['brands'], 'readwrite');
            const store = transaction.objectStore('brands');
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Marca excluída:', id);
                resolve(id);
            };

            request.onerror = (event) => {
                console.error('Erro ao excluir marca:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // === OPERAÇÕES COM MOVIMENTAÇÕES ===

    // Adicionar movimentação
    async addMovement(movement) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['movements', 'materials'], 'readwrite');
            const movementsStore = transaction.objectStore('movements');
            const materialsStore = transaction.objectStore('materials');

            // Adicionar data/hora atual se não fornecida
            if (!movement.date) {
                movement.date = new Date().toISOString();
            }
            movement.createdAt = new Date().toISOString();

            const addMovementRequest = movementsStore.add(movement);

            addMovementRequest.onsuccess = () => {
                console.log('Movimentação adicionada:', movement);
                
                // Atualizar quantidade do material
                this.updateMaterialQuantity(movement.materialName, movement.type, movement.quantity)
                    .then(() => {
                        resolve(addMovementRequest.result);
                    })
                    .catch(reject);
            };

            addMovementRequest.onerror = (event) => {
                console.error('Erro ao adicionar movimentação:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Atualizar quantidade do material após movimentação
    async updateMaterialQuantity(materialName, type, quantity) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['materials'], 'readwrite');
            const store = transaction.objectStore('materials');
            const index = store.index('name');
            
            const getRequest = index.get(materialName);
            
            getRequest.onsuccess = () => {
                const material = getRequest.result;
                if (!material) {
                    reject(new Error('Material não encontrado: ' + materialName));
                    return;
                }

                // Atualizar quantidade
                if (type === 'entrada') {
                    material.quantity += parseInt(quantity);
                } else if (type === 'saida') {
                    material.quantity -= parseInt(quantity);
                }

                // Atualizar status
                material.status = material.quantity < 20 ? 'Baixo' : 'Normal';
                material.updatedAt = new Date().toISOString();

                const updateRequest = store.put(material);

                updateRequest.onsuccess = () => {
                    console.log('Quantidade do material atualizada:', material);
                    resolve(material);
                };

                updateRequest.onerror = (event) => {
                    console.error('Erro ao atualizar quantidade do material:', event.target.error);
                    reject(event.target.error);
                };
            };

            getRequest.onerror = (event) => {
                console.error('Erro ao encontrar material para atualização:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Obter todas as movimentações
    async getAllMovements() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['movements'], 'readonly');
            const store = transaction.objectStore('movements');
            const request = store.getAll();

            request.onsuccess = () => {
                // Ordenar por data (mais recente primeiro)
                const movements = request.result.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
                resolve(movements);
            };

            request.onerror = (event) => {
                console.error('Erro ao obter movimentações:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Filtrar movimentações
    async filterMovements(filters = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['movements'], 'readonly');
            const store = transaction.objectStore('movements');
            const request = store.getAll();

            request.onsuccess = () => {
                let movements = request.result;

                // Aplicar filtros
                if (filters.materialName) {
                    movements = movements.filter(m => m.materialName === filters.materialName);
                }
                if (filters.type) {
                    movements = movements.filter(m => m.type === filters.type);
                }
                if (filters.date) {
                    movements = movements.filter(m => {
                        const movementDate = new Date(m.date).toISOString().split('T')[0];
                        return movementDate === filters.date;
                    });
                }

                // Ordenar por data (mais recente primeiro)
                movements.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(movements);
            };

            request.onerror = (event) => {
                console.error('Erro ao filtrar movimentações:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // === OPERAÇÕES COM CONFIGURAÇÕES ===

    // Salvar configuração
    async saveSetting(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({ key, value });

            request.onsuccess = () => {
                console.log('Configuração salva:', key, value);
                resolve();
            };

            request.onerror = (event) => {
                console.error('Erro ao salvar configuração:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Obter configuração
    async getSetting(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };

            request.onerror = (event) => {
                console.error('Erro ao obter configuração:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // === UTILITÁRIOS ===

    // Obter estatísticas
    async getStats() {
        try {
            const materials = await this.getAllMaterials();
            const movements = await this.getAllMovements();

            const totalQuantity = materials.reduce((sum, material) => sum + material.quantity, 0);
            const lowStockCount = materials.filter(material => material.quantity < 20).length;
            const todayMovements = movements.filter(m => {
                const today = new Date().toISOString().split('T')[0];
                const movementDate = new Date(m.date).toISOString().split('T')[0];
                return movementDate === today;
            }).length;

            return {
                totalMaterials: materials.length,
                totalQuantity,
                lowStockCount,
                todayMovements
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }

    // Limpar histórico de movimentações
    async clearMovementsHistory() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['movements'], 'readwrite');
            const movementsStore = transaction.objectStore('movements');
            
            movementsStore.clear();

            transaction.oncomplete = () => {
                console.log('Histórico de movimentações limpo');
                resolve();
            };

            transaction.onerror = (event) => {
                console.error('Erro ao limpar histórico de movimentações:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Limpar banco de dados (para testes)
    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['materials', 'movements', 'brands', 'settings'], 'readwrite');
            
            const materialsStore = transaction.objectStore('materials');
            const movementsStore = transaction.objectStore('movements');
            const brandsStore = transaction.objectStore('brands');
            const settingsStore = transaction.objectStore('settings');

            materialsStore.clear();
            movementsStore.clear();
            brandsStore.clear();
            settingsStore.clear();

            transaction.oncomplete = () => {
                console.log('Banco de dados limpo');
                resolve();
            };

            transaction.onerror = (event) => {
                console.error('Erro ao limpar banco de dados:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Exportar dados para JSON
    async exportData() {
        try {
            const materials = await this.getAllMaterials();
            const movements = await this.getAllMovements();
            const brands = await this.getAllBrands();
            
            return {
                materials,
                movements,
                brands,
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            throw error;
        }
    }

    // Importar dados de JSON
    async importData(data) {
        try {
            // Limpar dados existentes
            await this.clearAll();

            // Importar materiais
            if (data.materials && Array.isArray(data.materials)) {
                for (const material of data.materials) {
                    await this.addMaterial(material);
                }
            }

            // Importar movimentações
            if (data.movements && Array.isArray(data.movements)) {
                for (const movement of data.movements) {
                    await this.addMovement(movement);
                }
            }

            // Importar marcas
            if (data.brands && Array.isArray(data.brands)) {
                for (const brand of data.brands) {
                    await this.addBrand(brand);
                }
            }

            console.log('Dados importados com sucesso');
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            throw error;
        }
    }
}

// Instância global do banco de dados
window.packingHouseDB = new PackingHouseDB();

// Inicializar o banco de dados quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.packingHouseDB.init();
        console.log('Sistema de banco de dados pronto para uso');
    } catch (error) {
        console.error('Falha ao inicializar o banco de dados:', error);
    }
});
