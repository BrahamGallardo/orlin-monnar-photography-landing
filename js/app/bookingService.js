/**
 * Servicio del formulario público de agendado de citas.
 * Endpoint anónimo de BookingController, protegido con captcha y rate limiting.
 * @class BookingService
 */
class BookingService {
    /**
     * Constructor del servicio de citas.
     * @param {ApiService} apiService - Instancia del servicio API genérico.
     */
    constructor(apiService) {
        this.api = apiService;
        this.endpoint = window.API_CONFIG.endpoints.booking;
    }

    /**
     * Registra una solicitud de cita.
     * @param {Object} formData - Datos capturados en el formulario.
     * @param {string} formData.fullName - Nombre completo del cliente.
     * @param {string} formData.email - Email del cliente.
     * @param {string} formData.phone - Teléfono del cliente.
     * @param {number} formData.packageId - Identificador del paquete seleccionado.
     * @param {string} formData.appointmentDate - Fecha y hora solicitadas, en UTC ISO 8601.
     * @param {string} formData.location - Lugar propuesto. Opcional.
     * @param {string} formData.notes - Comentarios del cliente. Opcional.
     * @param {string} formData.captchaToken - Token de reCAPTCHA v3.
     * @returns {Promise<Object>} Respuesta con el AppointmentDto creado.
     * @remarks
     * CreateAppointmentRequestDto espera el captchaToken como propiedad plana
     * y la fecha en UTC: la conversión desde la hora local se hace aquí.
     */
    async requestAppointment(formData) {
        const dto = {
            fullName: (formData.fullName || '').trim(),
            email: (formData.email || '').trim(),
            phone: (formData.phone || '').trim(),
            packageId: Number(formData.packageId) || 0,
            appointmentDate: formData.appointmentDate,
            location: (formData.location || '').trim() || null,
            notes: (formData.notes || '').trim() || null,
            captchaToken: formData.captchaToken || ''
        };

        return await this.api.post(this.endpoint, dto);
    }

    /**
     * Convierte una fecha y hora locales al formato UTC que espera la API.
     * @param {string} date - Fecha local en formato dd/mm/yyyy (salida del datepicker gijgo).
     * @param {string} time - Hora local en formato HH:mm. Opcional.
     * @returns {string|null} Fecha en ISO 8601 UTC, o null si la entrada es inválida.
     */
    toUtcIso(date, time) {
        if (!date) {
            return null;
        }

        const parts = date.split('/');

        if (parts.length !== 3) {
            return null;
        }

        const [hours, minutes] = (time || '00:00').split(':');

        // El constructor con componentes interpreta la fecha en la zona local
        // del navegador; toISOString la normaliza a UTC.
        const local = new Date(
            Number(parts[2]),
            Number(parts[1]) - 1,
            Number(parts[0]),
            Number(hours) || 0,
            Number(minutes) || 0
        );

        return isNaN(local.getTime()) ? null : local.toISOString();
    }
}

// Exportar para uso global.
window.BookingService = BookingService;
