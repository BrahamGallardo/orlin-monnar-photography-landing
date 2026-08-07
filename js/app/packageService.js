/**
 * Servicio de consulta de los paquetes fotográficos.
 * Endpoint anónimo de PackageController.
 * @class PackageService
 */
class PackageService {
    /**
     * Constructor del servicio de paquetes.
     * @param {ApiService} apiService - Instancia del servicio API genérico.
     */
    constructor(apiService) {
        this.api = apiService;
        this.endpoints = window.API_CONFIG.endpoints;
    }

    /**
     * Obtiene los paquetes publicados, ordenados para la página Investment.
     * @returns {Promise<Object>} Respuesta con un arreglo de PackageDto.
     */
    async getPublishedPackages() {
        return await this.api.get(this.endpoints.packages);
    }
}

// Exportar para uso global.
window.PackageService = PackageService;
