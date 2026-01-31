// Fallback product data when Supabase is not available

import type { Product, TechnicalMetadata, ArchiveSeason } from './types'

export const catalogs: Product[] = [
    {
        id: 'CAT01',
        name: 'WAFFLE HOODIE',
        season: 'SS26',
        price: 245,
        description: 'Premium utility hoodie featuring reinforced seams and refined technical panels. Designed for versatility and form.',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        images: ['cat1_1.jpg', 'cat1_2.jpg', 'cat1_3.jpg', 'cat1_4.png'],
        stock_qty: 42,
        is_active: true,
        sku: 'NOUIE-SS26-WH-01',
        brand: 'NOUIE',
        color: 'BLACK',
        material: 'REINFORCED NYLON / POLY'
    },
    {
        id: 'CAT02',
        name: 'TECHNICAL CARGO',
        season: 'SS26',
        price: 320,
        description: 'Refined cargo system with water-resistant ripstop construction. Multiple utility pockets with minimalist ventilation.',
        sizes: ['S', 'M', 'L', 'XL'],
        images: ['cat2_1.jpg', 'cat2_2.jpg', 'cat2_3.jpg', 'cat2_4.jpg'],
        stock_qty: 15,
        is_active: true,
        sku: 'NOUIE-SS26-TC-02',
        brand: 'NOUIE',
        color: 'GREY',
        material: 'WATER-RESISTANT RIPSTOP / MESH'
    },
    {
        id: 'CAT03',
        name: 'MESH VEST',
        season: 'SS26',
        price: 195,
        description: 'Lightweight mesh vest with laser-cut synthetic panels. Subtle detailing for modern urban navigation.',
        sizes: ['M', 'L', 'XL'],
        images: ['cat3_1.png', 'cat3_2.png', 'cat3_3.png', 'cat3_4.png'],
        stock_qty: 8,
        is_active: true,
        sku: 'NOUIE-SS26-MV-03',
        brand: 'NOUIE',
        color: 'BLACK',
        material: 'LASER-CUT SYNTHETIC / CORD'
    }
]

export const technicalMetadata: Record<string, TechnicalMetadata> = {
    'CAT01': { material: 'REINFORCED NYLON / POLY', weight: '450GSM', zone: 'NORTH_STUDIO' },
    'CAT02': { material: 'WATER-RESISTANT RIPSTOP / MESH', weight: '320GSM', zone: 'EAST_STUDIO' },
    'CAT03': { material: 'LASER-CUT SYNTHETIC / CORD', weight: '280GSM', zone: 'SOUTH_STUDIO' }
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
        highlights: ['CARGO SYSTEM', 'DOT SERIES', 'TONE EXPANSION'],
        images: ['cat2_1.jpg', 'cat2_2.jpg'],
        instagramTag: '@_nouie'
    },
    {
        id: 'S03',
        title: 'SEASON 03',
        year: '2025',
        description: 'Current evolution. Precision meets wearable design.',
        highlights: ['WAFFLE UNIT', 'CARGO SYSTEM', 'MESH VEST'],
        images: ['cat3_1.png', 'cat3_2.png'],
        instagramTag: '@_nouie'
    }
]

export const collectionImages = [
    '/assets/cat1_1.jpg', '/assets/cat1_2.jpg', '/assets/cat1_3.jpg', '/assets/cat1_4.png',
    '/assets/cat2_1.jpg', '/assets/cat2_2.jpg', '/assets/cat2_3.jpg', '/assets/cat2_4.jpg',
    '/assets/cat3_1.png', '/assets/cat3_2.png', '/assets/cat3_3.png', '/assets/cat3_4.png'
]
