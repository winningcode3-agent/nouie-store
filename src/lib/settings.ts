// Store settings service with local cache & Supabase persistence

import { supabase } from './supabase'
import type { StoreSettings, ShippingSettings, TaxSettings, BusinessSettings, StoreGeneralSettings, PopupSettings } from './types'

export const DEFAULT_SETTINGS: StoreSettings = {
    business: {
        // Pa gen valè envante isit la: yon chan vid rete vid sou fakti a olye
        // yon fo adrès (« INDUSTRIAL_ZONE_04 ») oswa yon imèl ki pa pou nou.
        name: 'NOUIE',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA',
        phone: '',
        email_support: '',
        email_studio: ''
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
        announcement: '',
        featured_product: 'CAT04',
        returns_summary: 'All sales are final — no returns or exchanges. If your item arrives defective, damaged or wrong, contact us right away so we can make it right.'
    },
    popup: {
        enabled: false,
        title: 'GET 10% OFF',
        text: 'Save on your first order and get email-only offers when you join.',
        button: 'CONTINUE',
        success_title: 'WELCOME TO NOUIE',
        success_text: 'Use this code at checkout:',
        code: '',
        delay_seconds: 6
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

    async getPopup(): Promise<PopupSettings> {
        return this.getSetting<PopupSettings>('popup', DEFAULT_SETTINGS.popup)
    }

    async getAllSettings(): Promise<StoreSettings> {
        const [business, shipping, tax, store, popup] = await Promise.all([
            this.getBusiness(),
            this.getShipping(),
            this.getTax(),
            this.getStoreGeneral(),
            this.getPopup()
        ])
        return { business, shipping, tax, store, popup }
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

            // Nou FONN valè a sou defo a. Yon ranje ki nan baz la depi anvan yon
            // nouvo chan ajoute pa gen chan sa a ladan l — san fonn sa a, chan an
            // tounen `undefined` epi fonksyonalite a mouri an silans (se sa ki te
            // fè bouton BUY NOW sou kouvèti a pa parèt ditou).
            const merged = (fallback && typeof fallback === 'object' && !Array.isArray(fallback))
                ? { ...(fallback as any), ...(data.value as any) }
                : (data.value as any)

            this.cache[key] = merged
            this.cacheTime = now
            return merged as T
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
