// Sistema de Estoque com Banco de Dados Local - Packing House

// Variáveis globais
let materials = [];
let movements = [];
let currentEditingMaterial = null;

// Modal functions
function showAddMaterialModal() {
    document.getElementById('addMaterialModal').style.display = 'block';
}

function showEditMaterialModal() {
    document.getElementById('editMaterialModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// === FUNÇÕES DE CARREGAMENTO DE DADOS ===

// Carregar materiais do banco de dados
async function loadMaterials() {
    try {
        materials = await window.packingHouseDB.getAllMaterials();
        renderMaterials();
        updateMaterialFilter();
        updateStats();
    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
        showError('Erro ao carregar materiais do banco de dados');
    }
}

// Carregar movimentações do banco de dados
async function loadMovements() {
    try {
        movements = await window.packingHouseDB.getAllMovements();
        renderMovements();
    } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
        showError('Erro ao carregar movimentações do banco de dados');
    }
}

// Carregar todos os dados
async function loadAllData() {
    await Promise.all([
        loadMaterials(),
        loadMovements()
    ]);
    
    // Atualizar filtros após carregar os dados
    updateMaterialFilter();
    updateHistoryMaterialFilter();
}

// === FUNÇÕES DE RENDERIZAÇÃO ===

// Renderizar materiais na interface
function renderMaterials(materialsToRender = materials) {
    const materialsGrid = document.getElementById('materialsGrid');
    const table = document.querySelector('.data-table tbody');
    
    // Limpar conteúdo atual
    materialsGrid.innerHTML = '';
    table.innerHTML = '';
    
    // Renderizar cada material
    materialsToRender.forEach(material => {
        // Criar card
        const card = createMaterialCard(material);
        materialsGrid.appendChild(card);
        
        // Criar linha da tabela (para compatibilidade)
        const row = createMaterialTableRow(material);
        table.appendChild(row);
    });
}

// Criar card de material
function createMaterialCard(material) {
    const card = document.createElement('div');
    card.className = 'material-card';
    card.dataset.materialId = material.id;
    
    const statusClass = material.status === 'Baixo' ? 'status-low' : 'status-good';
    
    card.innerHTML = `
        <div class="material-header">
            <h3 class="material-name">${material.name}</h3>
            <span class="material-status ${statusClass}">${material.status}</span>
        </div>
        <div class="material-info">
            <p class="material-quantity">${material.quantity}</p>
            <span class="material-unit">${material.unit}</span>
        </div>
        <div class="material-actions">
            <button class="btn-edit" onclick="editMaterial(${material.id})">Editar</button>
            <button class="btn-delete" onclick="deleteMaterial(${material.id})">Excluir</button>
        </div>
    `;
    
    return card;
}

// Criar linha da tabela de material
function createMaterialTableRow(material) {
    const row = document.createElement('tr');
    row.dataset.materialId = material.id;
    
    const statusClass = material.status === 'Baixo' ? 'status-low' : 'status-good';
    
    row.innerHTML = `
        <td data-label="Material">${material.name}</td>
        <td data-label="Quantidade">${material.quantity}</td>
        <td data-label="Unidade">${material.unit}</td>
        <td data-label="Status"><span class="${statusClass}">${material.status}</span></td>
        <td data-label="Ações">
            <button class="btn-edit" onclick="editMaterial(${material.id})">Editar</button>
            <button class="btn-delete" onclick="deleteMaterial(${material.id})">Excluir</button>
        </td>
    `;
    
    return row;
}

// Renderizar movimentações
function renderMovements(movementsToRender = movements) {
    const historyGrid = document.getElementById('historyGrid');
    const historyList = document.querySelector('.history-ol');
    
    // Limpar conteúdo atual
    historyGrid.innerHTML = '';
    historyList.innerHTML = '';
    
    // Renderizar cada movimentação
    movementsToRender.slice(0, 5).forEach(movement => {
        // Criar card
        const card = createMovementCard(movement);
        historyGrid.appendChild(card);
        
        // Criar item da lista (para compatibilidade)
        const item = createMovementListItem(movement);
        historyList.appendChild(item);
    });
    
    // Adicionar movimentações extras como ocultas
    movementsToRender.slice(5).forEach(movement => {
        const card = createMovementCard(movement);
        card.classList.add('hidden-history');
        card.style.display = 'none';
        historyGrid.appendChild(card);
        
        const item = createMovementListItem(movement);
        item.classList.add('hidden-history');
        item.style.display = 'none';
        historyList.appendChild(item);
    });
}

// Criar card de movimentação
function createMovementCard(movement) {
    const card = document.createElement('div');
    card.className = 'history-card';
    
    const date = new Date(movement.date);
    const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + 
                         date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    card.innerHTML = `
        <div class="history-header">
            <span class="movement-type ${movement.type}">${movement.type.toUpperCase()}</span>
            <span class="date">${formattedDate}</span>
        </div>
        <div class="history-content">
            <h4 class="material-name">${movement.materialName}</h4>
            <p class="quantity ${movement.type}">${movement.type === 'entrada' ? '+' : '-'}${movement.quantity} ${movement.unit}</p>
        </div>
    `;
    
    return card;
}

// Criar item da lista de movimentação
function createMovementListItem(movement) {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const date = new Date(movement.date);
    const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + 
                         date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    item.innerHTML = `
        <div class="history-info">
            <span class="movement-type ${movement.type}">${movement.type.toUpperCase()}</span>
            <span class="material-name">${movement.materialName}</span>
            <span class="quantity">${movement.type === 'entrada' ? '+' : '-'}${movement.quantity} ${movement.unit}</span>
            <span class="date">${formattedDate}</span>
        </div>
    `;
    
    return item;
}

// === FUNÇÕES DE CRUD ===

// Adicionar material
async function addMaterial(nome, quantidade) {
    try {
        const material = {
            name: nome,
            quantity: parseInt(quantidade),
            unit: 'unidade', // Sempre usar 'unidade' como padrão
            minStock: 20
        };
        
        const id = await window.packingHouseDB.addMaterial(material);
        console.log('Material adicionado com ID:', id);
        
        // Recarregar dados
        await loadMaterials();
        
        showSuccessMessage('Material adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar material:', error);
        showError('Erro ao adicionar material: ' + error.message);
    }
}

// Editar material
async function editMaterial(id) {
    try {
        const material = await window.packingHouseDB.getMaterial(id);
        if (!material) {
            showError('Material não encontrado');
            return;
        }
        
        currentEditingMaterial = material;
        
        // Preencher formulário
        document.getElementById('editMaterialNome').value = material.name;
        document.getElementById('editMaterialQuantidade').value = material.quantity;
        document.getElementById('editMaterialUnidade').value = material.unit;
        
        // Mostrar modal
        showEditMaterialModal();
    } catch (error) {
        console.error('Erro ao editar material:', error);
        showError('Erro ao carregar material para edição');
    }
}

// Atualizar material
async function updateMaterial(id, nome, quantidade) {
    try {
        const updates = {
            name: nome,
            quantity: parseInt(quantidade),
            unit: 'unidade' // Sempre usar 'unidade' como padrão
        };
        
        await window.packingHouseDB.updateMaterial(id, updates);
        console.log('Material atualizado:', id);
        
        // Recarregar dados
        await loadMaterials();
        
        showSuccessMessage('Material atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar material:', error);
        showError('Erro ao atualizar material: ' + error.message);
    }
}

// Excluir material
async function deleteMaterial(id) {
    try {
        const material = await window.packingHouseDB.getMaterial(id);
        if (!material) {
            showError('Material não encontrado');
            return;
        }
        
        if (!confirm(`Tem certeza que deseja excluir o material "${material.name}"?`)) {
            return;
        }
        
        await window.packingHouseDB.deleteMaterial(id);
        console.log('Material excluído:', id);
        
        // Recarregar dados
        await loadMaterials();
        
        showSuccessMessage(`Material "${material.name}" excluído com sucesso!`);
    } catch (error) {
        console.error('Erro ao excluir material:', error);
        showError('Erro ao excluir material: ' + error.message);
    }
}

// Adicionar movimentação
async function addMovement(materialName, type, quantity, date) {
    try {
        const movement = {
            materialName,
            type,
            quantity: parseInt(quantity),
            unit: 'unidade', // Sempre usar 'unidade' como padrão
            date: new Date(date).toISOString()
        };
        
        await window.packingHouseDB.addMovement(movement);
        console.log('Movimentação adicionada');
        
        // Recarregar dados
        await loadAllData();
        
        showSuccessMessage('Movimentação registrada com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar movimentação:', error);
        showError('Erro ao registrar movimentação: ' + error.message);
    }
}

// === FUNÇÕES DE INTERFACE ===

// Atualizar filtro de materiais
function updateMaterialFilter() {
    const filterSelect = document.getElementById('materialSelect');
    if (!filterSelect) return;
    
    // Limpar opções existentes (exceto "Selecione um material")
    while (filterSelect.children.length > 1) {
        filterSelect.removeChild(filterSelect.lastChild);
    }
    
    // Adicionar opções de materiais
    materials.sort((a, b) => a.name.localeCompare(b.name)).forEach(material => {
        const option = document.createElement('option');
        option.value = material.name;
        option.textContent = material.name;
        filterSelect.appendChild(option);
    });
}

// Atualizar filtro de materiais para histórico
function updateHistoryMaterialFilter() {
    const filterSelect = document.getElementById('filterMaterial');
    if (!filterSelect) return;
    
    // Limpar opções existentes (exceto "Todos os materiais")
    while (filterSelect.children.length > 1) {
        filterSelect.removeChild(filterSelect.lastChild);
    }
    
    // Adicionar opções de materiais
    materials.sort((a, b) => a.name.localeCompare(b.name)).forEach(material => {
        const option = document.createElement('option');
        option.value = material.name;
        option.textContent = material.name;
        filterSelect.appendChild(option);
    });
}

// Atualizar estatísticas
async function updateStats() {
    try {
        const stats = await window.packingHouseDB.getStats();
        
        // Atualizar cards de estatísticas com os IDs corretos
        const totalCard = document.getElementById('totalQuantity');
        if (totalCard) {
            totalCard.textContent = stats.totalQuantity.toLocaleString();
        }
        
        const itemsCard = document.getElementById('totalItems');
        if (itemsCard) {
            itemsCard.textContent = stats.totalMaterials;
        }
        
        const lowStockCard = document.getElementById('lowStockItems');
        if (lowStockCard) {
            lowStockCard.textContent = stats.lowStockCount;
        }
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// Buscar materiais
function searchMaterials() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    const filteredMaterials = materials.filter(material => 
        material.name.toLowerCase().includes(searchTerm)
    );
    
    renderMaterials(filteredMaterials);
    
    // Mostrar mensagem se não houver resultados
    if (filteredMaterials.length === 0 && searchTerm !== '') {
        const materialsGrid = document.getElementById('materialsGrid');
        const noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-search-results';
        noResultsMsg.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: #a8a8a8;
            font-style: italic;
            background: rgba(20, 20, 35, 0.95);
            border: 1px solid rgba(102, 126, 234, 0.2);
            border-radius: 12px;
        `;
        noResultsMsg.textContent = `Nenhum material encontrado para "${document.getElementById('searchInput').value}"`;
        materialsGrid.appendChild(noResultsMsg);
    }
}

// Filtrar histórico
async function filterHistory() {
    const materialFilter = document.getElementById('filterMaterial').value;
    const dateFilter = document.getElementById('filterDate').value;
    const typeFilter = document.getElementById('filterType').value;
    
    const filters = {};
    if (materialFilter) filters.materialName = materialFilter;
    if (dateFilter) filters.date = dateFilter;
    if (typeFilter) filters.type = typeFilter;
    
    try {
        const filteredMovements = await window.packingHouseDB.filterMovements(filters);
        renderMovements(filteredMovements);
        
        // Mostrar mensagem se não houver resultados
        if (filteredMovements.length === 0) {
            const historyGrid = document.getElementById('historyGrid');
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-history-results';
            noResultsMsg.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                color: #a8a8a8;
                font-style: italic;
                background: rgba(20, 20, 35, 0.95);
                border: 1px solid rgba(102, 126, 234, 0.2);
                border-radius: 12px;
            `;
            noResultsMsg.textContent = 'Nenhuma movimentação encontrada para os filtros selecionados.';
            historyGrid.appendChild(noResultsMsg);
        }
    } catch (error) {
        console.error('Erro ao filtrar histórico:', error);
        showError('Erro ao filtrar histórico');
    }
}

// Limpar filtros
function clearFilters() {
    document.getElementById('filterMaterial').value = '';
    document.getElementById('filterDate').value = '';
    document.getElementById('filterType').value = '';
    
    renderMovements();
}

// Alternar visibilidade do histórico
function toggleHistory() {
    const hiddenCards = document.querySelectorAll('.hidden-history');
    const showMoreBtn = document.getElementById('showMoreBtn');
    
    if (showMoreBtn.textContent === 'Mostrar Mais') {
        // Mostrar itens ocultos
        hiddenCards.forEach(card => {
            card.style.display = '';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        });
        
        showMoreBtn.textContent = 'Mostrar Menos';
    } else {
        // Ocultar itens extras
        hiddenCards.forEach(card => {
            card.style.display = 'none';
        });
        
        showMoreBtn.textContent = 'Mostrar Mais';
    }
}

// === FUNÇÕES DE MENSAGENS ===

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(40, 167, 69, 0.4);
        z-index: 10001;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 300);
    }, 3000);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #dc3545, #c82333);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(220, 53, 69, 0.4);
        z-index: 10001;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 300);
    }, 5000);
}

// === INICIALIZAÇÃO ===

document.addEventListener('DOMContentLoaded', async function() {
    // Esperar o banco de dados estar pronto
    setTimeout(async () => {
        try {
            // Carregar todos os dados
            await loadAllData();
            
            // Configurar event listeners
            setupEventListeners();
            
            console.log('Sistema de estoque inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar sistema:', error);
            showError('Erro ao inicializar sistema de estoque');
        }
    }, 1500);
});

function setupEventListeners() {
    // Set today's date as default
    const dateInput = document.getElementById('movementDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchMaterials);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMaterials();
            }
        });
    }
    
    // Material form
    const materialForm = document.querySelector('#addMaterialModal .material-form');
    if (materialForm) {
        materialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('materialNome').value;
            const quantidade = document.getElementById('materialQuantidade').value;
            
            addMaterial(nome, quantidade); // Sempre 'unidade'
            
            materialForm.reset();
            closeModal('addMaterialModal');
        });
    }
    
    // Edit material form
    const editMaterialForm = document.querySelector('#editMaterialModal .material-form');
    if (editMaterialForm) {
        editMaterialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('editMaterialNome').value;
            const quantidade = document.getElementById('editMaterialQuantidade').value;
            
            updateMaterial(currentEditingMaterial.id, nome, quantidade); // Sempre 'unidade'
            
            editMaterialForm.reset();
            currentEditingMaterial = null;
            closeModal('editMaterialModal');
        });
    }
    
    // Movement form
    const movementForm = document.querySelector('.movement-form');
    if (movementForm) {
        movementForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const material = document.getElementById('materialSelect').value;
            const type = document.getElementById('movementType').value;
            const quantity = document.getElementById('movementQuantity').value;
            const date = document.getElementById('movementDate').value;
            
            addMovement(material, type, quantity, date); // Sempre 'unidade'
            
            movementForm.reset();
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        });
    }
    
    // Filter listeners
    const materialFilter = document.getElementById('filterMaterial');
    const dateFilter = document.getElementById('filterDate');
    const typeFilter = document.getElementById('filterType');
    
    if (materialFilter) materialFilter.addEventListener('change', filterHistory);
    if (dateFilter) dateFilter.addEventListener('change', filterHistory);
    if (typeFilter) typeFilter.addEventListener('change', filterHistory);
}

// Adicionar CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .material-name {
        font-weight: 600;
        color: #667eea;
        flex: 1;
    }
    
    .history-info {
        display: flex;
        gap: 15px;
        align-items: center;
        margin-bottom: 10px;
        flex-wrap: wrap;
    }
`;
document.head.appendChild(style);
