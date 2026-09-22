// UI Component - Header, Menu Drawer, Cart Drawer

import { cartStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { settingsService } from '../lib/settings'
import { escapeHtml } from '../lib/markdown'

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
            <a href="#lookbook" class="footer-link">Lookbook</a>
            <a href="#studio" class="footer-link">Studio</a>
          </div>
        </div>
        
        <div class="footer-column">
          <h4>SUPPORT</h4>
          <div class="footer-nav">
            <a href="#shipping" class="footer-link">Shipping</a>
            <a href="#returns" class="footer-link">Refund Policy</a>
            <a href="#privacy" class="footer-link">Privacy Policy</a>
            <a href="#terms" class="footer-link">Terms of Service</a>
            <a href="#contact" class="footer-link">Contact</a>
          </div>
        </div>
        
        <div class="footer-column footer-newsletter">
          <h4>UPDATE</h4>
          <p>Sign up to receive updates on new drops and upcoming releases.</p>
          <form class="newsletter-form">
            <input type="email" placeholder="EMAIL ADDRESS" class="newsletter-input">
            <button type="submit" class="btn-newsletter-submit">JOIN</button>
          </form>
        </div>
      </div>
      
      <div class="footer-bottom">
        <div class="copyright">© ${new Date().getFullYear()} NOUIE. ALL RIGHTS RESERVED. <span class="build-id">${__NOUIE_BUILD__}</span></div>
        <div class="footer-social">
          <a href="https://winningcode.agency" target="_blank" rel="noopener" class="footer-credit">CREATED BY WINNING CODE</a>
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
        <a href="#studio" class="drawer-link">STUDIO</a>
        <a href="#lookbook" class="drawer-link">LOOKBOOK</a>
      </nav>
      <div class="menu-drawer-footer">
        <a href="https://www.instagram.com/_nouie" target="_blank" rel="noopener" class="instagram-nav-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          INSTAGRAM
        </a>
      </div>
    `
    document.body.appendChild(menuDrawer)

    // Cookie consent banner
    this.renderCookieBanner()

    // Anons global la (admin -> STORE MODE & ANNOUNCEMENTS)
    void this.renderAnnouncement()

    // Fenèt « GET 10% OFF » (admin -> SIGNUP POPUP & WELCOME DISCOUNT)
    void this.scheduleSignupPopup()

    // Event Listeners
    this.addEventListeners(cartDrawer, menuDrawer)
  }

  // Tèks Franckley tape nan admin nan. Jiska kounye a reglaj la te egziste
  // nan panèl la men okenn kòd sou vitrin nan pa t li l — li pa t fè anyen.
  private async renderAnnouncement(): Promise<void> {
    let text = ''
    try {
      const store = await settingsService.getStoreGeneral()
      text = (store.announcement || '').trim()
    } catch (err) {
      console.warn('Could not load announcement:', err)
      return
    }
    if (!text) return

    document.getElementById('announcementBar')?.remove()
    const bar = document.createElement('div')
    bar.className = 'announcement-bar'
    bar.id = 'announcementBar'
    bar.textContent = text          // textContent: tèks admin pa ka enjekte HTML
    document.body.prepend(bar)

    // Menm apwòch ak banyè cookie a: nou mezire wotè a olye nou devine, paske
    // tèks la vlope sou telefòn epi antèt la dwe desann egzakteman sa ki fòk.
    const sync = () => document.body.style.setProperty('--announcement-h', `${bar.offsetHeight}px`)
    sync()
    window.addEventListener('resize', sync)
    document.body.classList.add('has-announcement')
  }

  // Fenèt enskripsyon ak rabè. Tout tèks yo soti nan reglaj `popup` la pou
  // Franckley ka chanje yo san touche kòd. Li parèt yon sèl fwa pa navigatè:
  // lè vizitè a fèmen l oswa li enskri, nou pa janm deranje l ankò.
  private async scheduleSignupPopup(): Promise<void> {
    const MAK = 'nouie_popup'
    try {
      if (localStorage.getItem(MAK)) return
    } catch { return }

    let popup
    try {
      popup = await settingsService.getPopup()
    } catch { return }
    if (!popup.enabled || !popup.title) return

    // Pa sou paj kote vizitè a ap fè yon bagay serye (peye, konekte, admin).
    const pajTranki = () => {
      const h = window.location.hash.replace('#', '')
      return !/^(admin|checkout|order|modpas)/.test(h)
    }

    const louvri = () => {
      if (document.getElementById('signupPopup')) return
      try { if (localStorage.getItem(MAK)) return } catch { return }
      this.openSignupPopup(popup!, MAK)
    }

    setTimeout(() => {
      if (pajTranki()) return louvri()
      // Vizitè a sou checkout/admin lè tan an rive: nou tann li retounen sou
      // yon paj trankil olye nou abandone nèt.
      const tann = () => {
        if (!pajTranki()) return
        window.removeEventListener('hashchange', tann)
        setTimeout(() => { if (pajTranki()) louvri() }, 1500)
      }
      window.addEventListener('hashchange', tann)
    }, Math.max(0, Number(popup.delay_seconds) || 0) * 1000)
  }

  private openSignupPopup(popup: import('../lib/types').PopupSettings, MAK: string): void {
    const overlay = document.createElement('div')
    overlay.className = 'signup-popup-overlay'
    overlay.id = 'signupPopup'
    overlay.innerHTML = `
      <div class="signup-popup" role="dialog" aria-modal="true" aria-labelledby="signupPopupTitle">
        <button type="button" class="signup-popup-close" aria-label="Close">×</button>
        <div class="signup-popup-body">
          <h2 id="signupPopupTitle">${escapeHtml(popup.title)}</h2>
          ${popup.text ? `<p class="signup-popup-text">${escapeHtml(popup.text)}</p>` : ''}
          <form class="signup-popup-form" novalidate>
            <input type="text" name="first_name" placeholder="FIRST NAME" autocomplete="given-name" maxlength="60">
            <input type="email" name="email" placeholder="EMAIL" autocomplete="email" required maxlength="254">
            <input type="text" name="birthday" placeholder="BIRTHDAY MM/DD (OPTIONAL)" inputmode="numeric" maxlength="5">
            <p class="signup-popup-legal">By signing up you agree to receive marketing emails from NOUIE. You can unsubscribe at any time. <a href="#privacy">Privacy Policy</a> &amp; <a href="#terms">Terms</a>.</p>
            <button type="submit" class="signup-popup-submit">${escapeHtml(popup.button || 'CONTINUE')}</button>
            <p class="signup-popup-error" role="alert"></p>
          </form>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    document.body.classList.add('signup-popup-open')

    const close = () => {
      try { if (!localStorage.getItem(MAK)) localStorage.setItem(MAK, 'closed') } catch { /* mòd prive */ }
      overlay.remove()
      document.body.classList.remove('signup-popup-open')
      document.removeEventListener('keydown', onKey)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    overlay.querySelector('.signup-popup-close')?.addEventListener('click', close)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
    // Lyen Privacy/Terms yo: fèmen fenèt la pou paj la vizib.
    overlay.querySelectorAll('.signup-popup-legal a').forEach(a => a.addEventListener('click', close))

    const form = overlay.querySelector('.signup-popup-form') as HTMLFormElement
    const bday = form.elements.namedItem('birthday') as HTMLInputElement
    // 0415 → 04/15 pandan moun nan ap tape.
    bday.addEventListener('input', () => {
      const d = bday.value.replace(/\D/g, '').slice(0, 4)
      bday.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
    })

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const errEl = form.querySelector('.signup-popup-error') as HTMLElement
      const btn = form.querySelector('.signup-popup-submit') as HTMLButtonElement
      const fd = new FormData(form)
      const email = String(fd.get('email') || '').trim().toLowerCase()
      const first_name = String(fd.get('first_name') || '').trim() || null
      const birthday = String(fd.get('birthday') || '').trim() || null

      errEl.textContent = ''
      if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) {
        errEl.textContent = 'PLEASE ENTER A VALID EMAIL.'
        return
      }
      if (birthday && !/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/.test(birthday)) {
        errEl.textContent = 'BIRTHDAY FORMAT: MM/DD (E.G. 04/15).'
        return
      }

      btn.disabled = true
      btn.textContent = '...'
      const { error } = await supabase.from('newsletter_subscribers').insert({ email, first_name, birthday, source: 'popup' })
      // 23505 = imèl la deja enskri: nou ba l kòd la kanmenm.
      if (error && error.code !== '23505') {
        console.error('Popup signup error:', error)
        btn.disabled = false
        btn.textContent = popup.button || 'CONTINUE'
        errEl.textContent = 'SOMETHING WENT WRONG — PLEASE TRY AGAIN.'
        return
      }

      try {
        localStorage.setItem(MAK, 'joined')
        if (popup.code) localStorage.setItem('nouie_welcome_code', popup.code)
      } catch { /* mòd prive */ }

      const body = overlay.querySelector('.signup-popup-body') as HTMLElement
      body.innerHTML = `
        <h2>${escapeHtml(popup.success_title || 'THANK YOU')}</h2>
        ${popup.code ? `
          ${popup.success_text ? `<p class="signup-popup-text">${escapeHtml(popup.success_text)}</p>` : ''}
          <div class="signup-popup-code">${escapeHtml(popup.code)}</div>
          <button type="button" class="signup-popup-submit" id="signupCopyCode">COPY CODE</button>
        ` : `<p class="signup-popup-text">YOU ARE ON THE LIST.</p>`}
        <button type="button" class="signup-popup-link" id="signupShop">CONTINUE SHOPPING</button>
      `
      body.querySelector('#signupCopyCode')?.addEventListener('click', async (ev) => {
        const b = ev.currentTarget as HTMLButtonElement
        try { await navigator.clipboard.writeText(popup.code) } catch { /* pa grav: kòd la vizib */ }
        b.textContent = 'COPIED'
      })
      body.querySelector('#signupShop')?.addEventListener('click', close)
    })

    // Fokis otomatik sèlman sou òdinatè: sou telefòn li ta louvri klavye a
    // sou vizitè a anvan li menm deside si li enterese.
    if (window.matchMedia('(hover: hover)').matches) {
      (form.elements.namedItem('first_name') as HTMLInputElement)?.focus({ preventScroll: true })
    }
  }

  private renderCookieBanner(): void {
    if (localStorage.getItem('nouie_cookie_consent')) return

    const banner = document.createElement('div')
    banner.className = 'cookie-banner'
    banner.id = 'cookieBanner'
    banner.innerHTML = `
      <div class="cookie-text">
        <span>WE USE ESSENTIAL COOKIES AND LOCAL STORAGE TO MAINTAIN YOUR CART AND DELIVER TECHNICAL PRECISION.</span>
        <a href="#privacy" class="cookie-policy-link">LEARN MORE</a>
      </div>
      <div class="cookie-actions">
        <button class="btn-cookie-decline" id="cookieDecline">DECLINE</button>
        <button class="btn-cookie-accept" id="cookieAccept">ACCEPT</button>
      </div>
    `
    document.body.appendChild(banner)
    // Banyè a fikse anba ekran an: san plas anba pye paj la, li chita sou
    // dènye ranje a epi li vale klik sou lyen yo (INSTAGRAM).
    document.body.classList.add('has-cookie-banner')

    // Wotè banyè a chanje ak lajè ekran an (tèks la vlope sou telefòn), donk
    // nou mezire l olye nou devine yon valè fiks.
    const syncHeight = () =>
      document.body.style.setProperty('--cookie-banner-h', `${banner.offsetHeight}px`)
    syncHeight()
    window.addEventListener('resize', syncHeight)

    const dismiss = (choice: 'accepted' | 'declined') => {
      localStorage.setItem('nouie_cookie_consent', choice)
      banner.remove()
      window.removeEventListener('resize', syncHeight)
      document.body.classList.remove('has-cookie-banner')
      document.body.style.removeProperty('--cookie-banner-h')
    }

    document.getElementById('cookieAccept')?.addEventListener('click', () => dismiss('accepted'))
    document.getElementById('cookieDecline')?.addEventListener('click', () => dismiss('declined'))
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

    // Newsletter form
    document.querySelector('.newsletter-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const form = e.target as HTMLFormElement
      const input = form.querySelector('.newsletter-input') as HTMLInputElement
      const email = input.value.trim()
      if (!email) return

      const submitBtn = form.querySelector('.btn-newsletter-submit') as HTMLButtonElement
      submitBtn.disabled = true
      submitBtn.textContent = '...'

      const { error } = await supabase.from('newsletter_subscribers').insert({ email })

      if (error && error.code !== '23505') {
        console.error('Newsletter signup error:', error)
        submitBtn.textContent = 'TRY AGAIN'
        setTimeout(() => { submitBtn.textContent = 'JOIN'; submitBtn.disabled = false }, 2000)
        return
      }

      submitBtn.textContent = 'JOINED'
      input.value = ''
      setTimeout(() => { submitBtn.textContent = 'JOIN'; submitBtn.disabled = false }, 2000)
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
          <div class="cart-item-details">SIZE: ${item.size}</div>
          <div class="cart-item-qty">
            <button class="qty-btn qty-decrease" data-id="${item.id}" data-size="${item.size}">&minus;</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn qty-increase" data-id="${item.id}" data-size="${item.size}">+</button>
          </div>
        </div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
        <button class="cart-item-remove" data-index="${index}">&times;</button>
      </div>
    `).join('')

    if (cartTotalEl) cartTotalEl.textContent = `$${total.toFixed(2)} USD`
    if (cartCountEl) cartCountEl.textContent = String(totalQty)

    // Add remove handlers
    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0')
        cartStore.removeItem(index)
      })
    })

    // Add quantity handlers
    cartItemsEl.querySelectorAll('.qty-increase').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement
        cartStore.updateItemQty(target.getAttribute('data-id') || '', target.getAttribute('data-size') || '', 1)
      })
    })
    cartItemsEl.querySelectorAll('.qty-decrease').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement
        cartStore.updateItemQty(target.getAttribute('data-id') || '', target.getAttribute('data-size') || '', -1)
      })
    })
  }

  setOverlayVisible(_visible: boolean): void {
    // Legacy overlay no longer used; homepage now part of scrollable content
  }
}
