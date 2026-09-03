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

/**
 * Builds the srcset of a photograph for the mosaic thumbnails.
 * @param {Object} photo - PhotoDto returned by the API.
 * @returns {string} Value of the srcset attribute.
 * @remarks
 * Thumb and medium only. The 2560 px derivative is never worth a thumbnail,
 * and on a phone at 100vw a dense screen would pick it: the lightbox is the
 * one place that asks for it.
 */
function buildGridSrcset(photo) {
    if (!photo) {
        return '';
    }

    return [
        `${resolveMediaUrl(photo.thumbUrl)} 500w`,
        `${resolveMediaUrl(photo.mediumUrl)} 1200w`
    ].join(', ');
}

/**
 * Aspect ratio of a photograph, as the mosaic can show it.
 * @param {Object} photo - PhotoDto returned by the API, or null.
 * @returns {number} Width divided by height.
 * @remarks
 * Width and Height travel in the DTO, so the frame reserves the exact box
 * before the file arrives: Isotope never measures zero heights and nothing
 * jumps when the images land. A missing dimension falls back to 3/2, and the
 * extremes are clamped because a panorama or a very tall vertical would break
 * the rhythm of the column; object-fit then crops only that leftover.
 */
function photoAspectRatio(photo) {
    const fallback = 3 / 2;

    if (!photo || !photo.width || !photo.height) {
        return fallback;
    }

    return Math.min(Math.max(photo.width / photo.height, 0.55), 2.2);
}

// Exportar para uso global.
window.resolveMediaUrl = resolveMediaUrl;
window.buildPhotoSrcset = buildPhotoSrcset;
window.photoAltText = photoAltText;
window.buildGridSrcset = buildGridSrcset;
window.photoAspectRatio = photoAspectRatio;
