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

        // Fade of the grid while one album is replaced by another. It is not
        // the loading flag: on the first load there is nothing to fade out.
        swapping: false,

        content: window.SITE_CONTENT.gallery,
        states: window.SITE_CONTENT.states,

        service: null,

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
            this.swapping = this.photos.length > 0;
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

            this.finish();
        },

        /**
         * Leaves the page in its "album not found" state.
         * @returns {void}
         */
        finishNotFound() {
            this.category = null;
            this.photos = [];
            this.notFound = true;

            this.finish();
        },

        /**
         * Closes a load: paints the mosaic and brings the grid back.
         * @returns {void}
         */
        finish() {
            this.loading = false;

            this.$nextTick(() => {
                this.layout();
                this.swapping = false;
            });
        },

        /**
         * Lays the mosaic out and hands the new photographs to the observer.
         * @returns {void}
         * @remarks
         * Switching album replaces the whole set, so Isotope is destroyed and
         * built again: reloadItems keeps the positions of the previous set and
         * leaves holes where the old photographs used to be.
         */
        layout() {
            pluginBridge.resetIsotope('#album-grid');
            window.ompMotion.observe('#album-grid');
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
         * Album description shown under the name.
         * @returns {string} Description written in the admin panel, or empty.
         */
        get description() {
            if (this.loading || this.notFound || !this.category) {
                return '';
            }

            return this.category.description || '';
        },

        /**
         * Photograph count of the album, in words.
         * @returns {string} Label shown as a discreet piece of data.
         */
        get countLabel() {
            if (this.loading || this.notFound || !this.photos.length) {
                return '';
            }

            const count = this.photos.length;
            const noun = count === 1 ? this.content.photoCountOne : this.content.photoCountMany;

            return `${count} ${noun}`;
        },

        /**
         * Inline style that reserves the real box of a photograph.
         * @param {Object} photo - PhotoDto.
         * @returns {string} Inline style with the aspect ratio of the frame.
         */
        frameStyle(photo) {
            return `aspect-ratio: ${photoAspectRatio(photo)}`;
        },

        /**
         * URL of the thumb derivative, used in the mosaic.
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
         * Srcset of a thumbnail: thumb and medium, never the 2560 px one.
         * @param {Object} photo - PhotoDto.
         * @returns {string} srcset attribute value.
         */
        srcset(photo) {
            return buildGridSrcset(photo);
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
