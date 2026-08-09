/**
 * Alpine module for the Contact page.
 *
 * Owns the contact form: local validation, reCAPTCHA token, submission and the
 * loading, success and error states.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('contactPage', () => ({
        content: window.SITE_CONTENT.contact,
        business: window.SITE_CONTENT.business,
        states: window.SITE_CONTENT.states,
        messages: window.SITE_CONTENT.messages,

        sending: false,
        errors: [],

        form: { name: '', email: '', phone: '', subject: '', message: '' },

        /**
         * Hides the reCAPTCHA badge: this page shows the required notice below
         * the form, which is what allows hiding it under Google's terms.
         * @returns {void}
         */
        init() {
            captchaService.hideBadge();
        },

        /**
         * Validates the form before spending a request on it.
         * @returns {Array<string>} Validation messages, empty when valid.
         */
        validate() {
            const errors = [];
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!this.form.name.trim()) {
                errors.push('Please enter your name.');
            }

            if (!this.form.email.trim()) {
                errors.push('Please enter your email address.');
            } else if (!emailPattern.test(this.form.email.trim())) {
                errors.push('Please enter a valid email address.');
            }

            if (!this.form.subject.trim()) {
                errors.push('Please enter a subject.');
            }

            if (!this.form.message.trim()) {
                errors.push('Please enter a message.');
            }

            return errors;
        },

        /**
         * Clears every field after a successful submission.
         * @returns {void}
         */
        reset() {
            this.form = { name: '', email: '', phone: '', subject: '', message: '' };
            this.errors = [];
        },

        /**
         * Sends the message and reports the outcome.
         * @returns {Promise<void>}
         */
        async submit() {
            // A submission in flight blocks the rest: the endpoint allows five
            // requests per minute and a double click would burn one.
            if (this.sending) {
                return;
            }

            this.errors = this.validate();

            if (this.errors.length) {
                alertService.validationError(this.errors);
                return;
            }

            this.sending = true;

            let captchaToken = '';

            // The token is requested only after local validation passes, so an
            // incomplete form never spends a captcha round trip.
            try {
                captchaToken = await captchaService.execute('contact');
            } catch (error) {
                this.sending = false;
                alertService.error('Verification failed', this.messages.captchaError);
                return;
            }

            const service = new ContactService(createApiService());
            const response = await service.sendMessage({ ...this.form, captchaToken });

            this.sending = false;

            if (response.success) {
                this.reset();
                alertService.success(this.messages.contactSuccessTitle,
                                     this.messages.contactSuccessText);
                return;
            }

            // A 400 carries the per-field messages of ValidationProblemDetails.
            this.errors = response.validationErrors || [];

            if (this.errors.length) {
                alertService.validationError(this.errors);
            } else {
                alertService.error('Message not sent', response.error);
            }
        }
    }));
});
