/**
 * Alpine module for the Home page.
 *
 * Loads the featured photographs from the API and splits them between the hero
 * carousel and the featured work grid. If the API is unreachable or no photos
 * have been published yet, it falls back to the provisional images so the
 * landing is never rendered empty.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('homePage', () => ({
        loading: true,
        photos: [],
        content: window.SITE_CONTENT.home,
        states: window.SITE_CONTENT.states,

        // Screens wider than this justify loading the large derivative.
        largeHeroBreakpoint: 1600,

        /**
         * Photographs shown in the hero carousel.
         * @returns {Array<Object>} First five featured photographs.
         */
        get heroPhotos() {
            return this.photos.slice(0, 5);
        },

        /**
         * Loads the featured photographs and wires up the jQuery plugins.
         * @returns {Promise<void>}
         */
        async init() {
            const service = new GalleryService(createApiService());
            const response = await service.getFeaturedPhotos(9);

            // A public landing cannot be left without images: on error or on an
            // empty gallery we fall back to the provisional set.
            this.photos = (response.success && response.data && response.data.length)
                ? response.data
                : window.PLACEHOLDER_PHOTOS;

            this.loading = false;

            // The x-for nodes do not exist yet: Owl Carousel and Magnific Popup
            // can only index them after Alpine has rendered.
            this.$nextTick(() => {
                this.renderHeroSlides();

                pluginBridge.initCarousel('.slider_active', {
                    loop: true,
                    margin: 0,
                    items: 1,
                    autoplay: true,
                    autoplayHoverPause: true,
                    autoplaySpeed: 800,
                    navText: ['<i class="ti-angle-left"></i>', '<i class="ti-angle-right"></i>'],
                    nav: false,
                    dots: false,
                    responsive: {
                        0: { items: 1, nav: false },
                        1600: { items: 1, nav: true }
                    }
                });

                pluginBridge.initLightbox('#featured-grid', 'a.popup-image');
                pluginBridge.refreshWow();
            });
        },

        /**
         * Renders the hero slides as plain HTML.
         *
         * Owl Carousel clones the slides when loop is enabled and removes them
         * on destroy. If Alpine owned these nodes, the clones would lose the
         * x-for scope and every binding would fail with "photo is not defined".
         * @returns {void}
         */
        renderHeroSlides() {
            const container = document.querySelector('.slider_active');

            if (!container) {
                return;
            }

            container.innerHTML = this.heroPhotos.map(photo => `
                <div class="single_slider d-flex align-items-center black_overlay"
                     style="background-image: url('${this.heroImage(photo)}')">
                    <div class="container">
                        <div class="row align-items-center">
                            <div class="col-xl-12 col-md-12">
                                <div class="slider_text text-center">
                                    <h3>${escapeHtml(this.content.heroTitle)}</h3>
                                    <p class="slider_subtitle">${escapeHtml(this.content.heroSubtitle)}</p>
                                    <div class="video_service_btn">
                                        <a href="gallery.html" class="boxed-btn3">View Gallery</a>
                                        <a href="booking.html" class="boxed-btn3">Book a Session</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`).join('');
        },

        /**
         * Picks the hero background derivative for the current screen width.
         * @param {Object} photo - PhotoDto.
         * @returns {string} Derivative URL.
         */
        heroImage(photo) {
            return window.innerWidth >= this.largeHeroBreakpoint
                ? resolveMediaUrl(photo.largeUrl)
                : resolveMediaUrl(photo.mediumUrl);
        },

        /**
         * URL of the thumb derivative.
         * @param {Object} photo - PhotoDto.
         * @returns {string} Derivative URL.
         */
        thumb(photo) {
            return resolveMediaUrl(photo.thumbUrl);
        },

        /**
         * URL of the large derivative, used by the lightbox.
         * @param {Object} photo - PhotoDto.
         * @returns {string} Derivative URL.
         */
        large(photo) {
            return resolveMediaUrl(photo.largeUrl);
        },

        /**
         * Srcset with the three derivatives.
         * @param {Object} photo - PhotoDto.
         * @returns {string} srcset attribute value.
         */
        srcset(photo) {
            return buildPhotoSrcset(photo);
        },

        /**
         * Alternative text of the photograph.
         * @param {Object} photo - PhotoDto.
         * @returns {string} Alternative text.
         */
        alt(photo) {
            return photoAltText(photo);
        }
    }));
});
