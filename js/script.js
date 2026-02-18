// Botão Flutuante de Menu - Implementação Simples
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('floatingMenuBtn');
    const floatingMenu = document.getElementById('floatingMenu');
    
    // Toggle do menu
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        floatingMenu.classList.toggle('active');
        menuBtn.classList.toggle('active');
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
        if (!floatingMenu.contains(e.target) && e.target !== menuBtn) {
            floatingMenu.classList.remove('active');
            menuBtn.classList.remove('active');
        }
    });
    
    // Fechar menu ao clicar em um item
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            floatingMenu.classList.remove('active');
            menuBtn.classList.remove('active');
        });
    });
});
