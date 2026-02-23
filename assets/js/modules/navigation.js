/**
 * Navigation Module - Packing House
 * Gerencia a navegação e menu flutuante
 */

const NavigationModule = {
    name: 'navigation',
    version: '1.0.0',
    
    // Estado do módulo
    state: {
        isMenuOpen: false,
        currentPage: null,
        menuButton: null,
        menuElement: null
    },

    /**
     * Inicializa o módulo de navegação
     * @param {Object} config - Configuração da aplicação
     */
    async init(config) {
        this.config = config;
        this.log('Inicializando módulo de navegação...');

        // Aguarda o DOM estar pronto
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        this.initializeElements();
        this.bindEvents();
        this.updateActivePage();
        this.setupKeyboardNavigation();
        
        this.log('Módulo de navegação inicializado');
    },

    /**
     * Inicializa os elementos DOM
     */
    initializeElements() {
        this.state.menuButton = document.getElementById('floatingMenuBtn');
        this.state.menuElement = document.getElementById('floatingMenu');

        if (!this.state.menuButton) {
            this.warn('Botão do menu não encontrado');
        }

        if (!this.state.menuElement) {
            this.warn('Elemento do menu não encontrado');
        }
    },

    /**
     * Vincula eventos aos elementos
     */
    bindEvents() {
        if (this.state.menuButton) {
            this.state.menuButton.addEventListener('click', () => {
                this.toggleMenu();
            });
        }

        // Fecha o menu ao clicar fora
        document.addEventListener('click', (event) => {
            if (this.state.isMenuOpen && 
                !this.state.menuElement.contains(event.target) && 
                !this.state.menuButton.contains(event.target)) {
                this.closeMenu();
            }
        });

        // Fecha o menu com ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.state.isMenuOpen) {
                this.closeMenu();
            }
        });

        // Monitora mudanças na página
        window.addEventListener('popstate', () => {
            this.updateActivePage();
        });

        // Observa mudanças no DOM para atualizar navegação
        this.observeNavigationChanges();
    },

    /**
     * Configura navegação por teclado
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // Alt + M para abrir/fechar menu
            if (event.altKey && event.key === 'm') {
                event.preventDefault();
                this.toggleMenu();
            }

            // Navegação por números quando menu está aberto
            if (this.state.isMenuOpen && event.altKey) {
                const menuItems = this.state.menuElement?.querySelectorAll('.menu-item');
                if (menuItems) {
                    const key = parseInt(event.key);
                    if (key >= 1 && key <= menuItems.length) {
                        event.preventDefault();
                        menuItems[key - 1].click();
                    }
                }
            }
        });
    },

    /**
     * Observa mudanças na navegação
     */
    observeNavigationChanges() {
        // Observer para mudanças no URL
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                this.updateActivePage();
            }
        }).observe(document, { subtree: true, childList: true });

        // Observer para mudanças nos links do menu
        if (this.state.menuElement) {
            const observer = new MutationObserver(() => {
                this.updateActivePage();
            });
            observer.observe(this.state.menuElement, { 
                childList: true, 
                subtree: true 
            });
        }
    },

    /**
     * Alterna o estado do menu
     */
    toggleMenu() {
        if (this.state.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    },

    /**
     * Abre o menu flutuante
     */
    openMenu() {
        if (!this.state.menuElement || this.state.isMenuOpen) return;

        this.state.menuElement.classList.add('active');
        this.state.isMenuOpen = true;
        
        // Foco no primeiro item do menu
        const firstItem = this.state.menuElement.querySelector('.menu-item');
        if (firstItem) {
            firstItem.focus();
        }

        this.log('Menu aberto');
        this.dispatchMenuEvent('menu:opened');
    },

    /**
     * Fecha o menu flutuante
     */
    closeMenu() {
        if (!this.state.menuElement || !this.state.isMenuOpen) return;

        this.state.menuElement.classList.remove('active');
        this.state.isMenuOpen = false;

        // Retorna foco para o botão
        if (this.state.menuButton) {
            this.state.menuButton.focus();
        }

        this.log('Menu fechado');
        this.dispatchMenuEvent('menu:closed');
    },

    /**
     * Atualiza a página ativa no menu
     */
    updateActivePage() {
        if (!this.state.menuElement) return;

        const currentPath = window.location.pathname;
        const menuItems = this.state.menuElement.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href) {
                // Remove classe active de todos
                item.classList.remove('active');
                
                // Adiciona classe active ao item correspondente
                if (currentPath.includes(href) || 
                    (href.endsWith('.html') && currentPath.endsWith(href))) {
                    item.classList.add('active');
                }
            }
        });

        // Atualiza estado da página atual
        this.state.currentPage = currentPath;
        this.log('Página ativa atualizada:', currentPath);
    },

    /**
     * Navega para uma página específica
     * @param {string} page - Página de destino
     * @param {Object} options - Opções de navegação
     */
    navigateTo(page, options = {}) {
        const url = typeof page === 'string' ? page : page.url;
        
        if (options.replaceState) {
            window.history.replaceState({}, '', url);
        } else {
            window.history.pushState({}, '', url);
        }

        if (!options.noReload) {
            window.location.href = url;
        }

        this.log('Navegando para:', url);
    },

    /**
     * Adiciona item ao menu dinamicamente
     * @param {Object} item - Configuração do item
     */
    addMenuItem(item) {
        if (!this.state.menuElement) return;

        const menuItem = document.createElement('a');
        menuItem.href = item.url;
        menuItem.className = 'menu-item';
        menuItem.textContent = item.text;
        
        if (item.icon) {
            const icon = document.createElement('span');
            icon.className = 'menu-icon';
            icon.textContent = item.icon;
            menuItem.insertBefore(icon, menuItem.firstChild);
        }

        if (item.badge) {
            const badge = document.createElement('span');
            badge.className = 'menu-badge';
            badge.textContent = item.badge;
            menuItem.appendChild(badge);
        }

        this.state.menuElement.appendChild(menuItem);
        this.updateActivePage();
        
        this.log('Item adicionado ao menu:', item.text);
    },

    /**
     * Remove item do menu
     * @param {string} url - URL do item a remover
     */
    removeMenuItem(url) {
        if (!this.state.menuElement) return;

        const items = this.state.menuElement.querySelectorAll('.menu-item');
        items.forEach(item => {
            if (item.getAttribute('href') === url) {
                item.remove();
                this.log('Item removido do menu:', url);
            }
        });
    },

    /**
     * Dispara eventos do menu
     * @param {string} eventName - Nome do evento
     */
    dispatchMenuEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: {
                isOpen: this.state.isMenuOpen,
                currentPage: this.state.currentPage
            }
        });
        document.dispatchEvent(event);
    },

    /**
     * Obtém informações de navegação
     * @returns {Object} Estado atual da navegação
     */
    getState() {
        return {
            ...this.state,
            menuItems: this.state.menuElement ? 
                Array.from(this.state.menuElement.querySelectorAll('.menu-item')).map(item => ({
                    text: item.textContent,
                    url: item.getAttribute('href'),
                    active: item.classList.contains('active')
                })) : []
        };
    },

    /**
     * Destrói o módulo
     */
    destroy() {
        this.closeMenu();
        
        // Remove eventos
        if (this.state.menuButton) {
            this.state.menuButton.removeEventListener('click', this.toggleMenu);
        }

        // Limpa estado
        this.state = {
            isMenuOpen: false,
            currentPage: null,
            menuButton: null,
            menuElement: null
        };

        this.log('Módulo de navegação destruído');
    },

    /**
     * Sistema de logging
     */
    log(...args) {
        console.log(`[Navigation]`, ...args);
    },

    warn(...args) {
        console.warn(`[Navigation]`, ...args);
    },

    error(...args) {
        console.error(`[Navigation]`, ...args);
    }
};

// Registra o módulo na aplicação principal
if (window.PackingHouse) {
    window.PackingHouse.registerModule('navigation', NavigationModule);
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationModule;
}
