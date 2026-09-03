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
        business: window.SITE_CONTENT.business,

        // Position inside the hero carousel, shown as "1 / 5".
        heroIndex: 0,
        heroCount: 0,

        // Turns true once the first hero photograph has actually loaded: until
        // then the local fallback stays on screen.
        heroReady: false,

        /**
         * Photographs shown in the hero carousel.
         * @returns {Array<Object>} First five featured photographs.
         */
        get heroPhotos() {
            return this.photos.slice(0, 5);
        },

        /**
         * Photographs shown in the Instagram strip.
         * @returns {Array<Object>} Last six featured photographs.
         */
        get instagramPhotos() {
            return this.photos.slice(-6);
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
            this.heroCount = this.heroPhotos.length;

            // The hero photograph is the LCP element. The preload is queued as
            // soon as the payload arrives, one tick before the markup exists.
            this.preloadHeroPhoto();

            // The x-for nodes do not exist yet: Owl Carousel and Magnific Popup
            // can only index them after Alpine has rendered.
            this.$nextTick(() => {
                this.renderHeroSlides();

                pluginBridge.initCarousel('.slider_active', {
                    loop: true,
                    margin: 0,
                    items: 1,
                    autoplay: true,
                    autoplayTimeout: 6000,
                    autoplayHoverPause: true,
                    // The stage translation is neutralised in CSS: photographs
                    // cross-fade instead of sliding. The internal speed only has
                    // to be short enough for the 'active' class to reach the next
                    // slide, which is what triggers the fade.
                    smartSpeed: 1,
                    // Dragging shows no movement under a fade, and the arrows and
                    // the counter live outside the carousel: both plugins stay off.
                    mouseDrag: false,
                    nav: false,
                    dots: false,
                    onChanged: (event) => {
                        const position = pluginBridge.carouselPosition(event);

                        if (position) {
                            this.heroIndex = position.index;
                            this.heroCount = position.count;
                        }
                    }
                });

                // The clones only exist once the carousel is initialised, so the
                // remaining photographs are hydrated from here and never from
                // renderHeroSlides().
                this.watchHeroPhoto();

                pluginBridge.initLightbox('#featured-grid', 'a.popup-image');
                pluginBridge.refreshWow();
            });
        },

        /**
         * Renders the hero slides.
         *
         * Owl Carousel clones the slides when loop is enabled and removes them
         * on destroy. If Alpine owned these nodes, the clones would lose the
         * x-for scope and every binding would fail with "photo is not defined".
         *
         * The nodes are built with the DOM API instead of a template string
         * because the alt text is written from the admin panel and now travels
         * inside an attribute, where escapeHtml() is not enough: it escapes the
         * angle brackets but not the quotes.
         * @returns {void}
         */
        renderHeroSlides() {
            const container = document.querySelector('.slider_active');

            if (!container) {
                return;
            }

            container.innerHTML = '';

            this.heroPhotos.forEach((photo, index) => {
                container.appendChild(this.buildHeroSlide(photo, index === 0));
            });
        },

        /**
         * Builds a single hero slide.
         * @param {Object} photo - PhotoDto.
         * @param {boolean} isLead - Whether this is the first photograph on screen.
         * @returns {HTMLElement} Slide element ready to be appended.
         * @remarks
         * Every slide covers the whole hero, so they all sit inside the viewport
         * and loading="lazy" would defer nothing: the browser would fetch the
         * five photographs at once and delay the first paint. Only the leading
         * one carries real URLs; the rest keep theirs in data attributes until
         * hydrateHeroPhotos() runs.
         */
        buildHeroSlide(photo, isLead) {
            const slide = document.createElement('div');
            const image = document.createElement('img');

            slide.className = 'omp-hero__slide';

            image.className = 'omp-hero__img';
            image.alt = this.alt(photo);
            image.decoding = 'async';
            // The photograph is always as wide as the viewport.
            image.sizes = '100vw';

            // The intrinsic size is what the browser turns into an aspect ratio,
            // so the slot keeps its shape from the very first frame.
            if (photo.width && photo.height) {
                image.width = photo.width;
                image.height = photo.height;
            }

            if (isLead) {
                image.src = resolveMediaUrl(photo.mediumUrl);
                image.srcset = this.srcset(photo);
                image.loading = 'eager';
                image.setAttribute('fetchpriority', 'high');
                image.setAttribute('data-omp-hero-lead', 'true');
            } else {
                image.setAttribute('data-omp-src', resolveMediaUrl(photo.mediumUrl));
                image.setAttribute('data-omp-srcset', this.srcset(photo));
            }

            slide.appendChild(image);

            return slide;
        },

        /**
         * Queues the preload of the first hero photograph.
         * @returns {void}
         * @remarks
         * The link is injected as soon as the API answers, ahead of the Alpine
         * render and of the Owl initialisation, so the download starts while the
         * carousel is still being assembled. imagesrcset lets the browser pick
         * the same derivative the <img> will end up requesting, instead of
         * downloading a second one.
         */
        preloadHeroPhoto() {
            const photo = this.heroPhotos[0];

            if (!photo) {
                return;
            }

            const link = document.createElement('link');

            link.rel = 'preload';
            link.as = 'image';
            link.href = resolveMediaUrl(photo.mediumUrl);
            link.setAttribute('imagesrcset', this.srcset(photo));
            link.setAttribute('imagesizes', '100vw');
            link.setAttribute('fetchpriority', 'high');

            document.head.appendChild(link);
        },

        /**
         * Waits for the leading hero photograph to settle.
         * @returns {void}
         */
        watchHeroPhoto() {
            const lead = document.querySelector('.slider_active [data-omp-hero-lead]');

            if (!lead) {
                return;
            }

            if (lead.complete) {
                this.onHeroPhotoSettled(lead.naturalWidth > 0);

                return;
            }

            lead.addEventListener('load', () => this.onHeroPhotoSettled(true), { once: true });
            lead.addEventListener('error', () => this.onHeroPhotoSettled(false), { once: true });
        },

        /**
         * Reacts to the outcome of the leading hero photograph.
         * @param {boolean} loaded - Whether the photograph was decoded.
         * @returns {void}
         * @remarks
         * The local fallback only steps aside when there is a photograph behind
         * it: on error it stays, which is exactly the state the hero needs.
         */
        onHeroPhotoSettled(loaded) {
            this.heroReady = loaded;
            this.hydrateHeroPhotos();
        },

        /**
         * Gives the remaining hero photographs their real URLs.
         * @returns {void}
         * @remarks
         * It runs after the carousel is initialised on purpose: Owl has already
         * cloned the slides by then, and the clones carry the same data
         * attributes, so a single query covers originals and copies alike.
         */
        hydrateHeroPhotos() {
            const images = document.querySelectorAll('.slider_active [data-omp-srcset]');

            Array.prototype.forEach.call(images, (image) => {
                image.srcset = image.getAttribute('data-omp-srcset');
                image.src = image.getAttribute('data-omp-src');
                image.removeAttribute('data-omp-srcset');
                image.removeAttribute('data-omp-src');
            });
        },

        /**
         * Moves the hero carousel to the previous photograph.
         * @returns {void}
         */
        heroPrev() {
            pluginBridge.navigateCarousel('.slider_active', 'prev');
        },

        /**
         * Moves the hero carousel to the next photograph.
         * @returns {void}
         */
        heroNext() {
            pluginBridge.navigateCarousel('.slider_active', 'next');
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
