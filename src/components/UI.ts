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
    document.querySelectorAll('.overlay, .header, .cart-drawer, .menu-drawer, .footer').forEach(e => e.remove())


    // Header (Centered Logo Layout)
    const header = document.createElement('div')
    header.className = 'header'
    header.innerHTML = `
      <div class="header-left">
        <button class="menu-toggle" id="menuToggle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
      
      <a href="#home" class="brand">
        <div class="brand-no">NO</div>
        <div class="brand-uie">UIE</div>
      </a>
      
      <div class="header-right">
        <button class="search-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
        <button class="cart-btn" id="cartBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span id="cartCount" class="cart-count">${cartStore.getTotalQuantity()}</span>
        </button>
      </div>
    `
    document.body.appendChild(header)

    // Ensure page-content exists and is in the correct order
    let contentDiv = document.getElementById('page-content')
    if (!contentDiv) {
      contentDiv = document.createElement('div')
      contentDiv.id = 'page-content'
      document.body.appendChild(contentDiv)
    } else {
      // Move it after the header if it already exists
      document.body.appendChild(contentDiv)
    }

    // Footer
    const footer = document.createElement('footer')
    footer.className = 'footer'
    footer.innerHTML = `
      <div class="footer-content">
        <div class="footer-column footer-brand">
          <a href="#home" class="brand">
            <div class="brand-no">NO</div>
            <div class="brand-uie">UIE</div>
          </a>
        </div>
        
        <div class="footer-column">
          <h4>EXPLORE</h4>
          <div class="footer-nav">
            <a href="#home" class="footer-link">Home</a>
            <a href="#collection" class="footer-link">Collection</a>
            <a href="#archive" class="footer-link">Archive</a>
            <a href="#studio" class="footer-link">Studio</a>
          </div>
        </div>
        
        <div class="footer-column">
          <h4>SUPPORT</h4>
          <div class="footer-nav">
            <a href="#shipping" class="footer-link">Shipping</a>
            <a href="#returns" class="footer-link">Returns</a>
            <a href="#privacy" class="footer-link">Privacy Policy</a>
            <a href="#contact" class="footer-link">Contact</a>
          </div>
        </div>
        
        <div class="footer-column footer-newsletter">
          <h4>UPDATE</h4>
          <p>Sign up to receive updates on new drops and archive releases.</p>
          <form class="newsletter-form">
            <input type="email" placeholder="EMAIL ADDRESS" class="newsletter-input">
            <button type="submit" class="btn-newsletter-submit">JOIN</button>
          </form>
        </div>
      </div>
      
      <div class="footer-bottom">
        <div class="copyright">© ${new Date().getFullYear()} NOUIE. ALL RIGHTS RESERVED.</div>
        <div class="footer-social">
          <a href="#" class="footer-link">INSTAGRAM</a>
          <a href="#" class="footer-link">TIKTOK</a>
        </div>
      </div>
    `
    document.body.appendChild(footer)

    // Cart Drawer
    const cartDrawer = document.createElement('div')
    cartDrawer.className = 'cart-drawer'
    cartDrawer.id = 'cartDrawer'
    cartDrawer.innerHTML = `
      <div class="cart-drawer-header">
        <h2>CART</h2>
        <button class="cart-close" id="cartClose">&times;</button>
      </div>
      <div class="cart-items" id="cartItems">
        <div class="cart-empty">YOUR CART IS EMPTY</div>
      </div>
      <div class="cart-footer">
        <div class="cart-total">
          <span>SUBTOTAL</span>
          <span id="cartTotal">$0.00 USD</span>
        </div>
        <p class="cart-shipping-notice">Shipping & taxes calculated at checkout</p>
        <button class="btn-checkout" id="checkoutBtn">CHECKOUT</button>
      </div>
    `
    document.body.appendChild(cartDrawer)

    // Menu Drawer
    const menuDrawer = document.createElement('div')
    menuDrawer.className = 'menu-drawer'
    menuDrawer.id = 'menuDrawer'
    menuDrawer.innerHTML = `
      <div class="menu-drawer-header">
        <button class="menu-close" id="menuClose">&times;</button>
      </div>
      <nav class="drawer-nav">
        <a href="#home" class="drawer-link">HOME</a>
        <a href="#collection" class="drawer-link">COLLECTION</a>
        <a href="#archive" class="drawer-link">ARCHIVE</a>
        <a href="#studio" class="drawer-link">STUDIO</a>
        <a href="#lookbook" class="drawer-link">LOOKBOOK</a>
      </nav>
      <div class="menu-drawer-footer">
        <a href="https://www.instagram.com/_nouie/" target="_blank">INSTAGRAM</a>
      </div>
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

    // Menu close
    document.getElementById('menuClose')?.addEventListener('click', () => {
      this.toggleMenu(false)
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

    // Drawer and Nav links
    document.querySelectorAll('.drawer-link, .nav-link, .brand, .footer-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
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

  setOverlayVisible(_visible: boolean): void {
    // Legacy overlay no longer used; homepage now part of scrollable content
  }
}
