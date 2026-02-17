// Modal functions
function showAddMaterialModal() {
    document.getElementById('addMaterialModal').style.display = 'block';
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
    
    // Material form
    const materialForm = document.querySelector('.material-form');
    if (materialForm) {
        materialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('materialNome').value;
            const quantidade = document.getElementById('materialQuantidade').value;
            
            // Add new row to table
            addMaterialToTable(nome, quantidade);
            
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
            const date = document.getElementById('movementDate').value;
            const reason = document.getElementById('movementReason').value;
            
            // Add to history
            addMovementToHistory(material, type, quantity, date, reason);
            
            // Update stock table
            updateStockTable(material, type, quantity);
            
            // Reset form
            movementForm.reset();
            dateInput.value = new Date().toISOString().split('T')[0];
            
            // Show success message
            showSuccessMessage('Movimentação registrada com sucesso!');
        });
    }
});

function addMaterialToTable(nome, quantidade) {
    const table = document.querySelector('.data-table tbody');
    const newRow = table.insertRow();
    
    // Determine status based on quantity
    const status = quantidade < 20 ? 'Baixo' : 'Normal';
    const statusClass = quantidade < 20 ? 'status-low' : 'status-good';
    
    newRow.innerHTML = `
        <td data-label="Material">${nome}</td>
        <td data-label="Quantidade">${quantidade}</td>
        <td data-label="Status"><span class="${statusClass}">${status}</span></td>
    `;
}

function addMovementToHistory(material, type, quantity, date, reason) {
    const historyList = document.querySelector('.history-list');
    const newItem = document.createElement('div');
    newItem.className = 'history-item';
    
    // Format date and time
    const dateObj = new Date(date + 'T' + new Date().toTimeString().split(' ')[0].substring(0, 5));
    const formattedDate = dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    newItem.innerHTML = `
        <div class="history-info">
            <span class="movement-type ${type}">${type.toUpperCase()}</span>
            <span class="material-name">${material}</span>
            <span class="quantity">${type === 'entrada' ? '+' : '-'}${quantity}</span>
            <span class="date">${formattedDate}</span>
        </div>
        <p class="reason">${reason || 'Sem motivo especificado'}</p>
    `;
    
    // Add to beginning of history
    historyList.insertBefore(newItem, historyList.firstChild);
    
    // Add animation
    newItem.style.opacity = '0';
    newItem.style.transform = 'translateY(-20px)';
    setTimeout(() => {
        newItem.style.transition = 'all 0.3s ease';
        newItem.style.opacity = '1';
        newItem.style.transform = 'translateY(0)';
    }, 100);
}

function updateStockTable(material, type, quantity) {
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
            const statusCell = row.cells[2].querySelector('span');
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

function exportHistory() {
    // Create CSV content
    const historyItems = document.querySelectorAll('.history-item');
    let csvContent = 'Data,Tipo,Material,Quantidade,Motivo\n';
    
    historyItems.forEach(item => {
        const type = item.querySelector('.movement-type').textContent;
        const material = item.querySelector('.material-name').textContent;
        const quantity = item.querySelector('.quantity').textContent;
        const date = item.querySelector('.date').textContent;
        const reason = item.querySelector('.reason').textContent;
        
        csvContent += `"${date}","${type}","${material}","${quantity}","${reason}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessMessage('Histórico exportado com sucesso!');
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
