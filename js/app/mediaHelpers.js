/**
 * Utilidades para consumir los derivados de imagen que entrega la API:
 * thumb (~500 px), medium (~1200 px) y large (~2560 px).
 * Ver sección 1.5 del plan de arquitectura.
 */

/**
 * Resuelve una ruta de media contra el host de la API.
 * @param {string} path - Ruta pública devuelta por la API (ej. '/media/gallery/foto-thumb.webp').
 * @returns {string} URL utilizable en un atributo src.
 * @remarks
 * Solo las rutas absolutas se anteponen al host de la API: son las que entrega
 * el backend. Las rutas relativas (imágenes provisionales servidas por la
 * propia landing) y las absolutas con esquema se devuelven sin tocar.
 * En producción baseUrl es vacío y todo resuelve contra el mismo origen.
 */
function resolveMediaUrl(path) {
    if (!path) {
        return '';
    }

    if (/^https?:\/\//i.test(path) || !path.startsWith('/')) {
        return path;
    }

    const baseUrl = (window.API_CONFIG && window.API_CONFIG.baseUrl) || '';

    return `${baseUrl}${path}`;
}

/**
 * Construye el srcset con los tres derivados de una fotografía.
 * @param {Object} photo - PhotoDto devuelto por la API.
 * @returns {string} Valor del atributo srcset.
 */
function buildPhotoSrcset(photo) {
    if (!photo) {
        return '';
    }

    return [
        `${resolveMediaUrl(photo.thumbUrl)} 500w`,
        `${resolveMediaUrl(photo.mediumUrl)} 1200w`,
        `${resolveMediaUrl(photo.largeUrl)} 2560w`
    ].join(', ');
}

/**
 * Obtiene el texto alternativo de una fotografía.
 * @param {Object} photo - PhotoDto devuelto por la API.
 * @returns {string} Texto alternativo, o cadena vacía si es decorativa.
 */
function photoAltText(photo) {
    if (!photo) {
        return '';
    }

    return photo.altText || photo.title || '';
}

// Exportar para uso global.
window.resolveMediaUrl = resolveMediaUrl;
window.buildPhotoSrcset = buildPhotoSrcset;
window.photoAltText = photoAltText;
