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

// Form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const dateInput = document.getElementById('movementDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Add auto-filter listeners
    const materialFilter = document.getElementById('filterMaterial');
    const dateFilter = document.getElementById('filterDate');
    const typeFilter = document.getElementById('filterType');
    
    if (materialFilter) {
        materialFilter.addEventListener('change', filterHistory);
    }
    if (dateFilter) {
        dateFilter.addEventListener('change', filterHistory);
    }
    if (typeFilter) {
        typeFilter.addEventListener('change', filterHistory);
    }
    
    // Initialize material filter with existing materials
    updateMaterialFilter();
    
    // Add search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Real-time search as user types
        searchInput.addEventListener('input', searchMaterials);
        
        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMaterials();
            }
        });
    }
    
    // Edit material form
    const editMaterialForm = document.querySelector('#editMaterialModal .material-form');
    if (editMaterialForm) {
        editMaterialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('editMaterialNome').value;
            const quantidade = document.getElementById('editMaterialQuantidade').value;
            const unidade = document.getElementById('editMaterialUnidade').value;
            const rowIndex = document.getElementById('editMaterialModal').dataset.rowIndex;
            
            // Update material in table
            updateMaterialInTable(rowIndex, nome, quantidade, unidade);
            
            // Reset form and close modal
            editMaterialForm.reset();
            delete document.getElementById('editMaterialModal').dataset.rowIndex;
            closeModal('editMaterialModal');
            
            showSuccessMessage('Material atualizado com sucesso!');
        });
    }
    
    // Material form
    const materialForm = document.querySelector('.material-form');
    if (materialForm) {
        materialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('materialNome').value;
            const quantidade = document.getElementById('materialQuantidade').value;
            const unidade = document.getElementById('materialUnidade').value;
            
            // Add new row to table
            addMaterialToTable(nome, quantidade, unidade);
            
            // Reset form and close modal
            materialForm.reset();
            closeModal('addMaterialModal');
            
            alert('Material adicionado com sucesso!');
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
            const unit = document.getElementById('movementUnit').value;
            const date = document.getElementById('movementDate').value;
            
            // Add to history
            addMovementToHistory(material, type, quantity, unit, date);
            
            // Update stock table
            updateStockTable(material, type, quantity, unit);
            
            // Reset form
            movementForm.reset();
            dateInput.value = new Date().toISOString().split('T')[0];
            
            // Show success message
            showSuccessMessage('Movimentação registrada com sucesso!');
        });
    }
});

function addMaterialToTable(nome, quantidade, unidade) {
    // Adicionar à tabela oculta para compatibilidade
    const table = document.querySelector('.data-table tbody');
    const newRow = table.insertRow();
    
    // Determine status based on quantity
    const status = quantidade < 20 ? 'Baixo' : 'Normal';
    const statusClass = quantidade < 20 ? 'status-low' : 'status-good';
    
    newRow.innerHTML = `
        <td data-label="Material">${nome}</td>
        <td data-label="Quantidade">${quantidade}</td>
        <td data-label="Unidade">${unidade}</td>
        <td data-label="Status"><span class="${statusClass}">${status}</span></td>
        <td data-label="Ações"><button class="btn-delete" onclick="deleteMaterial(this)">Excluir</button></td>
    `;
    
    // Adicionar ao grid de cards visível
    const materialsGrid = document.getElementById('materialsGrid');
    const newCard = document.createElement('div');
    newCard.className = 'material-card';
    
    newCard.innerHTML = `
        <div class="material-header">
            <h3 class="material-name">${nome}</h3>
            <span class="material-status ${statusClass}">${status}</span>
        </div>
        <div class="material-info">
            <p class="material-quantity">${quantidade}</p>
            <span class="material-unit">${unidade}</span>
        </div>
        <div class="material-actions">
            <button class="btn-edit" onclick="editMaterial(this)">Editar</button>
            <button class="btn-delete" onclick="deleteMaterial(this)">Excluir</button>
        </div>
    `;
    
    materialsGrid.appendChild(newCard);
    
    // Update material filter dropdown
    updateMaterialFilter();
}

function updateMaterialFilter() {
    const filterSelect = document.getElementById('filterMaterial');
    if (!filterSelect) return;
    
    // Get all materials from table
    const table = document.querySelector('.data-table tbody');
    const rows = table.getElementsByTagName('tr');
    const materials = new Set();
    
    for (let row of rows) {
        const materialName = row.cells[0].textContent;
        materials.add(materialName);
    }
    
    // Clear existing options (except "Todos os materiais")
    while (filterSelect.children.length > 1) {
        filterSelect.removeChild(filterSelect.lastChild);
    }
    
    // Add sorted material options
    Array.from(materials).sort().forEach(material => {
        const option = document.createElement('option');
        option.value = material;
        option.textContent = material;
        filterSelect.appendChild(option);
    });
}

function addMovementToHistory(material, type, quantity, unit, date) {
    // Adicionar à lista original para compatibilidade
    const historyContainer = document.querySelector('.history-ol');
    const newItem = document.createElement('div');
    newItem.className = 'history-item';
    
    // Format date and time
    const dateObj = new Date(date + 'T' + new Date().toTimeString().split(' ')[0].substring(0, 5));
    const formattedDate = dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    newItem.innerHTML = `
        <div class="history-info">
            <span class="movement-type ${type}">${type.toUpperCase()}</span>
            <span class="material-name">${material}</span>
            <span class="quantity">${type === 'entrada' ? '+' : '-'}${quantity} ${unit}</span>
            <span class="date">${formattedDate}</span>
        </div>
    `;
    
    // Add to beginning of history list
    historyContainer.insertBefore(newItem, historyContainer.firstChild);
    
    // Adicionar ao grid de cards visível
    const historyGrid = document.getElementById('historyGrid');
    const newCard = document.createElement('div');
    newCard.className = 'history-card';
    
    newCard.innerHTML = `
        <div class="history-header">
            <span class="movement-type ${type}">${type.toUpperCase()}</span>
            <span class="date">${formattedDate}</span>
        </div>
        <div class="history-content">
            <h4 class="material-name">${material}</h4>
            <p class="quantity ${type}">${type === 'entrada' ? '+' : '-'}${quantity} ${unit}</p>
        </div>
    `;
    
    // Add to beginning of history grid
    historyGrid.insertBefore(newCard, historyGrid.firstChild);
    
    // Add animation
    newCard.style.opacity = '0';
    newCard.style.transform = 'translateY(-20px)';
    setTimeout(() => {
        newCard.style.transition = 'all 0.3s ease';
        newCard.style.opacity = '1';
        newCard.style.transform = 'translateY(0)';
    }, 100);
}

function updateStockTable(material, type, quantity, unit) {
    const table = document.querySelector('.data-table tbody');
    const rows = table.getElementsByTagName('tr');
    
    for (let row of rows) {
        const materialName = row.cells[0].textContent;
        if (materialName === material) {
            const currentQuantity = parseInt(row.cells[1].textContent);
            const newQuantity = type === 'entrada' ? 
                currentQuantity + parseInt(quantity) : 
                currentQuantity - parseInt(quantity);
            
            row.cells[1].textContent = newQuantity;
            
            // Update status
            const statusCell = row.cells[3].querySelector('span');
            if (newQuantity < 20) {
                statusCell.textContent = 'Baixo';
                statusCell.className = 'status-low';
            } else {
                statusCell.textContent = 'Normal';
                statusCell.className = 'status-good';
            }
            
            // Update stats
            updateStats();
            break;
        }
    }
}

function showSuccessMessage(message) {
    // Create success message element
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
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 300);
    }, 3000);
}

function deleteMaterial(button) {
    if (confirm('Tem certeza que deseja excluir este material?')) {
        const card = button.closest('.material-card');
        const materialName = card.querySelector('.material-name').textContent;
        
        // Encontrar e remover a linha correspondente na tabela oculta
        const table = document.querySelector('.data-table tbody');
        const rows = table.getElementsByTagName('tr');
        for (let row of rows) {
            if (row.cells[0].textContent === materialName) {
                row.remove();
                break;
            }
        }
        
        // Add fade out animation ao card
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            card.remove();
            updateStats();
            updateMaterialFilter();
            showSuccessMessage(`Material "${materialName}" excluído com sucesso!`);
        }, 300);
    }
}

function editMaterial(button) {
    const card = button.closest('.material-card');
    const materialName = card.querySelector('.material-name').textContent;
    
    // Encontrar a linha correspondente na tabela oculta
    const table = document.querySelector('.data-table tbody');
    const rows = table.getElementsByTagName('tr');
    let targetRow = null;
    let rowIndex = -1;
    
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].cells[0].textContent === materialName) {
            targetRow = rows[i];
            rowIndex = i;
            break;
        }
    }
    
    if (targetRow) {
        // Get current values from table row
        const nome = targetRow.cells[0].textContent;
        const quantidade = targetRow.cells[1].textContent;
        const unidade = targetRow.cells[2].textContent;
        
        // Fill edit form
        document.getElementById('editMaterialNome').value = nome;
        document.getElementById('editMaterialQuantidade').value = quantidade;
        document.getElementById('editMaterialUnidade').value = unidade;
        
        // Store row index for later use
        document.getElementById('editMaterialModal').dataset.rowIndex = rowIndex;
        
        // Store card reference for later update
        document.getElementById('editMaterialModal').dataset.cardElement = card.outerHTML;
        
        // Show modal
        showEditMaterialModal();
    }
}

function updateMaterialInTable(rowIndex, nome, quantidade, unidade) {
    // Update table row
    const table = document.querySelector('.data-table tbody');
    const row = table.rows[rowIndex];
    
    // Get old material name before updating
    const oldMaterialName = row.cells[0].textContent;
    
    // Update cells
    row.cells[0].textContent = nome;
    row.cells[1].textContent = quantidade;
    row.cells[2].textContent = unidade;
    
    // Update status
    const status = quantidade < 20 ? 'Baixo' : 'Normal';
    const statusClass = quantidade < 20 ? 'status-low' : 'status-good';
    row.cells[3].innerHTML = `<span class="${statusClass}">${status}</span>`;
    
    // Find and update corresponding card using the old material name
    const materialsGrid = document.getElementById('materialsGrid');
    const cards = materialsGrid.getElementsByClassName('material-card');
    
    for (let card of cards) {
        const cardMaterialName = card.querySelector('.material-name').textContent;
        if (cardMaterialName === oldMaterialName) {
            // Update card content
            card.querySelector('.material-name').textContent = nome;
            card.querySelector('.material-quantity').textContent = quantidade;
            card.querySelector('.material-unit').textContent = unidade;
            
            const statusElement = card.querySelector('.material-status');
            statusElement.textContent = status;
            statusElement.className = `material-status ${statusClass}`;
            break;
        }
    }
    
    // Update stats and filters
    updateStats();
    updateMaterialFilter();
}

function filterHistory() {
    const materialFilter = document.getElementById('filterMaterial').value;
    const dateFilter = document.getElementById('filterDate').value;
    const typeFilter = document.getElementById('filterType').value;
    
    // Filtrar cards visíveis
    const historyGrid = document.getElementById('historyGrid');
    const cards = historyGrid.getElementsByClassName('history-card');
    let visibleCount = 0;
    
    for (let card of cards) {
        const materialName = card.querySelector('.material-name').textContent;
        const dateText = card.querySelector('.date').textContent;
        const movementType = card.querySelector('.movement-type').textContent.toLowerCase();
        
        // Parse date from format "DD/MM/YYYY HH:mm" to compare with date filter
        const itemDate = dateText.split(' ')[0];
        const [day, month, year] = itemDate.split('/');
        const formattedItemDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        let matchesMaterial = !materialFilter || materialName === materialFilter;
        let matchesDate = !dateFilter || formattedItemDate === dateFilter;
        let matchesType = !typeFilter || movementType.includes(typeFilter);
        
        if (matchesMaterial && matchesDate && matchesType) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    }
    
    // Show message if no results
    const existingMessage = document.querySelector('.no-history-results');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (visibleCount === 0) {
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
    
    // Manter compatibilidade com lista original (escondida)
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        const materialName = item.querySelector('.material-name').textContent;
        const dateText = item.querySelector('.date').textContent;
        const movementType = item.querySelector('.movement-type').textContent.toLowerCase();
        
        // Parse date from format "DD/MM/YYYY HH:mm" to compare with date filter
        const itemDate = dateText.split(' ')[0];
        const [day, month, year] = itemDate.split('/');
        const formattedItemDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        let matchesMaterial = !materialFilter || materialName === materialFilter;
        let matchesDate = !dateFilter || formattedItemDate === dateFilter;
        let matchesType = !typeFilter || movementType.includes(typeFilter);
        
        if (matchesMaterial && matchesDate && matchesType) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearFilters() {
    document.getElementById('filterMaterial').value = '';
    document.getElementById('filterDate').value = '';
    document.getElementById('filterType').value = '';
    
    // Limpar cards visíveis
    const cards = document.querySelectorAll('.history-card');
    cards.forEach(card => {
        card.style.display = '';
    });
    
    // Remover mensagem de nenhum resultado se existir
    const existingMessage = document.querySelector('.no-history-results');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Manter compatibilidade com lista original (escondida)
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        item.style.display = 'block';
    });
    
    // Remover mensagem antiga se existir
    const oldMessage = document.querySelector('.no-results-message');
    if (oldMessage) {
        oldMessage.remove();
    }
}

function searchMaterials() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const materialsGrid = document.getElementById('materialsGrid');
    const cards = materialsGrid.getElementsByClassName('material-card');
    let visibleCount = 0;
    
    for (let card of cards) {
        const materialName = card.querySelector('.material-name').textContent.toLowerCase();
        
        if (searchTerm === '' || materialName.includes(searchTerm)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    }
    
    // Show message if no results
    const existingMessage = document.querySelector('.no-search-results');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (visibleCount === 0 && searchTerm !== '') {
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

function updateStats() {
    const table = document.querySelector('.data-table tbody');
    const rows = table.getElementsByTagName('tr');
    
    let totalQuantity = 0;
    let lowStock = 0;
    
    for (let row of rows) {
        const quantity = parseInt(row.cells[1].textContent);
        totalQuantity += quantity;
        
        if (quantity < 20) {
            lowStock++;
        }
    }
    
    // Update stat cards
    const totalCard = document.querySelector('.stat-number');
    if (totalCard) {
        totalCard.textContent = totalQuantity.toLocaleString();
    }
    
    const lowStockCard = document.querySelectorAll('.stat-number')[2];
    if (lowStockCard) {
        lowStockCard.textContent = lowStock;
    }
}

// Add CSS animations
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
