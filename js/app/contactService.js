/**
 * Servicio del formulario público de contacto.
 * Endpoint anónimo de ContactController, protegido con captcha y rate limiting.
 * @class ContactService
 */
class ContactService {
    /**
     * Constructor del servicio de contacto.
     * @param {ApiService} apiService - Instancia del servicio API genérico.
     */
    constructor(apiService) {
        this.api = apiService;
        this.endpoint = window.API_CONFIG.endpoints.contact;
    }

    /**
     * Envía un mensaje de contacto.
     * @param {Object} formData - Datos capturados en el formulario.
     * @param {string} formData.name - Nombre del remitente.
     * @param {string} formData.email - Email del remitente.
     * @param {string} formData.phone - Teléfono del remitente. Opcional.
     * @param {string} formData.subject - Asunto del mensaje.
     * @param {string} formData.message - Contenido del mensaje.
     * @param {string} formData.captchaToken - Token de reCAPTCHA v3.
     * @returns {Promise<Object>} Respuesta con el ContactMessageDto creado.
     * @remarks
     * CreateContactMessageRequestDto espera el captchaToken como propiedad plana
     * del mismo objeto, no en un sobre aparte.
     */
    async sendMessage(formData) {
        const dto = {
            name: (formData.name || '').trim(),
            email: (formData.email || '').trim(),
            phone: (formData.phone || '').trim() || null,
            subject: (formData.subject || '').trim(),
            message: (formData.message || '').trim(),
            captchaToken: formData.captchaToken || ''
        };

        return await this.api.post(this.endpoint, dto);
    }
}

// Exportar para uso global.
window.ContactService = ContactService;
