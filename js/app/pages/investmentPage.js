/**
 * Módulo Alpine de la página Investment.
 *
 * Lee GET /api/packages, que ya devuelve solo los paquetes publicados. El
 * endpoint es una lista plana: una sola petición pinta toda la sección y no
 * hay motivo para consultar cada paquete por separado (el rate limit público
 * es de 60 req/min).
 *
 * A diferencia de la galería, aquí NO hay contenido provisional de respaldo:
 * inventar precios sería peor que no mostrar nada, así que un fallo de la API
 * se reporta como estado de error y la página no se rompe.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('investmentPage', () => ({
        loading: true,
        packages: [],
        notice: '',

        content: window.SITE_CONTENT.investment,
        states: window.SITE_CONTENT.states,

        /**
         * Carga los paquetes publicados.
         * @returns {Promise<void>}
         */
        async init() {
            const service = new PackageService(createApiService());
            const response = await service.getPublishedPackages();

            if (response.success && Array.isArray(response.data)) {
                this.packages = this.sortByDisplayOrder(response.data);
            } else {
                this.reportFailure(response);
            }

            this.loading = false;

            this.$nextTick(() => {
                pluginBridge.refreshWow();
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
         * Reporta un fallo de carga sin romper la página.
         * @param {Object} response - Respuesta normalizada de la API.
         * @returns {void}
         * @remarks
         * No se usa alertService: un modal de SweetAlert2 al abrir la página
         * bloquearía la navegación por un error que el visitante no puede
         * resolver. El motivo técnico siempre va a la consola; en pantalla se
         * muestra el mensaje ya redactado por ApiService.
         */
        reportFailure(response) {
            console.error(
                `[investment] Packages could not be loaded (status ${response.status}): ${response.error}`
            );

            this.notice = response.error || this.content.loadError;
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
         * @returns {string} URL de booking.html con el id en la query string.
         */
        bookingHref(package_) {
            return `booking.html?packageId=${encodeURIComponent(package_.id)}`;
        }
    }));
});