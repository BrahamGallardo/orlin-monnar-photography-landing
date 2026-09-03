/**
 * Módulo Alpine de la página Investment.
 *
 * Lee GET /api/packages, que ya devuelve solo los paquetes publicados. El
 * endpoint es una lista plana: una sola petición pinta toda la sección y no
 * hay motivo para consultar cada paquete por separado (el rate limit público
 * es de 60 req/min).
 *
 * Un fallo de la API —o un catálogo todavía vacío— cae en el juego provisional
 * de placeholderPhotos.js, igual que la galería: la página no se queda sin
 * contenido. Sus cifras son de referencia hasta que Orlin confirme el paquete
 * mínimo, y su enlace a la reserva no lleva paquete preseleccionado porque esos
 * registros no existen en la base de datos.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('investmentPage', () => ({
        loading: true,
        packages: [],
        notice: '',
        usingPlaceholderPackages: false,

        content: window.SITE_CONTENT.investment,
        states: window.SITE_CONTENT.states,

        /**
         * Carga los paquetes publicados.
         * @returns {Promise<void>}
         */
        async init() {
            const service = new PackageService(createApiService());
            const response = await service.getPublishedPackages();

            this.applyPackages(response);

            this.loading = false;

            this.$nextTick(() => {
                pluginBridge.refreshWow();

                // The package blocks did not exist when the page loaded, so the
                // observer never saw them. Registering twice is a no-op.
                window.ompMotion.observe('.omp-packages');
            });
        },

        /**
         * Ordena los paquetes por DisplayOrder ascendente.
         * @param {Array<Object>} packages - Lista de PackageDto.
         * @returns {Array<Object>} Copia ordenada de la lista.
         * @remarks
         * El servicio de la API ya entrega el orden correcto; se reordena en
         * cliente porque el criterio de presentación es de esta página y no
         * debe depender de que el backend lo conserve. Ante empates se
         * desempata por nombre para que el orden sea estable entre recargas.
         */
        sortByDisplayOrder(packages) {
            return packages.slice().sort((first, second) => {
                const difference = (first.displayOrder || 0) - (second.displayOrder || 0);

                return difference !== 0 ? difference : first.name.localeCompare(second.name);
            });
        },

        /**
         * Applies the published packages, or the provisional set in their absence.
         * @param {Object} response - Normalized API response.
         * @returns {void}
         * @remarks
         * Two different absences share one outcome: a backend that is down and a
         * catalogue that is still empty. Neither is worth an empty page.
         *
         * No alertService here: a SweetAlert2 modal on page load would block the
         * navigation over an error the visitor cannot solve. The technical reason
         * always goes to the console and 429 is the one status shown on screen
         * —discreetly, because waiting a minute fixes it—, same criterion as
         * homePage and galleryPage.
         */
        applyPackages(response) {
            if (response.success && Array.isArray(response.data) && response.data.length) {
                this.packages = this.sortByDisplayOrder(response.data);

                return;
            }

            if (response.success) {
                console.warn('[investment] No published packages returned; showing the provisional set.');
            } else {
                console.error(
                    `[investment] Packages could not be loaded (status ${response.status}): ${response.error}`
                );

                if (response.status === 429) {
                    this.notice = response.error;
                }
            }

            const fallback = window.PLACEHOLDER_PACKAGES || [];

            // The flag follows the fallback and not the failure: without
            // placeholderPhotos.js there is nothing to render and the empty
            // state is what the page shows.
            this.packages = this.sortByDisplayOrder(fallback);
            this.usingPlaceholderPackages = fallback.length > 0;
        },

        /**
         * Conceptos incluidos en un paquete, uno por elemento.
         * @param {Object} package_ - PackageDto.
         * @returns {Array<string>} Renglones no vacíos de Includes.
         * @remarks
         * Includes es texto libre capturado en el panel: se admite \r\n y \n, y
         * se descartan los renglones en blanco que deja el editor al final.
         */
        includesList(package_) {
            return (package_.includes || '')
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0);
        },

                /**
         * Provisional photograph that accompanies a package block.
         * @param {number} index - Position of the package on the page.
         * @returns {Object|null} PhotoDto-shaped photograph, or null when there is none.
         * @remarks
         * PackageDto carries no photograph of its own, so the editorial block
         * borrows one from the provisional set, matched by position. This is the
         * only method to change the day the DTO exposes its own image, and
         * without placeholderPhotos.js it returns null: the block then renders
         * as a single column of text instead of reserving an empty frame.
         */
        packagePhoto(index) {
            const photos = window.PLACEHOLDER_PHOTOS || [];

            return photos.length ? photos[index % photos.length] : null;
        },

        /**
         * Smallest derivative of a photograph, used as the src fallback.
         * @param {Object} photo - PhotoDto returned by the API.
         * @returns {string} URL of the thumbnail.
         */
        thumb(photo) {
            return resolveMediaUrl(photo.thumbUrl);
        },

        /**
         * Full srcset of a photograph.
         * @param {Object} photo - PhotoDto returned by the API.
         * @returns {string} Value of the srcset attribute.
         */
        srcset(photo) {
            return buildPhotoSrcset(photo);
        },

        /**
         * Alternative text of a photograph.
         * @param {Object} photo - PhotoDto returned by the API.
         * @returns {string} Alternative text, or an empty string.
         */
        alt(photo) {
            return photoAltText(photo);
        },

        /**
         * Precio del paquete con su símbolo de moneda.
         * @param {Object} package_ - PackageDto.
         * @returns {string} Precio formateado, por ejemplo "MX$4,500".
         * @remarks
         * Los precios se capturan en cantidades cerradas: se permiten hasta dos
         * decimales, pero no se fuerzan. Un Currency inválido haría lanzar a
         * Intl, así que se degrada a "1500 MXN" antes que dejar la tarjeta vacía.
         */
        formatPrice(package_) {
            const currency = package_.currency || 'MXN';
            const amount = package_.price || 0;

            try {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }).format(amount);
            } catch (error) {
                console.warn(`[investment] Unsupported currency code "${currency}".`);

                return `${amount} ${currency}`;
            }
        },

        /**
         * Enlace a la página de reserva con el paquete preseleccionado.
         * @param {Object} package_ - PackageDto.
         * @returns {string} URL de booking.html, con el id salvo en el respaldo.
         * @remarks
         * Los paquetes provisionales no existen en la base de datos: su id
         * negativo llegaría a applyRequestedPackage() sin encontrar coincidencia
         * y el selector quedaría vacío tras haber anunciado lo contrario. El
         * enlace sigue llevando a la reserva, solo que sin preselección.
         */
        bookingHref(package_) {
            return this.usingPlaceholderPackages
                ? 'booking.html'
                : `booking.html?packageId=${encodeURIComponent(package_.id)}`;
        }
    }));
});