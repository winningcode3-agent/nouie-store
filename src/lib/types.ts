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

export type OrderStatus = 'pending' | 'paid' | 'payment_review' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

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
    status: OrderStatus
    tracking_number?: string
    carrier?: string
    stripe_session_id?: string
    paid_at?: string
    tax_rate?: number
    tax_amount?: number
    discount_code?: string
    discount_amount?: number
    notes_internal?: string
    id?: string | number
    created_at?: string
}

export interface AdminUser {
    id: string
    email: string
    user_id?: string
    added_at?: string
}

export interface BusinessSettings {
    name: string
    address_line1: string
    address_line2: string
    city: string
    state: string
    zip: string
    country: string
    phone: string
    email_support: string
    email_studio: string
}

export interface ShippingSettings {
    standard: number
    express: number
    free_threshold: number
    standard_days: string
    express_days: string
}

export interface TaxSettings {
    enabled: boolean
    rate: number
    label: string
}

export interface StoreGeneralSettings {
    maintenance: boolean
    announcement: string
}

export interface StoreSettings {
    business: BusinessSettings
    shipping: ShippingSettings
    tax: TaxSettings
    store: StoreGeneralSettings
}

export interface Collection {
    id: string
    slug: string
    title: string
    description?: string
    cover_image?: string
    sort_order: number
    is_active: boolean
    is_archived: boolean
    created_at?: string
}

export interface PageContent {
    slug: string
    title: string
    body: string
    updated_at?: string
}

export interface Discount {
    id?: number
    code: string
    type: 'percentage' | 'fixed'
    value: number
    min_subtotal: number
    starts_at?: string
    ends_at?: string
    max_uses?: number
    uses?: number
    active: boolean
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
