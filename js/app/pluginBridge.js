/**
 * Bridge between the content rendered by Alpine and Halen's jQuery plugins.
 *
 * main.js initializes the plugins on the initial DOM and does not index nodes
 * inserted later: any content that arrives from the API must be registered here,
 * inside a $nextTick, once the nodes exist.
 *
 * RULE based on what each plugin does with its nodes:
 *
 * - Owl Carousel clones them (with loop enabled) and removes them when destroyed.
 *   Its container carries x-ignore and is populated as plain HTML: if Alpine
 *   managed that subtree, the clones would lose the x-for scope and each binding
 *   would fail with "photo is not defined".
 * - Isotope only repositions nodes and Magnific Popup opens a separate overlay:
 *   neither breaks bindings, so x-for is safe there.
 */
(function ($) {
    'use strict';

    window.pluginBridge = {
        /**
         * Initializes Owl Carousel on a newly populated container.
         * @param {string} selector - Container selector.
         * @param {Object} options - Owl Carousel options.
         * @returns {void}
         */
        initCarousel: function (selector, options) {
            const $el = $(selector);

            if (!$el.length) {
                return;
            }

            // Destroying the previous instance allows reloading data without duplicating the DOM.
            if ($el.hasClass('owl-loaded')) {
                $el.trigger('destroy.owl.carousel');
                $el.removeClass('owl-loaded owl-hidden').find('.owl-stage-outer').children().unwrap();
            }

            $el.owlCarousel(options);
        },

        /**
         * Initializes or re-runs the Isotope layout after inserting elements.
         * @param {string} selector - Grid selector.
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

            // Without waiting for the images, the masonry calculates zero heights.
            $grid.imagesLoaded(function () {
                $grid.isotope('layout');
            });
        },

        /**
         * Applies an Isotope filter.
         * @param {string} selector - Grid selector.
         * @param {string} filterValue - Filter value (for example '.weddings' or '*').
         * @returns {void}
         */
        filterIsotope: function (selector, filterValue) {
            const $grid = $(selector);

            if ($grid.data('isotope')) {
                $grid.isotope({ filter: filterValue });
            }
        },

        /**
         * Registers the Magnific Popup lightbox on a dynamic container.
         * @param {string} containerSelector - Container present from the initial load.
         * @param {string} itemSelector - Image link selector.
         * @returns {void}
         * @remarks
         * 'delegate' is used because it is the only variant that continues to work
         * when Alpine replaces the child nodes.
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
         * Re-evaluates WOW.js animations on the new nodes.
         * @returns {void}
         */
        refreshWow: function () {
            if (window.WOW) {
                new window.WOW().init();
            }
        },

        /**
         * Resets Isotope after replacing the complete set of elements.
         * @param {string} selector - Grid selector.
         * @returns {void}
         * @remarks
         * 'reloadItems' reindexes while preserving the previous positions of the
         * original set: when switching albums, gaps remain where the old elements
         * used to be. Destroying and reinitializing is the only thing that recalculates
         * from scratch. It is used only when replacing the full set; for incremental
         * additions, refreshIsotope still applies.
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

            // Without waiting for the images, the masonry calculates zero heights.
            $grid.imagesLoaded(function () {
                $grid.isotope('layout');
            });
        },

                /**
         * Initializes nice-select on a combo populated by Alpine.
         * @param {string} selector - Select element selector.
         * @param {string} value - Value that should remain selected.
         * @param {Function} onChange - Callback with the selected value.
         * @returns {void}
         * @remarks
         * The plugin clones the options when initializing and writes the value with
         * jQuery's trigger('change'), which does not fire native listeners:
         * x-model would never know about the change, so the value is returned via
         * callback. It must be called inside a $nextTick, with the x-for options
         * already in the DOM.
         */
        initSelect: function (selector, value, onChange) {
            const $el = $(selector);

            if (!$el.length) {
                return;
            }

            // The value is set before cloning: nice-select reads the selected option
            // at that moment to render the visible label.
            $el.val(value === null || value === undefined ? '' : String(value));

            // 'update' rebuilds the clone when the list had already been rendered.
            if ($el.next('.nice-select').length) {
                $el.niceSelect('update');
            } else {
                $el.niceSelect();
            }

            if (typeof onChange === 'function') {
                $el.off('change.ompSelect').on('change.ompSelect', function () {
                    onChange($el.val());
                });
            }
        },

        /**
         * Initializes the gijgo datepicker on an input already rendered.
         * @param {string} selector - Input selector.
         * @param {Object} options - Datepicker options.
         * @param {Function} onChange - Callback with the chosen date.
         * @returns {void}
         * @remarks
         * gijgo wraps the input and notifies via triggerHandler('change'), which
         * also does not reach x-model: the input has no Alpine binding and the
         * value travels through the callback. The previous instance is destroyed to
         * avoid duplicating the wrapper if the field is mounted again.
         */
        initDatepicker: function (selector, options, onChange) {
            const $el = $(selector);

            if (!$el.length) {
                return;
            }

            if ($el.attr('data-datepicker') === 'true') {
                $el.datepicker('destroy');
            }

            $el.datepicker(options);

            if (typeof onChange === 'function') {
                $el.off('change.ompDatepicker').on('change.ompDatepicker', function () {
                    onChange($el.val());
                });
            }
        },

                /**
         * Clears the value of a gijgo datepicker.
         * @param {string} selector - Selector of the input.
         * @returns {void}
         * @remarks
         * The plugin exposes no clearing method: it re-reads the value of the
         * input itself when it opens, so emptying the input leaves the calendar
         * with no selection. It lives here and not in the page module to keep
         * every plugin-owned node behind the bridge, and it uses val() instead
         * of destroy() so the wrapper and the callback registered in
         * initDatepicker survive.
         */
        clearDatepicker: function (selector) {
            const $el = $(selector);

            if (!$el.length) {
                return;
            }

            $el.val('');
        },

        /**
         * Reads the real position of a carousel from an Owl event.
         * @param {Object} event - Owl Carousel event received by the 'onChanged' callback.
         * @returns {Object|null} Object with the zero-based index and the item count, or null when the event is not a position change.
         * @remarks
         * With loop enabled Owl clones the slides, so the index carried by the
         * event counts clones as well: relative() maps it back to the real
         * photograph. 'count' already excludes the clones, because Owl builds it
         * from its original item list. The callback also fires for other
         * properties, hence the guard.
         */
        carouselPosition: function (event) {
            if (!event || !event.namespace || !event.property || event.property.name !== 'position') {
                return null;
            }

            return {
                index: event.relatedTarget.relative(event.item.index),
                count: event.item.count
            };
        },

        /**
         * Moves a carousel one slide in the given direction.
         * @param {string} selector - Container selector.
         * @param {string} direction - Either 'prev' or 'next'.
         * @returns {void}
         * @remarks
         * The hero renders its own arrows outside the carousel, so Owl's own
         * navigation is off and the movement is requested through its events.
         */
        navigateCarousel: function (selector, direction) {
            const $el = $(selector);

            if (!$el.length) {
                return;
            }

            $el.trigger(direction === 'prev' ? 'prev.owl.carousel' : 'next.owl.carousel');
        },
    };
})(jQuery);
