/**
 * Servicio de consulta de la galería pública.
 * Endpoints anónimos de GalleryController.
 * @class GalleryService
 */
class GalleryService {
    /**
     * Constructor del servicio de galería.
     * @param {ApiService} apiService - Instancia del servicio API genérico.
     */
    constructor(apiService) {
        this.api = apiService;
        this.endpoints = window.API_CONFIG.endpoints;
    }

    /**
     * Obtiene las categorías publicadas, sin sus fotografías.
     * @returns {Promise<Object>} Respuesta con un arreglo de GalleryCategoryDto.
     */
    async getCategories() {
        return await this.api.get(this.endpoints.galleryCategories);
    }

    /**
     * Obtiene una categoría publicada con sus fotografías.
     * @param {string} slug - Slug de la categoría.
     * @returns {Promise<Object>} Respuesta con un GalleryCategoryDto. Falla con 404 si no existe.
     */
    async getCategoryBySlug(slug) {
        return await this.api.get(`${this.endpoints.galleryCategories}/${encodeURIComponent(slug)}`);
    }

    /**
     * Obtiene las fotografías destacadas del carrusel del Home.
     * @param {number} take - Cantidad máxima. La API la acota entre 1 y 50.
     * @returns {Promise<Object>} Respuesta con un arreglo de PhotoDto.
     */
    async getFeaturedPhotos(take = 12) {
        return await this.api.get(this.endpoints.galleryFeatured, { take: take });
    }
}

// Exportar para uso global.
window.GalleryService = GalleryService;
