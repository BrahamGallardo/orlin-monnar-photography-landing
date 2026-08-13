/**
 * Alpine module for the album index.
 *
 * Reads GET /api/gallery/categories, which already carries coverPhoto and
 * photoCount: one request paints the whole grid. Requesting each category to
 * derive its cover would burn the 60 req/min rate limit for nothing.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('galleryPage', () => ({
        loading: true,
        categories: [],
        notice: '',

        // While the fallback is in use the cards are not navigable: the detail
        // page has no fallback, so every link would land on "album not found".
        usingPlaceholders: false,

        content: window.SITE_CONTENT.gallery,
        states: window.SITE_CONTENT.states,

        /**
         * Loads the published categories.
         * @returns {Promise<void>}
         */
        async init() {
            const service = new GalleryService(createApiService());
            const response = await service.getCategories();

            if (response.success && response.data && response.data.length) {
                this.categories = response.data;
            } else {
                this.applyFallback(response);
            }

            this.loading = false;

            this.$nextTick(() => {
                pluginBridge.refreshWow();
            });
        },

        /**
         * Falls back to the provisional albums and reports why.
         * @param {Object} response - Normalized API response.
         * @returns {void}
         * @remarks
         * A backend that is down must not look like real content: the reason is
         * always written to the console. 429 is the one case shown on screen,
         * and discreetly, because the visitor can just wait a minute.
         */
        applyFallback(response) {
            if (response.success) {
                console.warn('[gallery] No published categories returned; showing provisional albums.');
            } else {
                console.error(
                    `[gallery] Categories could not be loaded (status ${response.status}): ${response.error}`
                );
            }

            if (response.status === 429) {
                this.notice = response.error;
            }

            this.categories = window.PLACEHOLDER_CATEGORIES;
            this.usingPlaceholders = true;
        },

        /**
         * Link to the album detail, or null while the fallback is in use.
         * @param {Object} category - GalleryCategoryDto.
         * @returns {string|null} URL, or null to render the card without a link.
         */
        albumHref(category) {
            return this.usingPlaceholders
                ? null
                : `gallery-detail.html?c=${encodeURIComponent(category.slug)}`;
        },

        /**
         * Photograph count of an album, in words.
         * @param {Object} category - GalleryCategoryDto.
         * @returns {string} Label shown under the album name.
         */
        photoCountLabel(category) {
            const count = category.photoCount || 0;
            const noun = count === 1 ? this.content.photoCountOne : this.content.photoCountMany;

            return `${count} ${noun}`;
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
         * Srcset for a cover: thumb as the base and medium as the denser
         * descriptor. The 2560 px large is never worth loading in this grid.
         * @param {Object} photo - PhotoDto.
         * @returns {string} srcset attribute value.
         */
        coverSrcset(photo) {
            return [
                `${resolveMediaUrl(photo.thumbUrl)} 500w`,
                `${resolveMediaUrl(photo.mediumUrl)} 1200w`
            ].join(', ');
        },

        /**
         * Alternative text of the cover.
         * @param {Object} photo - PhotoDto.
         * @returns {string} Alternative text.
         */
        alt(photo) {
            return photoAltText(photo);
        }
    }));
});