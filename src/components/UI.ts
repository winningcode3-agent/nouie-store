// UI Component - Header, Menu Drawer, Cart Drawer

import { cartStore } from '../lib/store'

export class UI {
    private cartDrawerOpen = false
    private menuOpen = false
    private onNavigate: (page: string) => void

    constructor(onNavigate: (page: string) => void) {
        this.onNavigate = onNavigate
        this.init()
        this.renderCartItems()

        // Subscribe to cart changes
        cartStore.subscribe(() => this.renderCartItems())
    }

    private init(): void {
        // Clean up previous UI
        document.querySelectorAll('.overlay, .header, .cart-drawer, .menu-drawer').forEach(e => e.remove())

        // Home overlay
        const overlay = document.createElement('div')
        overlay.className = 'overlay'
        overlay.innerHTML = `
      <div class="tagline">WE MOVE FORWARD.</div>
      <div class="footer-actions">
        <a href="#collection" class="footer-btn">ENTER EXPERIENCE</a>
        <a href="#lookbook" class="footer-btn">LOOKBOOK</a>
      </div>
      <div class="tech-info">
        ENVIRONMENT: INDUSTRIAL_ZONE_04_HIGH_VIS<br>
        LIGHTING: ATMOSPHERIC_CHARCOAL_WASH
      </div>
    `
        document.body.appendChild(overlay)

        // Header
        const header = document.createElement('div')
        header.className = 'header'
        header.innerHTML = `
      <div class="brand-small">
        NOUIE
        <span class="brand-sub">INDUSTRIAL DESIGN UNIT</span>
      </div>
      <div class="header-actions">
        <button class="cart-btn" id="cartBtn">
          <span class="bag-icon">🛒</span> CART (<span id="cartCount">${cartStore.getTotalQuantity()}</span>)
        </button>
        <button class="menu-toggle" id="menuToggle">
          <div class="menu-icon"></div>
        </button>
      </div>
    `
        document.body.appendChild(header)

        // Cart Drawer
        const cartDrawer = document.createElement('div')
        cartDrawer.className = 'cart-drawer'
        cartDrawer.id = 'cartDrawer'
        cartDrawer.innerHTML = `
      <div class="cart-drawer-header">
        <h2>YOUR CART</h2>
        <button class="cart-close" id="cartClose">&times;</button>
      </div>
      <div class="cart-items" id="cartItems">
        <div class="cart-empty">YOUR CART IS EMPTY</div>
      </div>
      <div class="cart-footer">
        <div class="cart-total">
          <span>TOTAL</span>
          <span id="cartTotal">$0.00 USD</span>
        </div>
        <button class="btn-checkout" id="checkoutBtn">CHECKOUT</button>
      </div>
    `
        document.body.appendChild(cartDrawer)

        // Menu Drawer
        const menuDrawer = document.createElement('div')
        menuDrawer.className = 'menu-drawer'
        menuDrawer.id = 'menuDrawer'
        menuDrawer.innerHTML = `
      <nav class="drawer-nav">
        <a href="#home" class="drawer-link">HOME</a>
        <a href="#collection" class="drawer-link">COLLECTION</a>
        <a href="#archive" class="drawer-link">ARCHIVE</a>
        <a href="#studio" class="drawer-link">STUDIO</a>
      </nav>
    `
        document.body.appendChild(menuDrawer)

        // Event Listeners
        this.addEventListeners(cartDrawer, menuDrawer)
    }

    private addEventListeners(cartDrawer: HTMLElement, menuDrawer: HTMLElement): void {
        // Cart button
        document.getElementById('cartBtn')?.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggleCart()
        })

        // Cart close
        document.getElementById('cartClose')?.addEventListener('click', () => {
            this.toggleCart(false)
        })

        // Checkout button
        document.getElementById('checkoutBtn')?.addEventListener('click', () => {
            if (cartStore.getItems().length === 0) return
            this.toggleCart(false)
            window.location.hash = '#checkout'
        })

        // Menu toggle
        document.getElementById('menuToggle')?.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggleMenu()
        })

        // Drawer links
        menuDrawer.querySelectorAll('.drawer-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const hash = (e.currentTarget as HTMLAnchorElement).getAttribute('href')?.replace('#', '') || 'home'
                this.toggleMenu(false)
                this.onNavigate(hash)
            })
        })

        // Close on outside click
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            if (!menuDrawer.contains(target) && !document.getElementById('menuToggle')?.contains(target)) {
                this.toggleMenu(false)
            }
            if (!cartDrawer.contains(target) && !document.getElementById('cartBtn')?.contains(target)) {
                this.toggleCart(false)
            }
        })
    }

    toggleCart(force?: boolean): void {
        const cartDrawer = document.getElementById('cartDrawer')
        if (!cartDrawer) return

        this.cartDrawerOpen = force !== undefined ? force : !this.cartDrawerOpen

        if (this.cartDrawerOpen) {
            cartDrawer.classList.add('active')
        } else {
            cartDrawer.classList.remove('active')
        }
    }

    toggleMenu(force?: boolean): void {
        const toggle = document.getElementById('menuToggle')
        const drawer = document.getElementById('menuDrawer')

        this.menuOpen = force !== undefined ? force : !this.menuOpen

        if (this.menuOpen) {
            toggle?.classList.add('active')
            drawer?.classList.add('active')
        } else {
            toggle?.classList.remove('active')
            drawer?.classList.remove('active')
        }
    }

    renderCartItems(): void {
        const cartItemsEl = document.getElementById('cartItems')
        const cartTotalEl = document.getElementById('cartTotal')
        const cartCountEl = document.getElementById('cartCount')

        if (!cartItemsEl) return

        const items = cartStore.getItems()

        if (items.length === 0) {
            cartItemsEl.innerHTML = '<div class="cart-empty">YOUR CART IS EMPTY</div>'
            if (cartTotalEl) cartTotalEl.textContent = '$0.00 USD'
            if (cartCountEl) cartCountEl.textContent = '0'
            return
        }

        const total = cartStore.getTotal()
        const totalQty = cartStore.getTotalQuantity()

        cartItemsEl.innerHTML = items.map((item, index) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-details">SIZE: ${item.size} / QTY: ${item.qty}</div>
        </div>
        <div class="cart-item-price">$${item.price * item.qty}.00</div>
        <button class="cart-item-remove" data-index="${index}">&times;</button>
      </div>
    `).join('')

        if (cartTotalEl) cartTotalEl.textContent = `$${total}.00 USD`
        if (cartCountEl) cartCountEl.textContent = String(totalQty)

        // Add remove handlers
        cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0')
                cartStore.removeItem(index)
            })
        })
    }

    setOverlayVisible(visible: boolean): void {
        const overlay = document.querySelector('.overlay') as HTMLElement
        if (overlay) {
            overlay.style.display = visible ? 'flex' : 'none'
        }
    }
}
