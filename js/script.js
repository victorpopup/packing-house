function toggleMenu() {
    const menuNav = document.getElementById('menuNav');
    menuNav.classList.toggle('active');
}

// Fechar menu ao clicar fora
document.addEventListener('click', function(event) {
    const menuNav = document.getElementById('menuNav');
    const menuBtn = document.querySelector('.menu-btn');
    
    if (!menuNav.contains(event.target) && !menuBtn.contains(event.target)) {
        menuNav.classList.remove('active');
    }
});
