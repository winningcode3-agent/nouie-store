// Store settings service with local cache & Supabase persistence

import { supabase } from './supabase'
import type { StoreSettings, ShippingSettings, TaxSettings, BusinessSettings, StoreGeneralSettings } from './types'

export const DEFAULT_SETTINGS: StoreSettings = {
    business: {
        name: 'NOUIE',
        address_line1: '104 INDUSTRIAL_ZONE_04',
        address_line2: '',
        city: 'NORTH_TERMINAL',
        state: 'VOID',
        zip: '00000',
        country: 'USA',
        phone: '',
        email_support: 'support@nouie.com',
        email_studio: 'studio@nouie.com'
    },
    shipping: {
        standard: 10.00,
        express: 25.00,
        free_threshold: 250.00,
        standard_days: '5-7',
        express_days: '2-3'
    },
    tax: {
        enabled: false,
        rate: 0.00,
        label: 'SALES TAX'
    },
    store: {
        maintenance: false,
        announcement: ''
    }
}

class SettingsService {
    private cache: Partial<StoreSettings> = {}
    private cacheTime: number = 0
    private CACHE_TTL_MS = 60 * 1000 // 1 minute cache

    async getShipping(): Promise<ShippingSettings> {
        return this.getSetting<ShippingSettings>('shipping', DEFAULT_SETTINGS.shipping)
    }

    async getTax(): Promise<TaxSettings> {
        return this.getSetting<TaxSettings>('tax', DEFAULT_SETTINGS.tax)
    }

    async getBusiness(): Promise<BusinessSettings> {
        return this.getSetting<BusinessSettings>('business', DEFAULT_SETTINGS.business)
    }

    async getStoreGeneral(): Promise<StoreGeneralSettings> {
        return this.getSetting<StoreGeneralSettings>('store', DEFAULT_SETTINGS.store)
    }

    async getAllSettings(): Promise<StoreSettings> {
        const [business, shipping, tax, store] = await Promise.all([
            this.getBusiness(),
            this.getShipping(),
            this.getTax(),
            this.getStoreGeneral()
        ])
        return { business, shipping, tax, store }
    }

    async getSetting<T>(key: keyof StoreSettings, fallback: T): Promise<T> {
        const now = Date.now()
        if (this.cache[key] && (now - this.cacheTime < this.CACHE_TTL_MS)) {
            return this.cache[key] as T
        }

        try {
            const { data, error } = await supabase
                .from('store_settings')
                .select('value')
                .eq('key', key)
                .maybeSingle()

            if (error || !data) {
                return fallback
            }

            this.cache[key] = data.value as any
            this.cacheTime = now
            return data.value as T
        } catch {
            return fallback
        }
    }

    async updateSetting(key: keyof StoreSettings, value: any): Promise<{ error: any }> {
        try {
            const { error } = await supabase
                .from('store_settings')
                .upsert({ key, value, updated_at: new Date().toISOString() })

            if (!error) {
                this.cache[key] = value
                this.cacheTime = Date.now()
            }
            return { error }
        } catch (err) {
            return { error: err }
        }
    }

    clearCache(): void {
        this.cache = {}
        this.cacheTime = 0
    }
}

export const settingsService = new SettingsService()
