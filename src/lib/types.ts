// Type definitions for NO UIE Store

export interface Product {
    id: string
    name: string
    season: string
    price: number
    description: string
    sizes: string[]
    images: string[]
    stock_qty?: number
    is_active?: boolean
}

export interface CartItem {
    id: string
    name: string
    size: string
    price: number
    qty: number
}

export interface Order {
    customer_name: string
    customer_email: string
    customer_phone: string
    shipping_address: string
    notes?: string
    items: CartItem[]
    total: number
    status: string
    id?: string | number
    created_at?: string
}

export interface TechnicalMetadata {
    material: string
    weight: string
    zone: string
}

export interface ArchiveSeason {
    id: string
    title: string
    year: string
    description: string
    highlights: string[]
    images: string[]
    instagramTag: string
}
