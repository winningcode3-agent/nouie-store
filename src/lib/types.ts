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
    stock_by_size?: Record<string, number>
    is_active?: boolean
    sku: string
    brand: string
    color: string
    material?: string
    variants?: ProductVariant[]
}

export interface ProductVariant {
    id: string
    name: string
    sku: string
    color: string
    price: number
    stock_qty: number
    images: string[]
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
    subtotal?: number
    shipping_method?: 'standard' | 'express'
    shipping_cost?: number
    total: number
    status: string
    tracking_number?: string
    carrier?: string
    stripe_session_id?: string
    paid_at?: string
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
