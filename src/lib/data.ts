// Fallback product data when Supabase is not available

import type { Product, TechnicalMetadata, ArchiveSeason } from './types'

export const catalogs: Product[] = [
    {
        id: 'CAT01',
        name: 'SOLDIER THERMALS',
        season: 'SS26',
        price: 67.99,
        description: 'Oversized thermal long-sleeve featuring hand-drawn soldier graphics. Premium cotton-blend construction with signature sleeve art.',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        images: ['soldier_thermal_1.jpg', 'cat1_2.jpg', 'cat1_3.jpg', 'cat1_4.png'],
        stock_qty: 42,
        is_active: true,
        sku: 'NOUIE-SS26-ST-01',
        brand: 'NOUIE',
        color: 'CREAM',
        material: 'COTTON BLEND / THERMAL KNIT'
    },
    {
        id: 'CAT02',
        name: 'NOUIE TEE',
        season: 'SS26',
        price: 67.99,
        description: 'Premium cotton tee with signature NOUIE graphics. Clean lines and modern fit.',
        sizes: ['S', 'M', 'L', 'XL'],
        images: ['cat2_1.jpg', 'cat2_2.jpg', 'cat2_3.jpg', 'cat2_4.jpg'],
        stock_qty: 15,
        is_active: true,
        sku: 'NOUIE-SS26-NT-02',
        brand: 'NOUIE',
        color: 'BLACK',
        material: 'PREMIUM COTTON'
    },
    {
        id: 'CAT03',
        name: 'NOUIE JERSEY',
        season: 'SS26',
        price: 44.77,
        description: 'Classic mesh jersey with breathable construction. Perfect for layering or standalone wear.',
        sizes: ['M', 'L', 'XL'],
        images: ['cat3_1.png', 'cat3_2.png', 'cat3_3.png', 'cat3_4.png'],
        stock_qty: 8,
        is_active: true,
        sku: 'NOUIE-SS26-NJ-03',
        brand: 'NOUIE',
        color: 'BLACK',
        material: 'MESH / POLYESTER'
    }
]


export const technicalMetadata: Record<string, TechnicalMetadata> = {
    'CAT01': { material: 'COTTON BLEND / THERMAL KNIT', weight: '380GSM', zone: 'NORTH_STUDIO' },
    'CAT02': { material: 'PREMIUM COTTON', weight: '180GSM', zone: 'EAST_STUDIO' },
    'CAT03': { material: 'MESH / POLYESTER', weight: '200GSM', zone: 'SOUTH_STUDIO' }
}

export const archiveSeasons: ArchiveSeason[] = [
    {
        id: 'S01',
        title: 'SEASON 01',
        year: '2024',
        description: 'The foundation of NOUIE identity. Mesh jerseys and signature branding.',
        highlights: ['MESH SERIES', 'LOGO TYPE', 'LOOKBOOK'],
        images: ['cat1_1.jpg', 'cat1_2.jpg'],
        instagramTag: '@_nouie'
    },
    {
        id: 'S02',
        title: 'SEASON 02',
        year: '2025',
        description: 'Expanding the universe with technical fabrics and refined aesthetics.',
        highlights: ['NOUIE TEE', 'DOT SERIES', 'TONE EXPANSION'],
        images: ['cat2_1.jpg', 'cat2_2.jpg'],
        instagramTag: '@_nouie'
    },
    {
        id: 'S03',
        title: 'SEASON 03',
        year: '2025',
        description: 'Current evolution. Precision meets wearable design.',
        highlights: ['SOLDIER THERMALS', 'NOUIE TEE', 'NOUIE JERSEY'],
        images: ['cat3_1.png', 'cat3_2.png'],
        instagramTag: '@_nouie'
    }
]

export const collectionImages = [
    '/assets/cat1_1.jpg', '/assets/cat1_2.jpg', '/assets/cat1_3.jpg', '/assets/cat1_4.png',
    '/assets/cat2_1.jpg', '/assets/cat2_2.jpg', '/assets/cat2_3.jpg', '/assets/cat2_4.jpg',
    '/assets/cat3_1.png', '/assets/cat3_2.png', '/assets/cat3_3.png', '/assets/cat3_4.png'
]
