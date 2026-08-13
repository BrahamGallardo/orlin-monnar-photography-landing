/**
 * Site copy.
 *
 * Single place to replace text. The wording is generic on purpose until the
 * client provides the final content; every spot that needs his own words is
 * marked with a TODO comment right above it.
 */
window.SITE_CONTENT = {
    site: {
        name: 'Orlin Monnar Photography & Films',
        tagline: 'Quinceañeras, weddings and portraits'
    },

    // Real contact details of the studio.
    business: {
        serviceArea: 'Dallas–Fort Worth metroplex, Texas',
        phoneDisplay: '+1 (469) 847-6937',
        phoneLink: 'tel:+14698476937',
        email: 'orlin.monnar@gmail.com',
        instagram: 'https://www.instagram.com/orlinmonnar.photography',
        facebook: 'https://www.facebook.com/orlinmonnarphotography',
        tiktok: 'https://www.tiktok.com/@orlinmonnar.photography'
    },

    home: {
        heroTitle: 'Orlin Monnar Photography & Films',
        heroSubtitle: 'Quinceañeras, weddings and portraits in the Dallas–Fort Worth metroplex',

        // TODO: replace with the photographer's presentation in his own words.
        introTitle: 'Every celebration deserves to be remembered',
        introText: 'Photography and film for the moments that matter. Every session is planned '
            + 'around the people in it, so the images look like the day actually felt.',

        featuredTitle: 'Featured Work',
        featuredSubtitle: 'A selection of recent sessions',

        // TODO: confirm the scope of the video service before publishing.
        filmsTitle: 'Photography & Films',
        filmsText: 'Beyond photographs, every celebration can be captured on film: the '
            + 'preparations, the ceremony and the moments in between, edited into a piece you '
            + 'can watch years from now.',

        // TODO: confirm the list of services offered and their order.
        servicesTitle: 'What we photograph',
        servicesSubtitle: 'Sessions built around the occasion',

        testimonialsTitle: 'Client words',
        instagramTitle: 'Follow the latest work',

        contactTitle: 'Get in touch',
        contactText: 'Tell us about your celebration and we will walk you through the options.'
    },

    // TODO: pedir a Orlin su biografía, su retrato y los años que lleva
    // fotografiando. Todo el texto de esta sección es provisional.
    about: {
        title: 'About',

        lead: 'Photography and film from the Dallas–Fort Worth metroplex.',

        bioTitle: 'Behind the camera',
        bioText: 'Orlin Monnar photographs quinceañeras, weddings and portrait sessions for '
            + 'families across North Texas. His work focuses on the people in front of the '
            + 'camera: the small gestures, the way a family looks at each other, the details '
            + 'that get lost in the rush of the day.',

        statementTitle: 'How the work gets done',
        statementText: 'Each session is planned in advance and photographed without rushing, '
            + 'so the images feel like the day rather than a set of poses.',

        // TODO: confirmar el rol exacto y conseguir un retrato frontal.
        teamTitle: 'Behind every session',
        teamSubtitle: 'One photographer, from the first call to the final gallery',
        team: [
            { name: 'Orlin Monnar', role: 'Photographer & filmmaker' }
        ]
    },

    gallery: {
        title: 'Gallery',
        subtitle: 'Sessions organized by occasion',

        // TODO: replace with the photographer's own description of his albums.
        intro: 'Each album gathers one kind of session. If you have a date in mind, '
            + 'you can <a href="booking.html">book a session</a> or '
            + '<a href="contact.html">get in touch</a>.',

        photoCountOne: 'photograph',
        photoCountMany: 'photographs',
        emptyAlbum: 'This album has no photographs yet.',

        notFoundTitle: 'Album not found',
        notFoundText: 'This album is no longer published.',
        backToAlbums: 'See all albums'
    },

    investment: {
        title: 'Investment',
        subtitle: 'Session packages and pricing'
    },

    booking: {
        title: 'Book a Session',
        subtitle: 'Choose a package and a date, and we will confirm by email'
    },

    contact: {
        title: 'Contact',
        subtitle: 'We answer every message personally',
        // TODO: confirm the exact coverage area with the client.
        serviceAreaTitle: 'Service area',
        serviceAreaText: 'Serving the Dallas–Fort Worth metroplex and surrounding areas. '
            + 'Reach out to confirm availability for your location.'
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
