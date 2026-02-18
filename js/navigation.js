// Sistema de Navegação - Packing House
// Centralização de toda a lógica de navegação e menus

class NavigationManager {
    constructor() {
        console.log('NavigationManager: Inicializando...');
        this.init();
    }

    init() {
        console.log('NavigationManager: Configurando menus...');
        this.setupFloatingMenu();
        this.setupSidebarMenu();
        this.setupMenuItems();
        console.log('NavigationManager: Configuração concluída!');
    }

    // Configuração do Menu Flutuante (usado em resumo.html e estoque.html)
    setupFloatingMenu() {
        const menuBtn = document.getElementById('floatingMenuBtn');
        const floatingMenu = document.getElementById('floatingMenu');
        
        console.log('Menu Flutuante - Botão encontrado:', !!menuBtn);
        console.log('Menu Flutuante - Menu encontrado:', !!floatingMenu);
        
        if (menuBtn && floatingMenu) {
            // Toggle do menu flutuante
            menuBtn.addEventListener('click', (e) => {
                console.log('Menu flutuante clicado!');
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
        } else {
            console.warn('Menu flutuante não encontrado no DOM');
        }
    }

    // Configuração do Menu Lateral (usado em estoque.html)
    setupSidebarMenu() {
        const menuBtn = document.querySelector('.menu-btn');
        const menuNav = document.getElementById('menuNav');
        
        console.log('Menu Lateral - Botão encontrado:', !!menuBtn);
        console.log('Menu Lateral - Menu encontrado:', !!menuNav);
        
        if (menuBtn && menuNav) {
            // Função global toggleMenu para compatibilidade
            window.toggleMenu = () => {
                menuNav.classList.toggle('active');
                menuBtn.classList.toggle('active');
            };

            // Adicionar evento de clique ao botão
            menuBtn.addEventListener('click', (e) => {
                console.log('Menu lateral clicado!');
                e.stopPropagation();
                this.toggleSidebar();
            });

            // Fechar menu ao clicar fora
            document.addEventListener('click', (e) => {
                if (!menuNav.contains(e.target) && e.target !== menuBtn) {
                    menuNav.classList.remove('active');
                    menuBtn.classList.remove('active');
                }
            });
        } else {
            console.log('Menu lateral não encontrado (normal em algumas páginas)');
        }
    }

    // Configuração dos itens de menu para fechar menus após clique
    setupMenuItems() {
        // Itens do menu flutuante
        const floatingMenuItems = document.querySelectorAll('.floating-menu .menu-item');
        console.log('Itens menu flutuante encontrados:', floatingMenuItems.length);
        
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

        // Itens do menu lateral
        const sidebarMenuItems = document.querySelectorAll('#menuNav a');
        console.log('Itens menu lateral encontrados:', sidebarMenuItems.length);
        
        sidebarMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                const menuNav = document.getElementById('menuNav');
                const menuBtn = document.querySelector('.menu-btn');
                if (menuNav && menuBtn) {
                    menuNav.classList.remove('active');
                    menuBtn.classList.remove('active');
                }
            });
        });
    }

    // Métodos públicos
    toggleSidebar() {
        const menuNav = document.getElementById('menuNav');
        const menuBtn = document.querySelector('.menu-btn');
        if (menuNav && menuBtn) {
            menuNav.classList.toggle('active');
            menuBtn.classList.toggle('active');
        }
    }

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

        // Fechar menu lateral
        const sidebarMenu = document.getElementById('menuNav');
        const sidebarBtn = document.querySelector('.menu-btn');
        if (sidebarMenu && sidebarBtn) {
            sidebarMenu.classList.remove('active');
            sidebarBtn.classList.remove('active');
        }
    }
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, criando NavigationManager...');
    window.navigationManager = new NavigationManager();
});

// Exportar para uso global
window.NavigationManager = NavigationManager;
