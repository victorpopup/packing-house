// Modal functions
function showAddMaterialModal() {
    document.getElementById('addMaterialModal').style.display = 'block';
    document.getElementById('movementModal').style.display = 'none';
    document.getElementById('historyModal').style.display = 'none';
}

function showMovementModal(product, type) {
    document.getElementById('movementModal').style.display = 'block';
    document.getElementById('addMaterialModal').style.display = 'none';
    document.getElementById('historyModal').style.display = 'none';
    
    document.getElementById('movementProduct').value = product;
    document.getElementById('movementType').value = type;
    document.getElementById('movementTitle').textContent = type === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque';
    document.getElementById('movementDate').value = new Date().toISOString().split('T')[0];
}

function showHistory(product) {
    document.getElementById('historyModal').style.display = 'block';
    document.getElementById('addMaterialModal').style.display = 'none';
    document.getElementById('movementModal').style.display = 'none';
    document.getElementById('historyTitle').textContent = `Histórico - ${product}`;
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
    // Material form
    const materialForm = document.querySelector('.material-form');
    if (materialForm) {
        materialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('materialNome').value;
            const categoria = document.getElementById('materialCategoria').value;
            const quantidade = document.getElementById('materialQuantidade').value;
            const unidade = document.getElementById('materialUnidade').value;
            
            // Add new row to table
            addMaterialToTable(nome, categoria, quantidade, unidade);
            
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
            
            const product = document.getElementById('movementProduct').value;
            const type = document.getElementById('movementType').value;
            const quantity = document.getElementById('movementQuantity').value;
            const reason = document.getElementById('movementReason').value;
            const date = document.getElementById('movementDate').value;
            
            // Process movement
            processMovement(product, type, quantity, reason, date);
            
            // Reset form and close modal
            movementForm.reset();
            closeModal('movementModal');
            
            alert(`${type === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
        });
    }
});

function addMaterialToTable(nome, categoria, quantidade, unidade) {
    const table = document.querySelector('.data-table tbody');
    const newRow = table.insertRow();
    const code = '#' + String(table.rows.length).padStart(3, '0');
    
    const status = quantidade < 20 ? 'Baixo' : 'Normal';
    const statusClass = quantidade < 20 ? 'status-low' : 'status-good';
    
    newRow.innerHTML = `
        <td>${code}</td>
        <td>${nome}</td>
        <td>${categoria}</td>
        <td>${quantidade}</td>
        <td>${unidade}</td>
        <td><span class="${statusClass}">${status}</span></td>
        <td>
            <button class="btn-small" onclick="showMovementModal('${nome}', 'entrada')">Entrada</button>
            <button class="btn-small" onclick="showMovementModal('${nome}', 'saida')">Saída</button>
            <button class="btn-small" onclick="showHistory('${nome}')">Histórico</button>
        </td>
    `;
}

function processMovement(product, type, quantity, reason, date) {
    // Find the product row and update quantity
    const table = document.querySelector('.data-table tbody');
    const rows = table.getElementsByTagName('tr');
    
    for (let row of rows) {
        const productName = row.cells[1].textContent;
        if (productName === product) {
            const currentQuantity = parseInt(row.cells[3].textContent);
            const newQuantity = type === 'entrada' ? 
                currentQuantity + parseInt(quantity) : 
                currentQuantity - parseInt(quantity);
            
            row.cells[3].textContent = newQuantity;
            
            // Update status
            const statusCell = row.cells[5].querySelector('span');
            if (newQuantity < 20) {
                statusCell.textContent = 'Baixo';
                statusCell.className = 'status-low';
            } else {
                statusCell.textContent = 'Normal';
                statusCell.className = 'status-good';
            }
            
            // Update stats (simplified)
            updateStats();
            break;
        }
    }
}

function updateStats() {
    const table = document.querySelector('.data-table tbody');
    const rows = table.getElementsByTagName('tr');
    
    let totalQuantity = 0;
    let lowStock = 0;
    
    for (let row of rows) {
        const quantity = parseInt(row.cells[3].textContent);
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
