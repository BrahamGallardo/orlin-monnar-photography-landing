/**
 * Servicio para Google reCAPTCHA v3.
 * Carga el script bajo demanda y genera el token que exigen los endpoints
 * públicos de la API (booking y contacto).
 * @class CaptchaService
 */
class CaptchaService {
    /**
     * Constructor del servicio de captcha.
     * @param {string} siteKey - Clave pública de reCAPTCHA v3.
     */
    constructor(siteKey) {
        this.siteKey = siteKey;
        this.isLoaded = false;
        this.loadPromise = null;
    }

    /**
     * Inicializa y carga el script de reCAPTCHA.
     * @returns {Promise<boolean>} Promesa que resuelve cuando reCAPTCHA está listo.
     */
    async init() {
        if (this.isLoaded) {
            return true;
        }

        // Una sola carga aunque varios formularios la pidan a la vez.
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise((resolve, reject) => {
            if (typeof grecaptcha !== 'undefined') {
                this.isLoaded = true;
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                grecaptcha.ready(() => {
                    this.isLoaded = true;
                    resolve(true);
                });
            };

            script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA.'));

            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    /**
     * Ejecuta reCAPTCHA y obtiene el token de la acción.
     * @param {string} action - Acción asociada al token ('booking' o 'contact').
     * @returns {Promise<string>} Token de reCAPTCHA.
     */
    async execute(action = 'submit') {
        await this.init();

        if (!this.isReady()) {
            throw new Error('reCAPTCHA no está disponible.');
        }

        const token = await grecaptcha.execute(this.siteKey, { action: action });

        if (!token) {
            throw new Error('No se pudo generar el token de reCAPTCHA.');
        }

        return token;
    }

    /**
     * Indica si el servicio está cargado y listo.
     * @returns {boolean} True si reCAPTCHA está disponible.
     */
    isReady() {
        return this.isLoaded && typeof grecaptcha !== 'undefined';
    }

    /**
     * Mueve el badge de reCAPTCHA a la izquierda para no tapar el botón de subir.
     * @returns {void}
     */
    moveBadgeToLeft() {
        const style = document.createElement('style');
        style.id = 'recaptcha-custom-style';
        style.innerHTML = '.grecaptcha-badge { left: 4px !important; right: auto !important; bottom: 14px !important; }';

        document.head.appendChild(style);
    }
}

// La clave se define en js/app/config.js.
const recaptchaSiteKey = window.RECAPTCHA_SITE_KEY || '';

// Instancia global compartida por todos los formularios.
window.captchaService = new CaptchaService(recaptchaSiteKey);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.captchaService.moveBadgeToLeft());
} else {
    window.captchaService.moveBadgeToLeft();
}

// Exportar para uso global.
window.CaptchaService = CaptchaService;
