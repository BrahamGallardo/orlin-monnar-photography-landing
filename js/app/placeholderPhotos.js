/**
 * Provisional photographs shaped exactly like PhotoDto.
 *
 * Used while the gallery is still empty or the API is unreachable, so the
 * landing is never rendered without images. Once the real photographs are
 * uploaded from the admin panel this file is no longer used and can be removed.
 *
 * Negative ids keep them from ever colliding with real records.
 */
window.PLACEHOLDER_PHOTOS = [
    {
        id: -1,
        title: 'Quinceañera Preshoot',
        altText: 'Quinceañera in a red and white gown standing beside a horse',
        thumbUrl: 'img/provisional/quinceanera-02-thumb.webp',
        mediumUrl: 'img/provisional/quinceanera-02-medium.webp',
        largeUrl: 'img/provisional/quinceanera-02-large.webp',
        width: 2500,
        height: 1667,
        displayOrder: 1,
        isFeatured: true
    },
    {
        id: -2,
        title: 'Quinceañera Celebration',
        altText: 'Quinceañera celebrating with her court during the reception',
        thumbUrl: 'img/provisional/quinceanera-04-thumb.webp',
        mediumUrl: 'img/provisional/quinceanera-04-medium.webp',
        largeUrl: 'img/provisional/quinceanera-04-large.webp',
        width: 2500,
        height: 1667,
        displayOrder: 2,
        isFeatured: true
    },
    {
        id: -3,
        title: 'Quinceañera Session',
        altText: 'Quinceañera portrait session outdoors',
        thumbUrl: 'img/provisional/quinceanera-03-thumb.webp',
        mediumUrl: 'img/provisional/quinceanera-03-medium.webp',
        largeUrl: 'img/provisional/quinceanera-03-large.webp',
        width: 2500,
        height: 1667,
        displayOrder: 3,
        isFeatured: true
    },
    {
        id: -4,
        title: 'Quinceañera Portraits',
        altText: 'Quinceañera posing for portraits in her ball gown',
        thumbUrl: 'img/provisional/quinceanera-05-thumb.webp',
        mediumUrl: 'img/provisional/quinceanera-05-medium.webp',
        largeUrl: 'img/provisional/quinceanera-05-large.webp',
        width: 2500,
        height: 1667,
        displayOrder: 4,
        isFeatured: true
    },
    {
        id: -5,
        title: 'Quinceañera Day',
        altText: 'Quinceañera photographed on her celebration day',
        thumbUrl: 'img/provisional/quinceanera-01-thumb.webp',
        mediumUrl: 'img/provisional/quinceanera-01-medium.webp',
        largeUrl: 'img/provisional/quinceanera-01-large.webp',
        width: 2500,
        height: 1667,
        displayOrder: 5,
        isFeatured: true
    },
    {
        id: -6,
        title: 'Wedding Day',
        altText: 'Bride and groom holding hands on their wedding day',
        thumbUrl: 'img/provisional/wedding-01-thumb.webp',
        mediumUrl: 'img/provisional/wedding-01-medium.webp',
        largeUrl: 'img/provisional/wedding-01-large.webp',
        width: 1500,
        height: 1000,
        displayOrder: 6,
        isFeatured: true
    },
    {
        id: -7,
        title: 'Wedding Session',
        altText: 'Newlyweds during their outdoor wedding session',
        thumbUrl: 'img/provisional/wedding-02-thumb.webp',
        mediumUrl: 'img/provisional/wedding-02-medium.webp',
        largeUrl: 'img/provisional/wedding-02-large.webp',
        width: 1500,
        height: 1000,
        displayOrder: 7,
        isFeatured: true
    },
    {
        id: -8,
        title: 'Bridal Portrait',
        altText: 'Bridal portrait taken during a wedding session',
        thumbUrl: 'img/provisional/wedding-03-thumb.webp',
        mediumUrl: 'img/provisional/wedding-03-medium.webp',
        largeUrl: 'img/provisional/wedding-03-large.webp',
        width: 1500,
        height: 2250,
        displayOrder: 8,
        isFeatured: true
    },
    {
        id: -9,
        title: 'Portrait Session',
        altText: 'Studio portrait session',
        thumbUrl: 'img/provisional/portrait-01-thumb.webp',
        mediumUrl: 'img/provisional/portrait-01-medium.webp',
        largeUrl: 'img/provisional/portrait-01-large.webp',
        width: 1500,
        height: 1000,
        displayOrder: 9,
        isFeatured: true
    },
    {
        id: -10,
        title: 'Quinceañera Details',
        altText: 'Quinceañera session capturing dress and styling details',
        thumbUrl: 'img/provisional/quinceanera-06-thumb.webp',
        mediumUrl: 'img/provisional/quinceanera-06-medium.webp',
        largeUrl: 'img/provisional/quinceanera-06-large.webp',
        width: 2500,
        height: 1000,
        displayOrder: 10,
        isFeatured: true
    }
];

/**
 * Provisional categories shaped like GalleryCategoryDto.
 *
 * gallery.html renders categories, not photographs, so the fallback needs this
 * shape. They are NOT navigable: gallery-detail.html has no fallback by design,
 * so a link would always land on "album not found". galleryPage omits the href
 * while the fallback is in use.
 *
 * Negative ids keep them from ever colliding with real records.
 */
window.PLACEHOLDER_CATEGORIES = [
    {
        id: -101,
        name: 'Quinceañeras',
        slug: 'quinceaneras',
        description: null,
        displayOrder: 1,
        coverPhoto: window.PLACEHOLDER_PHOTOS[0],
        photoCount: 8,
        photos: []
    },
    {
        id: -102,
        name: 'Weddings',
        slug: 'weddings',
        description: null,
        displayOrder: 2,
        coverPhoto: window.PLACEHOLDER_PHOTOS[5],
        photoCount: 3,
        photos: []
    },
    {
        id: -103,
        name: 'Portraits & Prints',
        slug: 'portraits',
        description: null,
        displayOrder: 3,
        coverPhoto: window.PLACEHOLDER_PHOTOS[8],
        photoCount: 4,
        photos: []
    }
];

/**
 * Provisional packages shaped exactly like PackageDto.
 *
 * investment.html renders them when the API is unreachable and when the
 * catalogue is still empty, so the page is never a bare error message.
 *
 * TODO: replace the figures with the real minimum package once Orlin confirms
 * duration, price and what it includes. Until then these are generic reference
 * values, not the client's tariff.
 *
 * They are not navigable with a packageId: booking.html could never pre-select
 * a package that does not exist in the database.
 *
 * Negative ids keep them from ever colliding with real records.
 */
window.PLACEHOLDER_PACKAGES = [
    {
        id: -201,
        name: 'Portrait Session',
        description: 'A short, unhurried session for one person or a couple, '
            + 'on location at golden hour.',
        includes: 'One hour of coverage\n'
            + 'One location of your choice\n'
            + '25 edited photographs\n'
            + 'Private online gallery\n'
            + 'Personal print release',
        duration: '1 hour',
        price: 500,
        currency: 'USD',
        displayOrder: 1
    },
    {
        id: -202,
        name: 'Quinceañera Session',
        description: 'The preshoot and the celebration, from the first portrait '
            + 'in the gown to the last dance of the night.',
        includes: 'Three hours of coverage\n'
            + 'Preshoot on location\n'
            + 'Two changes of wardrobe\n'
            + '80 edited photographs\n'
            + 'Private online gallery\n'
            + 'One 11x14 metal print',
        duration: '3 hours',
        price: 500,
        currency: 'USD',
        displayOrder: 2
    },
    {
        id: -203,
        name: 'Wedding Coverage',
        description: 'Full day coverage, from getting ready to the closing of '
            + 'the reception, with a second photographer.',
        includes: 'Eight hours of coverage\n'
            + 'Second photographer\n'
            + 'Getting ready, ceremony and reception\n'
            + '400 edited photographs\n'
            + 'Private online gallery\n'
            + 'Engagement session included',
        duration: '8 hours',
        price: 4000,
        currency: 'USD',
        displayOrder: 3
    }
];