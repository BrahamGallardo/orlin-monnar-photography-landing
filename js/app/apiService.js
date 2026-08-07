/**
 * Servicio genérico para realizar peticiones a la API.
 * @class ApiService
 */
class ApiService {
    /**
     * Constructor del servicio API.
     * @param {string} baseUrl - URL base de la API. Cadena vacía para el mismo origen.
     * @param {number} timeout - Timeout de cada petición, en milisegundos.
     */
    constructor(baseUrl, timeout) {
        this.baseUrl = baseUrl && baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : (baseUrl || '');
        this.timeout = timeout || 30000;
    }

    /**
     * Realiza una petición HTTP genérica.
     * @private
     * @param {string} endpoint - Endpoint de la API.
     * @param {Object} options - Opciones de la petición.
     * @returns {Promise<Object>} Respuesta normalizada: { success, status, data, error, validationErrors }.
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        const config = {
            method: options.method || 'GET',
            headers: { 'Content-Type': 'application/json', ...options.headers },
            signal: controller.signal
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);

            let data = null;

            if (response.status !== 204) {
                const contentType = response.headers.get('content-type') || '';

                data = contentType.includes('json')
                    ? await response.json().catch(() => null)
                    : await response.text();
            }

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    error: this.extractMessage(response.status, data),
                    validationErrors: this.extractFieldErrors(data),
                    data: data
                };
            }

            return { success: true, status: response.status, data: data };

        } catch (error) {
            // AbortError significa que se agotó el timeout; el resto son fallos de red.
            return {
                success: false,
                status: 0,
                error: error.name === 'AbortError'
                    ? 'The server took too long to respond. Please try again.'
                    : 'We could not reach the server. Check your connection and try again.',
                validationErrors: [],
                details: error.message
            };
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * Obtiene el mensaje visible de una respuesta fallida.
     * @private
     * @param {number} status - Código HTTP de la respuesta.
     * @param {Object} data - Cuerpo de la respuesta.
     * @returns {string} Mensaje para mostrar al usuario.
     */
    extractMessage(status, data) {
        if (status === 429) {
            return 'Too many attempts. Please wait a minute before trying again.';
        }

        // GlobalExceptionHandler de la API responde ProblemDetails: { status, title, detail }.
        if (data && (data.detail || data.title)) {
            return data.detail || data.title;
        }

        return 'Something went wrong while processing your request. Please try again later.';
    }

    /**
     * Aplana los errores de validación de un ValidationProblemDetails.
     * @private
     * @param {Object} data - Cuerpo de la respuesta.
     * @returns {Array<string>} Lista de mensajes de validación.
     */
    extractFieldErrors(data) {
        if (!data || !data.errors) {
            return [];
        }

        return Object.keys(data.errors)
            .reduce((list, key) => list.concat(data.errors[key] || []), []);
    }

    /**
     * Realiza una petición GET.
     * @param {string} endpoint - Endpoint de la API.
     * @param {Object} params - Parámetros de query string.
     * @returns {Promise<Object>} Respuesta normalizada de la API.
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();

        return await this.request(queryString ? `${endpoint}?${queryString}` : endpoint, { method: 'GET' });
    }

    /**
     * Realiza una petición POST.
     * @param {string} endpoint - Endpoint de la API.
     * @param {Object} body - Cuerpo de la petición.
     * @returns {Promise<Object>} Respuesta normalizada de la API.
     */
    async post(endpoint, body) {
        return await this.request(endpoint, { method: 'POST', body: body });
    }
}

/**
 * Crea una instancia de ApiService con la configuración de config.js.
 * @returns {ApiService} Instancia lista para usarse.
 */
function createApiService() {
    const config = window.API_CONFIG || {};

    return new ApiService(config.baseUrl, config.timeout);
}

// Exportar para uso global.
window.ApiService = ApiService;
window.createApiService = createApiService;
