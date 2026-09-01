/**
 * Alpine module for the Booking page.
 *
 * Owns the appointment form: it loads the published packages for the selector,
 * pre-selects the one carried in the query string and validates every field
 * against the same rules as CreateAppointmentRequestDto. Sending the request
 * is not implemented yet (see the TODO inside submit()).
 *
 * The package combo and the date input are plugin-owned nodes: nice-select and
 * gijgo write their value through jQuery events that x-model never hears, so
 * both are registered through pluginBridge and report back by callback.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('bookingPage', () => ({
        content: window.SITE_CONTENT.booking,
        states: window.SITE_CONTENT.states,
        messages: window.SITE_CONTENT.messages,

        loading: true,
        sending: false,
        notice: '',

        packages: [],

        // One message per field, keyed by the property name of form.
        errors: {},

        form: {
            packageId: '',
            appointmentDate: '',
            fullName: '',
            email: '',
            phone: '',
            location: '',
            notes: ''
        },

        /**
         * Loads the packages and hands the plugin-owned fields to pluginBridge.
         * @returns {Promise<void>}
         * @remarks
         * Alpine 3 runs init() on its own: the element only carries x-data, and
         * adding x-init="init()" would load the packages twice.
         */
        async init() {
            await this.loadPackages();

            this.loading = false;

            // Both plugins index the nodes they find at that moment: they can
            // only run once x-for has rendered the options and x-show has
            // revealed the form.
            this.$nextTick(() => {
                pluginBridge.initSelect('#packageId', this.form.packageId, value => {
                    this.form.packageId = value;
                    this.validateField('packageId');
                });

                pluginBridge.initDatepicker('#appointmentDate', this.datepickerOptions(), value => {
                    this.form.appointmentDate = value;
                    this.validateField('appointmentDate');
                });
            });
        },

        /**
         * Reads the published packages that feed the selector.
         * @returns {Promise<void>}
         */
        async loadPackages() {
            const service = new PackageService(createApiService());
            const response = await service.getPublishedPackages();

            if (!response.success || !Array.isArray(response.data)) {
                this.reportFailure(response);
                return;
            }

            this.packages = this.sortByDisplayOrder(response.data);
            this.preselectPackage();
        },

        /**
         * Orders the packages by DisplayOrder ascending.
         * @param {Array<Object>} packages - List of PackageDto.
         * @returns {Array<Object>} Sorted copy of the list.
         * @remarks
         * Same criterion as the Investment page, so the visitor finds the
         * options in the order he just saw there. Ties break by name to keep
         * the order stable between reloads.
         */
        sortByDisplayOrder(packages) {
            return packages.slice().sort((first, second) => {
                const difference = (first.displayOrder || 0) - (second.displayOrder || 0);

                return difference !== 0 ? difference : first.name.localeCompare(second.name);
            });
        },

        /**
         * Pre-selects the package carried in ?packageId=.
         * @returns {void}
         * @remarks
         * An id that is no longer published leaves the selector on its empty
         * option: silently booking a different package would be worse than
         * asking the visitor to choose again.
         */
        preselectPackage() {
            const requested = new URLSearchParams(window.location.search).get('packageId');

            if (!requested) {
                return;
            }

            const match = this.packages.find(package_ => String(package_.id) === String(requested));

            this.form.packageId = match ? String(match.id) : '';
        },

        /**
         * Reports a load failure without breaking the page.
         * @param {Object} response - Normalized API response.
         * @returns {void}
         * @remarks
         * No alertService here: a modal on page load would block a visitor who
         * cannot fix the problem. The technical reason always goes to console.
         */
        reportFailure(response) {
            console.error(
                `[booking] Packages could not be loaded (status ${response.status}): ${response.error}`
            );

            this.notice = response.error || this.content.loadError;
        },

        /**
         * Options of the gijgo datepicker.
         * @returns {Object} Configuration for pluginBridge.initDatepicker.
         * @remarks
         * The format is the one BookingService.toUtcIso() parses (day first).
         * gijgo.css only ships the Material theme, so uiLibrary is left at its
         * default; the icon repeats what the template used.
         */
        datepickerOptions() {
            return {
                format: 'dd/mm/yyyy',
                iconsLibrary: 'fontawesome',
                icons: { rightIcon: '<span class="fa fa-caret-down"></span>' },
                minDate: function () {
                    const today = new Date();

                    today.setHours(0, 0, 0, 0);

                    return today;
                }
            };
        },

        /**
         * Validation message of a single field.
         * @param {string} field - Property name inside form.
         * @returns {string} Message to show, empty when the field is valid.
         * @remarks
         * Mirrors the DataAnnotations of CreateAppointmentRequestDto: the
         * lengths are the StringLength values and the ranges match [Range] and
         * [Required], so the API never rejects what this page accepted.
         */
        messageFor(field) {
            const value = (this.form[field] === null || this.form[field] === undefined)
                ? ''
                : String(this.form[field]).trim();

            switch (field) {
                case 'packageId':
                    return Number(value) >= 1 ? '' : 'Please choose a package.';

                case 'appointmentDate':
                    if (!value) {
                        return 'Please choose a date for your session.';
                    }

                    return this.isFutureDate(value) ? '' : 'Please choose today or a later date.';

                case 'fullName':
                    if (!value) {
                        return 'Please enter your full name.';
                    }

                    return value.length <= 150 ? '' : 'Your name cannot exceed 150 characters.';

                case 'email':
                    if (!value) {
                        return 'Please enter your email address.';
                    }

                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        return 'Please enter a valid email address.';
                    }

                    return value.length <= 255 ? '' : 'Your email address cannot exceed 255 characters.';

                case 'phone':
                    if (!value) {
                        return 'Please enter your phone number.';
                    }

                    // [Phone] accepts digits, spaces and the usual separators;
                    // the length also covers the StringLength(20) of the DTO.
                    return /^[0-9+()\s.\-]{7,20}$/.test(value)
                        ? ''
                        : 'Please enter a valid phone number.';

                case 'location':
                    return value.length <= 250 ? '' : 'The location cannot exceed 250 characters.';

                case 'notes':
                    return value.length <= 2000 ? '' : 'Your notes cannot exceed 2000 characters.';

                default:
                    return '';
            }
        },

        /**
         * Checks that a date is real and not in the past.
         * @param {string} value - Date in dd/mm/yyyy, as the datepicker writes it.
         * @returns {boolean} True when the date can be booked.
         * @remarks
         * The Date constructor rolls 31/02 over into March, so the components
         * are compared back: the datepicker restricts the calendar, but the
         * input can still be typed by hand.
         */
        isFutureDate(value) {
            const parts = value.split('/');

            if (parts.length !== 3) {
                return false;
            }

            const day = Number(parts[0]);
            const month = Number(parts[1]);
            const year = Number(parts[2]);
            const candidate = new Date(year, month - 1, day);

            if (candidate.getFullYear() !== year
                || candidate.getMonth() !== month - 1
                || candidate.getDate() !== day) {
                return false;
            }

            const today = new Date();

            today.setHours(0, 0, 0, 0);

            return candidate.getTime() >= today.getTime();
        },

        /**
         * Validates one field and refreshes its message.
         * @param {string} field - Property name inside form.
         * @returns {boolean} True when the field is valid.
         */
        validateField(field) {
            const message = this.messageFor(field);

            if (message) {
                this.errors[field] = message;
            } else {
                delete this.errors[field];
            }

            return !message;
        },

        /**
         * Validates the whole form.
         * @returns {boolean} True when every field is valid.
         * @remarks
         * The object is replaced as a whole so Alpine repaints the messages in
         * a single pass instead of once per field.
         */
        validate() {
            const errors = {};

            Object.keys(this.form).forEach(field => {
                const message = this.messageFor(field);

                if (message) {
                    errors[field] = message;
                }
            });

            this.errors = errors;

            return Object.keys(errors).length === 0;
        },

        /**
         * Sends the appointment request.
         * @returns {Promise<void>}
         */
        async submit() {
            // A submission in flight blocks the rest: the endpoint is rate
            // limited and a double click would burn an attempt.
            if (this.sending) {
                return;
            }

            if (!this.validate()) {
                alertService.validationError(Object.values(this.errors));
                return;
            }

            // TODO (T03): send the request.
            //  1. captchaService.execute('booking') for the token, and
            //     captchaService.hideBadge() in init() alongside the notice.
            //  2. BookingService.toUtcIso(this.form.appointmentDate, time) —
            //     decide first whether the form gets a time field; today the
            //     appointment would travel at 00:00 local time.
            //  3. BookingService.requestAppointment() and alertService for the
            //     outcome, mapping response.validationErrors back onto errors.
            //  4. Reset: clearing form is not enough, the gijgo input and the
            //     nice-select clone hold their own value and must be cleared
            //     through pluginBridge.
            console.warn('[booking] Submission is not implemented yet (T03).');
        }
    }));
});