// Janelas de Confirmação Bonitas - Packing House

class ConfirmationDialog {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.currentResolve = null;
        this.init();
    }

    init() {
        // Criar elementos do DOM
        this.createOverlay();
        this.addEventListeners();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'confirmation-overlay';
        this.overlay.innerHTML = `
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <div class="confirmation-icon"></div>
                    <h3 class="confirmation-title"></h3>
                </div>
                <div class="confirmation-content"></div>
                <div class="confirmation-buttons">
                    <button class="confirmation-btn confirmation-btn-cancel">Cancelar</button>
                    <button class="confirmation-btn confirmation-btn-confirm">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);
        this.modal = this.overlay.querySelector('.confirmation-modal');
    }

    addEventListeners() {
        const cancelBtn = this.overlay.querySelector('.confirmation-btn-cancel');
        const confirmBtn = this.overlay.querySelector('.confirmation-btn-confirm');

        cancelBtn.addEventListener('click', () => this.hide(false));
        confirmBtn.addEventListener('click', () => this.hide(true));

        // Fechar ao clicar no overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide(false);
            }
        });

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.hide(false);
            }
        });
    }

    show(options) {
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            
            const {
                title = 'Confirmar Ação',
                message = 'Tem certeza que deseja continuar?',
                type = 'info', // info, warning, danger
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                details = null
            } = options;

            // Limpar classes anteriores
            this.modal.className = 'confirmation-modal';
            
            // Adicionar classe de tipo
            this.modal.classList.add(`confirmation-${type}`);

            // Atualizar conteúdo
            const icon = this.modal.querySelector('.confirmation-icon');
            const titleEl = this.modal.querySelector('.confirmation-title');
            const content = this.modal.querySelector('.confirmation-content');
            const confirmBtn = this.modal.querySelector('.confirmation-btn-confirm');
            const cancelBtn = this.modal.querySelector('.confirmation-btn-cancel');

            // Definir ícone baseado no tipo
            const icons = {
                info: 'ℹ️',
                warning: '⚠️',
                danger: '🗑️'
            };
            icon.textContent = icons[type] || icons.info;

            titleEl.textContent = title;
            confirmBtn.textContent = confirmText;
            cancelBtn.textContent = cancelText;

            // Montar conteúdo
            let contentHTML = `<p>${message}</p>`;
            if (details) {
                contentHTML += `<div class="confirmation-details">${details}</div>`;
            }
            content.innerHTML = contentHTML;

            // Mostrar modal
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    hide(confirmed) {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        if (this.currentResolve) {
            this.currentResolve(confirmed);
            this.currentResolve = null;
        }
    }
}

// Instância global
window.confirmationDialog = new ConfirmationDialog();

// Funções de conveniência para uso fácil
window.showDeleteConfirmation = (itemName, details = '') => {
    return window.confirmationDialog.show({
        title: '🗑️ Confirmar Exclusão',
        message: `Você está prestes a excluir "${itemName}".`,
        type: 'danger',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        details: details || 'Esta ação não poderá ser desfeita.'
    });
};

window.showEditConfirmation = (itemName, details = '') => {
    return window.confirmationDialog.show({
        title: '📝 Confirmar Edição',
        message: `Você está prestes a editar "${itemName}".`,
        type: 'info',
        confirmText: 'Salvar',
        cancelText: 'Cancelar',
        details: details
    });
};

window.showGenericConfirmation = (options) => {
    return window.confirmationDialog.show(options);
};
