/**
 * Alpine module for the Home page.
 *
 * Two independent endpoints feed the page: the featured photographs, split
 * between the hero carousel and the featured grid, and the published
 * categories, which drive the full-bleed blocks.
 *
 * The provisional set only covers an unreachable API. A successful but empty
 * response is a published state and is rendered as such: the landing says it
 * has nothing to show rather than showing photographs that do not exist.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('homePage', () => ({
        loading: true,
        photos: [],

        // Categories feeding the full-bleed blocks. They travel with their own
        // loading flag: the two requests resolve together, but the sections are
        // independent and one must not gate the other.
        categoriesLoading: true,
        categories: [],
        categoriesNotice: '',

        // While the fallback is in use the blocks are not navigable: the detail
        // page has no fallback, so every link would land on "album not found".
        usingPlaceholderCategories: false,

        content: window.SITE_CONTENT.home,
        // The photograph count reuses the wording of the album index instead of
        // duplicating it under home.
        gallery: window.SITE_CONTENT.gallery,
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
         * Loads the featured photographs and the categories, then wires up the
         * jQuery plugins.
         * @returns {Promise<void>}
         */
        async init() {
            const service = new GalleryService(createApiService());

            // Two independent endpoints: awaited in sequence they would add up
            // their latencies and leave the second section spinning for no
            // reason. Both are already inside the 60 req/min budget.
            const [featured, categories] = await Promise.all([
                service.getFeaturedPhotos(9),
                service.getCategories()
            ]);

            this.applyFeaturedPhotos(featured);
            this.applyCategories(categories);

            this.loading = false;
            this.categoriesLoading = false;
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

                // The category blocks did not exist when the page loaded, so the
                // observer never saw them. Registering twice is a no-op.
                window.ompMotion.observe('.omp-categories');
            });
        },

        /**
         * Applies the featured photographs, or the provisional set on failure.
         * @param {Object} response - Normalized API response.
         * @returns {void}
         * @remarks
         * The provisional set covers an unreachable API and nothing else. Once
         * the backend has answered, what it says is what the page shows: an
         * empty gallery renders the empty state instead of photographs that are
         * not published. Without a hero photograph the local poster stays on
         * screen, which is already the state that case needs.
         */
        applyFeaturedPhotos(response) {
            if (response.success) {
                this.photos = response.data || [];

                if (!this.photos.length) {
                    console.warn('[home] No featured photographs returned; the featured section stays empty.');
                }

                return;
            }

            console.error(
                `[home] Featured photographs could not be loaded (status ${response.status}): ${response.error}`
            );

            this.photos = window.PLACEHOLDER_PHOTOS;
        },

        /**
         * Applies the published categories, or the provisional albums on failure.
         * @param {Object} response - Normalized API response.
         * @returns {void}
         * @remarks
         * A backend that is down must not look like real content: the reason is
         * always written to the console. 429 is the one case shown on screen,
         * and discreetly, because the visitor can just wait a minute. Same
         * criterion as galleryPage.
         */
        applyCategories(response) {
            if (response.success) {
                this.categories = response.data || [];

                if (!this.categories.length) {
                    console.warn('[home] No published categories returned; showing the empty state.');
                }

                return;
            }

            console.error(
                `[home] Categories could not be loaded (status ${response.status}): ${response.error}`
            );

            if (response.status === 429) {
                this.categoriesNotice = response.error;
            }

            this.categories = window.PLACEHOLDER_CATEGORIES;
            this.usingPlaceholderCategories = true;
        },

        /**
         * Link to the album detail, or null while the fallback is in use.
         * @param {Object} category - GalleryCategoryDto.
         * @returns {string|null} URL, or null to render the block without a link.
         * @remarks
         * The query parameter is 'c', which is what galleryDetailPage reads.
         */
        albumHref(category) {
            return this.usingPlaceholderCategories
                ? null
                : `gallery-detail.html?c=${encodeURIComponent(category.slug)}`;
        },

        /**
         * Photograph count of an album, in words.
         * @param {Object} category - GalleryCategoryDto.
         * @returns {string} Label shown next to the album name.
         */
        photoCountLabel(category) {
            const count = category.photoCount || 0;
            const noun = count === 1 ? this.gallery.photoCountOne : this.gallery.photoCountMany;

            return `${count} ${noun}`;
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
