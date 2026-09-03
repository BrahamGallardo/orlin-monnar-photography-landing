/**
 * Servicio de alertas basado en SweetAlert2.
 * Centraliza el estilo de los avisos para que las páginas solo describan el mensaje.
 * @class AlertService
 */
class AlertService {
    /**
     * Constructor del servicio de alertas.
     */
    constructor() {
        // boxed-btn es la clase de botón del template Halen: los avisos heredan su estilo.
        this.defaultConfig = {
            customClass: {
                confirmButton: 'boxed-btn',
                cancelButton: 'boxed-btn boxed-btn-cancel',
                popup: 'omp-swal'
            },
            buttonsStyling: false
        };
    }

    /**
     * Muestra una alerta de éxito.
     * @param {string} title - Título de la alerta.
     * @param {string} message - Mensaje de la alerta.
     * @param {Object} options - Opciones adicionales de SweetAlert2.
     * @returns {Promise} Promesa de SweetAlert2.
     */
    success(title, message = '', options = {}) {
        return Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            confirmButtonText: 'OK',
            ...this.defaultConfig,
            ...options
        });
    }

    /**
     * Muestra una alerta de error.
     * @param {string} title - Título de la alerta.
     * @param {string} message - Mensaje de la alerta.
     * @param {Object} options - Opciones adicionales de SweetAlert2.
     * @returns {Promise} Promesa de SweetAlert2.
     */
    error(title, message = '', options = {}) {
        return Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonText: 'OK',
            ...this.defaultConfig,
            ...options
        });
    }

    /**
     * Muestra la lista de errores de validación devuelta por la API.
     * @param {Array<string>} errors - Mensajes de validación.
     * @returns {Promise} Promesa de SweetAlert2.
     */
    validationError(errors) {
        const errorList = (errors || []).map(error => `• ${error}`).join('<br>');

        return Swal.fire({
            icon: 'error',
            title: 'Please check the following',
            html: `<div class="text-left">${errorList}</div>`,
            confirmButtonText: 'OK',
            ...this.defaultConfig
        });
    }

    /**
     * Muestra una notificación breve en una esquina.
     * @param {string} message - Mensaje del aviso.
     * @param {string} icon - Icono: success, error, warning o info.
     * @param {Object} options - Opciones adicionales de SweetAlert2.
     * @returns {Promise} Promesa de SweetAlert2.
     */
    toast(message, icon = 'success', options = {}) {
        return Swal.fire({
            toast: true,
            position: options.position || 'top-end',
            icon: icon,
            title: message,
            showConfirmButton: false,
            timer: options.timer || 3000,
            timerProgressBar: true,
            // El toast no hereda defaultConfig —no tiene botones— pero sí
            // necesita la clase del sistema para no salir con el estilo de
            // fábrica de SweetAlert.
            customClass: { popup: 'omp-swal omp-swal--toast' },
            ...options
        });
    }

    /**
     * Cierra cualquier alerta abierta.
     * @returns {void}
     */
    close() {
        Swal.close();
    }
}

// Instancia global compartida por las páginas.
window.alertService = new AlertService();

// Exportar para uso global.
window.AlertService = AlertService;
