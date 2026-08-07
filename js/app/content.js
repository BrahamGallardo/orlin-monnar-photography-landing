/**
 * Site copy.
 *
 * Single place to replace text while the client's final content is missing.
 * Anything marked as PENDING must be replaced before going live.
 */
window.SITE_CONTENT = {
    site: {
        name: 'Orlin Monnar Photography & Films',
        tagline: 'Quinceañeras, weddings and portraits'
    },

    home: {
        heroTitle: 'Orlin Monnar Photography & Films',
        heroSubtitle: 'Quinceañeras, weddings and portraits in the Dallas–Fort Worth metroplex',
        // PENDING: replace with the photographer's own words.
        introTitle: 'Every celebration deserves to be remembered',
        introText: 'PENDING: short introduction to the photographer and the way he works.',
        featuredTitle: 'Featured Work',
        featuredSubtitle: 'A selection of recent sessions',
        ctaTitle: 'Ready to book your session?',
        ctaText: 'PENDING: closing line inviting visitors to get in touch.',
        ctaButton: 'Book a Session'
    },

    about: {
        title: 'PENDING: section title',
        intro: 'PENDING: introduction to the photographer'
    },

    gallery: {
        title: 'Gallery',
        subtitle: 'PENDING: gallery description'
    },

    investment: {
        title: 'Investment',
        subtitle: 'PENDING: packages description'
    },

    booking: {
        title: 'Book a Session',
        subtitle: 'PENDING: booking instructions'
    },

    contact: {
        title: 'Contact',
        subtitle: 'PENDING: invitation to get in touch',
        serviceAreaTitle: 'PENDING: service area title',
        serviceAreaText: 'PENDING: service area description'
    },

    // Shared state messages used across pages.
    states: {
        loading: 'Loading…',
        sending: 'Sending…',
        emptyGallery: 'No photographs published yet.',
        emptyCategories: 'No categories published yet.',
        emptyPackages: 'No packages published yet.'
    },

    messages: {
        contactSuccessTitle: 'Message sent',
        contactSuccessText: 'Thank you for reaching out. We will get back to you shortly.',
        bookingSuccessTitle: 'Request received',
        bookingSuccessText: 'We will confirm your session by email shortly.',
        captchaError: 'Security verification could not be completed. Please refresh the page and try again.'
    }
};
