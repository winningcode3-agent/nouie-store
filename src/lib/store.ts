// Cart state management with localStorage persistence

import type { CartItem } from './types'

const CART_KEY = 'nouie_cart'

class CartStore {
    private items: CartItem[] = []
    private listeners: (() => void)[] = []

    constructor() {
        this.load()
    }

    getItems(): CartItem[] {
        return [...this.items]
    }

    getTotal(): number {
        return this.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
    }

    getTotalQuantity(): number {
        return this.items.reduce((sum, item) => sum + item.qty, 0)
    }

    addItem(id: string, name: string, size: string, price: number): void {
        const existing = this.items.find(item => item.id === id && item.size === size)
        if (existing) {
            existing.qty++
        } else {
            this.items.push({ id, name, size, price, qty: 1 })
        }
        this.save()
        this.notify()
    }

    removeItem(index: number): void {
        this.items.splice(index, 1)
        this.save()
        this.notify()
    }

    clear(): void {
        this.items = []
        this.save()
        this.notify()
    }

    subscribe(listener: () => void): () => void {
        this.listeners.push(listener)
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    }

    private notify(): void {
        this.listeners.forEach(listener => listener())
    }

    private save(): void {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(this.items))
        } catch (e) {
            console.warn('Failed to save cart:', e)
        }
    }

    private load(): void {
        try {
            const saved = localStorage.getItem(CART_KEY)
            if (saved) {
                this.items = JSON.parse(saved)
            }
        } catch (e) {
            console.warn('Failed to load cart:', e)
        }
    }
}

// Singleton instance
export const cartStore = new CartStore()
