/**
 * Alpine module for the album detail.
 *
 * Two requests on load: the category list feeds the album menu, and the slug
 * route feeds the mosaic. Switching albums replaces the whole set of items, so
 * Isotope has to be reset, not reloaded.
 *
 * There is no fallback here on purpose: an album that does not exist says so.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('galleryDetailPage', () => ({
        loading: true,
        notFound: false,
        notice: '',
        slug: '',
        category: null,
        categories: [],
        photos: [],

        content: window.SITE_CONTENT.gallery,
        states: window.SITE_CONTENT.states,

        service: null,

        // Ratio thresholds that map a photograph onto the three widths the
        // template defines (39.5% / 35.7% / 24.8%).
        landscapeRatio: 1.3,
        portraitRatio: 0.85,

        /**
         * Loads the album menu and the requested album.
         * @returns {Promise<void>}
         */
        async init() {
            this.service = new GalleryService(createApiService());

            await this.loadMenu();

            // Without ?c= we open the first published album rather than showing
            // a "not found" for a URL the visitor did not type.
            const requested = this.slugFromUrl()
                || (this.categories.length ? this.categories[0].slug : '');

            await this.loadAlbum(requested);

            // Registered once: the container exists from the initial load, so
            // the delegate survives every replacement of its children.
            pluginBridge.initLightbox('#album-grid', 'a.popup-image');

            window.addEventListener('popstate', () => {
                this.loadAlbum(this.slugFromUrl());
            });
        },

        /**
         * Reads the requested slug from the query string.
         * @returns {string} Slug, or an empty string if absent.
         */
        slugFromUrl() {
            return new URLSearchParams(window.location.search).get('c') || '';
        },

        /**
         * Loads the album menu.
         * @returns {Promise<void>}
         */
        async loadMenu() {
            const response = await this.service.getCategories();

            if (response.success && response.data) {
                this.categories = response.data;

                return;
            }

            // The menu is secondary: it is logged, but the album still loads.
            console.error(
                `[gallery] The album menu could not be loaded (status ${response.status}): ${response.error}`
            );
        },

        /**
         * Loads an album by slug.
         * @param {string} slug - Album slug.
         * @returns {Promise<void>}
         */
        async loadAlbum(slug) {
            this.loading = true;
            this.notFound = false;
            this.notice = '';
            this.slug = slug;

            if (!slug) {
                this.finishNotFound();

                return;
            }

            const response = await this.service.getCategoryBySlug(slug);

            if (!response.success) {
                if (response.status === 429) {
                    this.notice = response.error;
                } else if (response.status !== 404) {
                    console.error(
                        `[gallery] Album "${slug}" could not be loaded (status ${response.status}): ${response.error}`
                    );
                }

                this.finishNotFound();

                return;
            }

            this.category = response.data;

            // Already filtered by active and ordered by displayOrder in SQL:
            // filtering or sorting again here would only risk diverging from it.
            this.photos = response.data.photos || [];
            this.loading = false;

            this.$nextTick(() => {
                pluginBridge.resetIsotope('#album-grid');
            });
        },

        /**
         * Leaves the page in its "album not found" state.
         * @returns {void}
         */
        finishNotFound() {
            this.category = null;
            this.photos = [];
            this.notFound = true;
            this.loading = false;

            this.$nextTick(() => {
                pluginBridge.resetIsotope('#album-grid');
            });
        },

        /**
         * Switches album without reloading the page.
         * @param {string} slug - Slug of the album to open.
         * @returns {void}
         */
        select(slug) {
            if (slug === this.slug) {
                return;
            }

            // pushState throws a SecurityError when the page is opened over
            // file://; the album still has to load, so the URL is best effort.
            try {
                window.history.pushState({ slug: slug }, '', `gallery-detail.html?c=${encodeURIComponent(slug)}`);
            } catch (error) {
                console.warn('[gallery] The URL could not be updated:', error.message);
            }

            this.loadAlbum(slug);
        },

        /**
         * Album title shown in the header.
         * @returns {string} Album name, or the not found title.
         */
        get title() {
            if (this.loading) {
                return this.content.title;
            }

            return this.notFound ? this.content.notFoundTitle : this.category.name;
        },

        /**
         * Album subtitle shown in the header.
         * @returns {string} Description, photograph count, or the not found text.
         */
        get subtitle() {
            if (this.loading) {
                return '';
            }

            if (this.notFound) {
                return this.content.notFoundText;
            }

            if (this.category.description) {
                return this.category.description;
            }

            const count = this.photos.length;
            const noun = count === 1 ? this.content.photoCountOne : this.content.photoCountMany;

            return `${count} ${noun}`;
        },

        /**
         * Header background, taken from the album cover.
         * @returns {string} Inline style, empty while there is no cover.
         */
        bradcamStyle() {
            const cover = this.category && this.category.coverPhoto;

            return cover ? `background-image: url('${resolveMediaUrl(cover.largeUrl)}')` : '';
        },

        /**
         * Width class of a photograph inside the mosaic.
         * @param {Object} photo - PhotoDto.
         * @returns {string} 'large_img', 'mid_img' or 'small_img'.
         * @remarks
         * The template repeats a fixed pattern regardless of the photograph.
         * Deriving it from the real aspect ratio keeps landscapes wide and
         * portraits narrow, so object-fit crops as little as possible. Without
         * dimensions the middle width is the safest guess.
         */
        sizeClass(photo) {
            if (!photo.width || !photo.height) {
                return 'mid_img';
            }

            const ratio = photo.width / photo.height;

            if (ratio >= this.landscapeRatio) {
                return 'large_img';
            }

            return ratio <= this.portraitRatio ? 'small_img' : 'mid_img';
        },

        /**
         * URL of the medium derivative, used in the mosaic.
         * @param {Object} photo - PhotoDto.
         * @returns {string} Derivative URL.
         */
        medium(photo) {
            return resolveMediaUrl(photo.mediumUrl);
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