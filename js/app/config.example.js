/**
 * Archivo de configuración de ejemplo.
 * Copia este archivo a config.js y completa con los datos reales del entorno.
 * NO subas config.js al repositorio (está en .gitignore).
 */

// Clave pública de reCAPTCHA v3.
const RECAPTCHA_SITE_KEY = 'TU_CLAVE_RECAPTCHA_AQUI';

// Configuración de la API.
const API_CONFIG = {
    // Desarrollo: perfil "http" de launchSettings del proyecto omp-api.
    // Producción: cadena vacía, porque landing y API comparten origen.
    baseUrl: 'http://localhost:5081',

    // Timeout de cada petición, en milisegundos.
    timeout: 30000,

    // Rutas de los endpoints públicos (ver Controllers de omp-api).
    endpoints: {
        galleryCategories: '/api/gallery/categories',
        galleryFeatured: '/api/gallery/featured',
        packages: '/api/packages',
        booking: '/api/booking',
        contact: '/api/contact'
    }
};

// Hacer disponible globalmente para el resto de los scripts.
window.RECAPTCHA_SITE_KEY = RECAPTCHA_SITE_KEY;
window.API_CONFIG = API_CONFIG;
