// Fallback product data when Supabase is not available

import type { Product, TechnicalMetadata, ArchiveSeason } from './types'

export const catalogs: Product[] = [
    {
        id: 'CAT01',
        name: 'INDUSTRIAL WAFFLE UNIT',
        season: 'SS26_REVEAL',
        price: 245,
        description: 'Heavy-duty utility hoodie featuring reinforced seams and heat-treated poly panels. Designed for extreme conditions.',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        images: ['cat1_1.jpg', 'cat1_2.jpg', 'cat1_3.jpg', 'cat1_4.png']
    },
    {
        id: 'CAT02',
        name: 'NO BRAKE NO TURN UNIT',
        season: 'SS26_DROP_01',
        price: 320,
        description: 'Technical cargo system with water-resistant ripstop construction. Multiple utility pockets with arid mesh ventilation.',
        sizes: ['S', 'M', 'L', 'XL'],
        images: ['cat2_1.jpg', 'cat2_2.jpg', 'cat2_3.jpg', 'cat2_4.jpg']
    },
    {
        id: 'CAT03',
        name: 'NO U TURN MESH UNIT',
        season: 'SS26_DROP_02',
        price: 195,
        description: 'Lightweight mesh vest with laser-cut synthetic panels. High-visibility cord detailing for urban navigation.',
        sizes: ['M', 'L', 'XL'],
        images: ['cat3_1.png', 'cat3_2.png', 'cat3_3.png', 'cat3_4.png']
    }
]

export const technicalMetadata: Record<string, TechnicalMetadata> = {
    'CAT01': { material: 'REINFORCED NYLON / HEAT-TREATED POLY', weight: '450GSM', zone: 'NORTH_INDUSTRIAL' },
    'CAT02': { material: 'WATER-RESISTANT RIPSTOP / ARID MESH', weight: '320GSM', zone: 'EAST_LOGISTICS' },
    'CAT03': { material: 'LASER-CUT SYNTHETIC / HIGH-VIS CORD', weight: '280GSM', zone: 'SOUTH_STORAGE' }
}

export const archiveSeasons: ArchiveSeason[] = [
    {
        id: 'S01',
        title: 'SEASON_01 / GENESIS',
        year: '2024',
        description: 'The foundation drop. Where it all began. Mesh jerseys and signature branding define the NOUIE identity.',
        highlights: ['MESH JERSEY SERIES', 'SIGNATURE LOGO TYPE', 'INDUSTRIAL LOOKBOOK'],
        images: ['cat1_1.jpg', 'cat1_2.jpg'],
        instagramTag: '@_nouie'
    },
    {
        id: 'S02',
        title: 'SEASON_02 / EVOLUTION',
        year: '2025',
        description: 'Expanding the universe with technical fabrics and street-ready aesthetics.',
        highlights: ['CARGO SYSTEM', 'POLKA DOT SERIES', 'EARTH TONE EXPANSION'],
        images: ['cat2_1.jpg', 'cat2_2.jpg'],
        instagramTag: '@_nouie'
    },
    {
        id: 'S03',
        title: 'SEASON_03 / INDUSTRIAL',
        year: '2025',
        description: 'Current collection. Industrial precision meets wearable art.',
        highlights: ['WAFFLE UNIT', 'NO BRAKE SYSTEM', 'MESH INTEGRATION'],
        images: ['cat3_1.png', 'cat3_2.png'],
        instagramTag: '@_nouie'
    }
]

export const collectionImages = [
    '/assets/cat1_1.jpg', '/assets/cat1_2.jpg', '/assets/cat1_3.jpg', '/assets/cat1_4.png',
    '/assets/cat2_1.jpg', '/assets/cat2_2.jpg', '/assets/cat2_3.jpg', '/assets/cat2_4.jpg',
    '/assets/cat3_1.png', '/assets/cat3_2.png', '/assets/cat3_3.png', '/assets/cat3_4.png'
]
