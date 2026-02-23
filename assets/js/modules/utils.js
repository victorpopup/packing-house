/**
 * Utils Module - Packing House
 * Funções utilitárias compartilhadas
 */

const UtilsModule = {
    name: 'utils',
    version: '1.0.0',

    /**
     * Inicializa o módulo de utilidades
     * @param {Object} config - Configuração da aplicação
     */
    async init(config) {
        this.config = config;
        this.log('Inicializando módulo de utilidades...');
        
        // Configura helpers globais
        this.setupGlobalHelpers();
        
        this.log('Módulo de utilidades inicializado');
    },

    /**
     * Configura helpers globais
     */
    setupGlobalHelpers() {
        // Adiciona métodos ao objeto window para fácil acesso
        window.Utils = this;
        
        // Adiciona formatadores globais
        window.formatCurrency = this.formatCurrency;
        window.formatDate = this.formatDate;
        window.formatNumber = this.formatNumber;
        window.formatQuantity = this.formatQuantity;
    },

    /**
     * Formata valor monetário
     * @param {number} value - Valor a formatar
     * @param {string} currency - Símbolo da moeda (padrão: R$)
     * @returns {string} Valor formatado
     */
    formatCurrency(value, currency = 'R$') {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(value);
    },

    /**
     * Formata data
     * @param {Date|string} date - Data a formatar
     * @param {string} format - Formato desejado ('short', 'long', 'time', 'datetime')
     * @returns {string} Data formatada
     */
    formatDate(date, format = 'short') {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            return '';
        }

        const options = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            long: { day: 'numeric', month: 'long', year: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        };

        return new Intl.DateTimeFormat('pt-BR', options[format] || options.short).format(dateObj);
    },

    /**
     * Formata número com separadores
     * @param {number} value - Valor a formatar
     * @param {number} decimals - Casas decimais
     * @returns {string} Número formatado
     */
    formatNumber(value, decimals = 2) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }
        
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    },

    /**
     * Formata quantidade com unidade
     * @param {number} value - Valor a formatar
     * @param {string} unit - Unidade de medida
     * @returns {string} Quantidade formatada
     */
    formatQuantity(value, unit = '') {
        const formatted = this.formatNumber(value, 0);
        return unit ? `${formatted} ${unit}` : formatted;
    },

    /**
     * Gera ID único
     * @param {string} prefix - Prefixo para o ID
     * @returns {string} ID único
     */
    generateId(prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
    },

    /**
     * Debounce function
     * @param {Function} func - Função a debouncar
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função debouncada
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func - Função a throttlear
     * @param {number} limit - Limite de tempo em ms
     * @returns {Function} Função throttled
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Valida CPF
     * @param {string} cpf - CPF a validar
     * @returns {boolean} True se válido
     */
    validateCPF(cpf) {
        if (!cpf) return false;
        
        // Remove caracteres não numéricos
        cpf = cpf.replace(/[^\d]/g, '');
        
        // Verifica tamanho
        if (cpf.length !== 11) return false;
        
        // Verifica sequências inválidas
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validação do CPF
        let sum = 0;
        let remainder;
        
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }
        
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;
        
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;
        
        return true;
    },

    /**
     * Valida CNPJ
     * @param {string} cnpj - CNPJ a validar
     * @returns {boolean} True se válido
     */
    validateCNPJ(cnpj) {
        if (!cnpj) return false;
        
        // Remove caracteres não numéricos
        cnpj = cnpj.replace(/[^\d]/g, '');
        
        // Verifica tamanho
        if (cnpj.length !== 14) return false;
        
        // Verifica sequências inválidas
        if (/^(\d)\1{13}$/.test(cnpj)) return false;
        
        // Validação do CNPJ (algoritmo simplificado)
        const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cnpj[i]) * weights[i + 1];
        }
        
        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;
        
        sum = 0;
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cnpj[i]) * weights[i];
        }
        
        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;
        
        return parseInt(cnpj[12]) === digit1 && parseInt(cnpj[13]) === digit2;
    },

    /**
     * Valida email
     * @param {string} email - Email a validar
     * @returns {boolean} True se válido
     */
    validateEmail(email) {
        if (!email) return false;
        
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Sanitiza string para uso em IDs/classes
     * @param {string} str - String a sanitizar
     * @returns {string} String sanitizada
     */
    sanitizeString(str) {
        if (!str) return '';
        
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} str - String a escapar
     * @returns {string} String escapada
     */
    escapeHTML(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Copia texto para área de transferência
     * @param {string} text - Texto a copiar
     * @returns {Promise<boolean>} True se sucesso
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback para navegadores antigos
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            }
        } catch (error) {
            this.error('Erro ao copiar para área de transferência:', error);
            return false;
        }
    },

    /**
     * Baixa arquivo
     * @param {string} content - Conteúdo do arquivo
     * @param {string} filename - Nome do arquivo
     * @param {string} mimeType - Tipo MIME
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    },

    /**
     * Converte bytes para formato legível
     * @param {number} bytes - Valor em bytes
     * @param {number} decimals - Casas decimais
     * @returns {string} Valor formatado
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * Obtém contraste de cor
     * @param {string} hexColor - Cor em hexadecimal
     * @returns {string} 'black' ou 'white'
     */
    getContrastColor(hexColor) {
        if (!hexColor) return 'white';
        
        // Remove # se presente
        const color = hexColor.replace('#', '');
        
        // Converte para RGB
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        
        // Calcula luminosidade
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        
        return brightness > 128 ? 'black' : 'white';
    },

    /**
     * Destrói o módulo
     */
    destroy() {
        // Remove helpers globais
        delete window.Utils;
        delete window.formatCurrency;
        delete window.formatDate;
        delete window.formatNumber;
        delete window.formatQuantity;
        
        this.log('Módulo de utilidades destruído');
    },

    /**
     * Sistema de logging
     */
    log(...args) {
        console.log(`[Utils]`, ...args);
    },

    warn(...args) {
        console.warn(`[Utils]`, ...args);
    },

    error(...args) {
        console.error(`[Utils]`, ...args);
    }
};

// Registra o módulo na aplicação principal
if (window.PackingHouse) {
    window.PackingHouse.registerModule('utils', UtilsModule);
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UtilsModule;
}
