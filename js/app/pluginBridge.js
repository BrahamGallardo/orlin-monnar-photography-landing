/**
 * Puente entre el contenido que renderiza Alpine y los plugins jQuery de Halen.
 *
 * main.js inicializa los plugins sobre el DOM inicial y no indexa nodos
 * insertados después: todo contenido que llegue por API debe registrarse aquí,
 * dentro de un $nextTick, una vez que los nodos existen.
 *
 * REGLA según lo que hace cada plugin con sus nodos:
 *
 * - Owl Carousel los CLONA (con loop activo) y los elimina al destruirse. Su
 *   contenedor lleva x-ignore y se puebla como HTML plano: si Alpine gestionara
 *   ese subárbol, los clones perderían el scope de x-for y cada binding
 *   fallaría con "photo is not defined".
 * - Isotope solo los reposiciona y Magnific Popup abre un overlay aparte:
 *   ninguno rompe los bindings, así que ahí x-for es seguro.
 */
(function ($) {
    'use strict';

    window.pluginBridge = {
        /**
         * Inicializa Owl Carousel sobre un contenedor recién poblado.
         * @param {string} selector - Selector del contenedor.
         * @param {Object} options - Opciones de Owl Carousel.
         * @returns {void}
         */
        initCarousel: function (selector, options) {
            const $el = $(selector);

            if (!$el.length) {
                return;
            }

            // Destruir la instancia previa permite recargar datos sin duplicar el DOM.
            if ($el.hasClass('owl-loaded')) {
                $el.trigger('destroy.owl.carousel');
                $el.removeClass('owl-loaded owl-hidden').find('.owl-stage-outer').children().unwrap();
            }

            $el.owlCarousel(options);
        },

        /**
         * Inicializa o re-lanza el layout de Isotope tras insertar elementos.
         * @param {string} selector - Selector de la grilla.
         * @returns {void}
         */
        refreshIsotope: function (selector) {
            const $grid = $(selector);

            if (!$grid.length) {
                return;
            }

            if (!$grid.data('isotope')) {
                $grid.isotope({
                    itemSelector: '.grid-item',
                    percentPosition: true,
                    masonry: { columnWidth: 1 }
                });
            } else {
                $grid.isotope('reloadItems');
            }

            // Sin esperar a las imágenes, el masonry calcula las alturas en cero.
            $grid.imagesLoaded(function () {
                $grid.isotope('layout');
            });
        },

        /**
         * Aplica un filtro de Isotope.
         * @param {string} selector - Selector de la grilla.
         * @param {string} filterValue - Valor del filtro (por ejemplo '.bodas' o '*').
         * @returns {void}
         */
        filterIsotope: function (selector, filterValue) {
            const $grid = $(selector);

            if ($grid.data('isotope')) {
                $grid.isotope({ filter: filterValue });
            }
        },

        /**
         * Registra el lightbox de Magnific Popup sobre un contenedor dinámico.
         * @param {string} containerSelector - Contenedor presente desde la carga inicial.
         * @param {string} itemSelector - Selector de los enlaces de imagen.
         * @returns {void}
         * @remarks
         * Se usa 'delegate' porque es la única variante que sigue funcionando
         * cuando Alpine reemplaza los nodos hijos.
         */
        initLightbox: function (containerSelector, itemSelector) {
            const $container = $(containerSelector);

            if (!$container.length) {
                return;
            }

            $container.magnificPopup({
                delegate: itemSelector || 'a.popup-image',
                type: 'image',
                gallery: { enabled: true },
                image: { titleSrc: 'data-title' }
            });
        },

        /**
         * Re-evalúa las animaciones de WOW.js sobre los nodos nuevos.
         * @returns {void}
         */
        refreshWow: function () {
            if (window.WOW) {
                new window.WOW().init();
            }
        },

        /**
         * Reinicia Isotope tras sustituir el conjunto completo de elementos.
         * @param {string} selector - Selector de la grilla.
         * @returns {void}
         * @remarks
         * 'reloadItems' reindexa conservando las posiciones del conjunto
         * anterior: al cambiar de álbum quedan huecos de los elementos que ya
         * no existen. Destruir e inicializar es lo único que recalcula desde
         * cero. Se usa solo al reemplazar el conjunto entero; para añadidos
         * incrementales sigue sirviendo refreshIsotope.
         */
        resetIsotope: function (selector) {
            const $grid = $(selector);

            if (!$grid.length) {
                return;
            }

            if ($grid.data('isotope')) {
                $grid.isotope('destroy');
            }

            $grid.isotope({
                itemSelector: '.grid-item',
                percentPosition: true,
                masonry: { columnWidth: 1 }
            });

            // Sin esperar a las imágenes, el masonry calcula las alturas en cero.
            $grid.imagesLoaded(function () {
                $grid.isotope('layout');
            });
        },
    };
})(jQuery);
