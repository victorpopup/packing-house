// Sistema de Navegação - Packing House
// Centralização de toda a lógica de navegação e menus

class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupFloatingMenu();
        this.setupMenuItems();
    }

    // Configuração do Menu Flutuante
    setupFloatingMenu() {
        const menuBtn = document.getElementById('floatingMenuBtn');
        const floatingMenu = document.getElementById('floatingMenu');
        
        if (menuBtn && floatingMenu) {
            // Toggle do menu flutuante
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                floatingMenu.classList.toggle('active');
                menuBtn.classList.toggle('active');
            });
            
            // Fechar menu ao clicar fora
            document.addEventListener('click', (e) => {
                if (!floatingMenu.contains(e.target) && e.target !== menuBtn) {
                    floatingMenu.classList.remove('active');
                    menuBtn.classList.remove('active');
                }
            });
        }
    }

    // Configuração dos itens de menu para fechar menus após clique
    setupMenuItems() {
        // Itens do menu flutuante
        const floatingMenuItems = document.querySelectorAll('.floating-menu .menu-item');
        
        floatingMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                const floatingMenu = document.getElementById('floatingMenu');
                const menuBtn = document.getElementById('floatingMenuBtn');
                if (floatingMenu && menuBtn) {
                    floatingMenu.classList.remove('active');
                    menuBtn.classList.remove('active');
                }
            });
        });
    }

    // Métodos públicos
    toggleFloatingMenu() {
        const floatingMenu = document.getElementById('floatingMenu');
        const menuBtn = document.getElementById('floatingMenuBtn');
        if (floatingMenu && menuBtn) {
            floatingMenu.classList.toggle('active');
            menuBtn.classList.toggle('active');
        }
    }

    closeAllMenus() {
        // Fechar menu flutuante
        const floatingMenu = document.getElementById('floatingMenu');
        const floatingBtn = document.getElementById('floatingMenuBtn');
        if (floatingMenu && floatingBtn) {
            floatingMenu.classList.remove('active');
            floatingBtn.classList.remove('active');
        }
    }
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.navigationManager = new NavigationManager();
        console.log('Sistema de navegação inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar navegação:', error);
    }
});

// Exportar para uso global
window.NavigationManager = NavigationManager;
