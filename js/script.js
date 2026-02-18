// Menu functionality
function toggleMenu() {
    const menuNav = document.getElementById('menuNav');
    menuNav.classList.toggle('active');
}

// Close menu when clicking outside
document.addEventListener('click', (event) => {
    const menuNav = document.getElementById('menuNav');
    const menuBtn = document.querySelector('.menu-btn');
    
    if (!menuNav.contains(event.target) && !menuBtn.contains(event.target)) {
        menuNav.classList.remove('active');
    }
});
