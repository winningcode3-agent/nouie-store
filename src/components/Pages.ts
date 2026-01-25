// Pages Component - Renders all page content

import { supabase } from '../lib/supabase'
import { cartStore } from '../lib/store'
import { catalogs, technicalMetadata, archiveSeasons } from '../lib/data'
import type { Product, TechnicalMetadata } from '../lib/types'

export class Pages {
  private contentDiv: HTMLElement | null = null

  getContentDiv(): HTMLElement {
    if (!this.contentDiv) {
      this.contentDiv = document.createElement('div')
      this.contentDiv.id = 'page-content'
      document.body.appendChild(this.contentDiv)
    }
    return this.contentDiv
  }

  async render(page: string): Promise<void> {
    const contentDiv = this.getContentDiv()

    if (page === 'home') {
      contentDiv.innerHTML = ''
      contentDiv.className = ''
      return
    }

    contentDiv.className = `page-container page-${page}`

    switch (page) {
      case 'collection':
        await this.renderCollection(contentDiv)
        break
      case 'archive':
        this.renderArchive(contentDiv)
        break
      case 'studio':
        this.renderStudio(contentDiv)
        break
      case 'lookbook':
        this.renderLookbook(contentDiv)
        break
      case 'checkout':
        this.renderCheckout(contentDiv)
        break
      default:
        if (page.startsWith('product-')) {
          const productId = page.replace('product-', '')
          const product = catalogs.find(c => c.id === productId)
          if (product) {
            this.renderProductDetail(contentDiv, product)
          } else {
            contentDiv.innerHTML = '<div class="page-header"><h1>PRODUCT NOT FOUND</h1></div>'
          }
        }
    }
  }

  private async renderCollection(contentDiv: HTMLElement): Promise<void> {
    contentDiv.innerHTML = `
      <div class="collection-page">
        <div class="collection-header">
          <h1 class="glitch" data-text="COLLECTION // SS26">COLLECTION // SS26</h1>
          <p>UNIT IDENTIFICATION EXPERIMENT // CORE SERIES</p>
        </div>
        <div id="collection-grid" class="collection-grid">
          <div class="loading-state">
            <div class="scanner-bar"></div>
            ACCESSING SECURE DATASTORE...
          </div>
        </div>
        <div class="collection-footer">
          <p>© 2026 NO UIE / ALL RIGHTS RESERVED</p>
        </div>
      </div>
    `

    const grid = document.getElementById('collection-grid')
    if (!grid) return

    try {
      const { data: dbCatalogs, error } = await supabase
        .from('collections')
        .select('*')
        .order('id', { ascending: true })

      if (error || !dbCatalogs || dbCatalogs.length === 0) {
        console.log('Using local fallback data')
        this.renderCatalogGrid(grid, catalogs, technicalMetadata)
      } else {
        console.log('Using Supabase data')
        this.renderCatalogGrid(grid, dbCatalogs, technicalMetadata)
      }
    } catch {
      this.renderCatalogGrid(grid, catalogs, technicalMetadata)
    }

    // Add click listeners
    setTimeout(() => {
      grid.querySelectorAll('.catalog-section').forEach((section, index) => {
        section.addEventListener('click', () => {
          const catId = catalogs[index]?.id
          if (catId) window.location.hash = `#product-${catId}`
        })
          ; (section as HTMLElement).style.cursor = 'pointer'
      })
    }, 100)
  }

  private renderCatalogGrid(container: HTMLElement, cats: Product[], metadata: Record<string, TechnicalMetadata>): void {
    container.innerHTML = cats.map(cat => {
      const meta = metadata[cat.id] || { material: 'UNKNOWN', weight: 'N/A', zone: 'UNDEFINED' }
      return `
        <div class="catalog-section" data-aos="fade-up">
          <div class="catalog-meta">
            <div class="meta-main">
              <span class="cat-id">${cat.id}</span>
              <span class="cat-sep">//</span>
              <span class="cat-name">${cat.name}</span>
            </div>
            <div class="meta-details">
              <span>MAT: ${meta.material}</span>
              <span>WGT: ${meta.weight}</span>
              <span>ZONE: ${meta.zone}</span>
            </div>
          </div>
          <div class="catalog-images">
            ${cat.images.map((img: string) => `
              <div class="collection-item">
                <div class="image-wrapper">
                  <img src="/assets/${img}" alt="${cat.name}" loading="lazy">
                  <div class="image-overlay">
                    <div class="scanline"></div>
                    <div class="item-id-tag">${cat.id}_${Math.random().toString(36).substr(2, 4).toUpperCase()}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `
    }).join('')
  }

  private renderProductDetail(contentDiv: HTMLElement, product: Product): void {
    const meta = technicalMetadata[product.id] || { material: 'UNKNOWN', weight: 'N/A', zone: 'UNDEFINED' }

    contentDiv.innerHTML = `
      <div class="product-detail-page">
        <a href="#collection" class="back-link">&larr; BACK TO COLLECTION</a>
        
        <div class="product-layout">
          <div class="product-gallery">
            <div class="main-image">
              <img id="mainProductImg" src="/assets/${product.images[0]}" alt="${product.name}">
              <div class="scanline-overlay"></div>
            </div>
            <div class="thumbnail-strip">
              ${product.images.map((img: string, i: number) => `
                <div class="thumbnail ${i === 0 ? 'active' : ''}" data-img="${img}">
                  <img src="/assets/${img}" alt="${product.name} view ${i + 1}">
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="product-info">
            <div class="product-id-badge">${product.id}</div>
            <h1 class="product-title">${product.name}</h1>
            <div class="product-season">${product.season}</div>
            <div class="product-price">$${product.price}.00 USD</div>
            
            <p class="product-description">${product.description}</p>
            
            <div class="product-specs">
              <div class="spec-row"><span>MATERIAL</span><span>${meta.material}</span></div>
              <div class="spec-row"><span>WEIGHT</span><span>${meta.weight}</span></div>
              <div class="spec-row"><span>ZONE</span><span>${meta.zone}</span></div>
            </div>
            
            <div class="size-selector">
              <label>SELECT SIZE</label>
              <div class="size-options">
                ${product.sizes.map((size: string) => `
                  <button class="size-btn" data-size="${size}">${size}</button>
                `).join('')}
              </div>
            </div>
            
            <div class="product-actions">
              <button class="btn-add-cart" id="addToCartBtn">ADD TO CART</button>
              <button class="btn-buy-now" id="buyNowBtn">BUY NOW</button>
            </div>
            
            <div class="cart-feedback" id="cartFeedback"></div>
          </div>
        </div>
      </div>
    `

    this.initProductDetailHandlers(product)
  }

  private initProductDetailHandlers(product: Product): void {
    const contentDiv = this.getContentDiv()

    // Thumbnail click
    contentDiv.querySelectorAll('.thumbnail').forEach(thumb => {
      thumb.addEventListener('click', () => {
        contentDiv.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'))
        thumb.classList.add('active')
        const imgName = thumb.getAttribute('data-img')
        const mainImg = document.getElementById('mainProductImg') as HTMLImageElement
        if (mainImg && imgName) mainImg.src = `/assets/${imgName}`
      })
    })

    // Size selector
    let selectedSize = ''
    contentDiv.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        contentDiv.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'))
        btn.classList.add('selected')
        selectedSize = btn.getAttribute('data-size') || ''
      })
    })

    // Add to cart
    document.getElementById('addToCartBtn')?.addEventListener('click', () => {
      if (!selectedSize) {
        this.showFeedback('PLEASE SELECT A SIZE', 'error')
        return
      }
      cartStore.addItem(product.id, product.name, selectedSize, product.price)
      this.showFeedback('ADDED TO CART', 'success')
    })

    // Buy now
    document.getElementById('buyNowBtn')?.addEventListener('click', () => {
      if (!selectedSize) {
        this.showFeedback('PLEASE SELECT A SIZE', 'error')
        return
      }
      cartStore.addItem(product.id, product.name, selectedSize, product.price)
      window.location.hash = '#checkout'
    })
  }

  private showFeedback(message: string, type: 'success' | 'error'): void {
    const feedback = document.getElementById('cartFeedback')
    if (feedback) {
      feedback.textContent = message
      feedback.className = `cart-feedback ${type}`
      setTimeout(() => {
        feedback.textContent = ''
        feedback.className = 'cart-feedback'
      }, 3000)
    }
  }

  private renderArchive(contentDiv: HTMLElement): void {
    contentDiv.innerHTML = `
      <div class="archive-page">
        <div class="page-header">
          <h1 class="glitch" data-text="ARCHIVE_LOG">ARCHIVE_LOG</h1>
          <p>PAST SEASON EVOLUTION // TAGGED @_NOUIE</p>
        </div>
        
        <div class="archive-grid">
          ${archiveSeasons.map(season => `
            <div class="archive-season-card" data-season="${season.id}">
              <div class="archive-images">
                ${season.images.map(img => `
                  <div class="archive-img"><img src="/assets/${img}" alt="${season.title}"></div>
                `).join('')}
              </div>
              <div class="archive-content">
                <div class="archive-year-badge">${season.year}</div>
                <h2 class="archive-season-title">${season.title}</h2>
                <p class="archive-description">${season.description}</p>
                <div class="archive-highlights">
                  ${season.highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
                </div>
                <div class="archive-instagram">
                  <a href="https://www.instagram.com/_nouie/tagged/" target="_blank" rel="noopener">
                    VIEW ON INSTAGRAM ${season.instagramTag}
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="archive-footer">
          <p>FOLLOW <a href="https://www.instagram.com/_nouie/" target="_blank">@_NOUIE</a> FOR LATEST DROPS</p>
        </div>
      </div>
    `
  }

  private renderStudio(contentDiv: HTMLElement): void {
    contentDiv.innerHTML = `
      <div class="page-header">
        <h1>STUDIO_UNIT</h1>
        <p>DESIGN PHILOSOPHY & PROCESS</p>
      </div>
      <div class="studio-content">
        <section>
          <h2 class="glitch" data-text="WE MOVE FORWARD.">WE MOVE FORWARD.</h2>
          <p>NOUIE is an industrial design unit focused on the evolution of streetwear through technical precision and architectural symmetry. Our process is rooted in the intersection of utilitarian function and digital brutalism.</p>
        </section>
        <section class="philosophy-grid">
          <div class="phil-item">
            <h3>SYSTEM_01: MODULARITY</h3>
            <p>Every unit is designed to integrate seamlessly within the core ecosystem, allowing for infinite reconfiguration of form and utility.</p>
          </div>
          <div class="phil-item">
            <h3>SYSTEM_02: MATERIALITY</h3>
            <p>We source high-performance textiles that balance environmental resistance with aesthetic clarity.</p>
          </div>
        </section>
      </div>
    `
  }

  private renderLookbook(contentDiv: HTMLElement): void {
    const looks = [
      { id: 'LOOK_001', zone: 'INDUSTRIAL_ZONE_04', desc: 'INDUSTRIAL WAFFLE UNIT', image: 'cat1_1.jpg', product: 'CAT01' },
      { id: 'LOOK_002', zone: 'LOGISTICS_HUB_B', desc: 'NO BRAKE NO TURN UNIT', image: 'cat2_1.jpg', product: 'CAT02' },
      { id: 'LOOK_003', zone: 'VOID_SECTOR', desc: 'NO U TURN MESH UNIT', image: 'cat3_1.png', product: 'CAT03' },
      { id: 'LOOK_004', zone: 'DATA_CENTER_01', desc: 'INDUSTRIAL WAFFLE UNIT', image: 'cat1_2.jpg', product: 'CAT01' },
      { id: 'LOOK_005', zone: 'NORTH_TERMINAL', desc: 'NO BRAKE SYSTEM V2', image: 'cat2_2.jpg', product: 'CAT02' },
      { id: 'LOOK_006', zone: 'SOUTH_STORAGE', desc: 'MESH INTEGRATION', image: 'cat3_2.png', product: 'CAT03' }
    ]

    contentDiv.innerHTML = `
      <div class="lookbook-page">
        <div class="page-header">
          <h1 class="glitch" data-text="LOOKBOOK_SS26">LOOKBOOK_SS26</h1>
          <p>CINEMATIC EVOLUTION OF FORM</p>
        </div>
        <div class="lookbook-grid">
          ${looks.map(look => `
            <div class="lookbook-item" data-product="${look.product}">
              <div class="lookbook-image">
                <img src="/assets/${look.image}" alt="${look.desc}" loading="lazy">
                <div class="lookbook-overlay">
                  <div class="scanline"></div>
                </div>
              </div>
              <div class="lookbook-content">
                <div class="look-id">${look.id}</div>
                <div class="look-zone">${look.zone}</div>
                <div class="look-desc">${look.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="lookbook-cta">
          <a href="#collection" class="btn-shop-collection">SHOP THE COLLECTION</a>
        </div>
      </div>
    `

    // Add click handlers to navigate to product
    contentDiv.querySelectorAll('.lookbook-item').forEach(item => {
      item.addEventListener('click', () => {
        const productId = item.getAttribute('data-product')
        if (productId) window.location.hash = `#product-${productId}`
      })
        ; (item as HTMLElement).style.cursor = 'pointer'
    })
  }

  private renderCheckout(contentDiv: HTMLElement): void {
    const items = cartStore.getItems()

    if (items.length === 0) {
      contentDiv.innerHTML = `
        <div class="checkout-page">
          <div class="page-header">
            <h1>CHECKOUT</h1>
            <p>YOUR CART IS EMPTY</p>
          </div>
          <a href="#collection" class="btn-back-shop">CONTINUE SHOPPING</a>
        </div>
      `
      return
    }

    const total = cartStore.getTotal()

    contentDiv.innerHTML = `
      <div class="checkout-page">
        <div class="page-header">
          <h1 class="glitch" data-text="CHECKOUT">CHECKOUT</h1>
          <p>COMPLETE YOUR ORDER</p>
        </div>
        
        <div class="checkout-layout">
          <div class="checkout-form-section">
            <h2>SHIPPING INFORMATION</h2>
            <form id="checkoutForm" class="checkout-form">
              <div class="form-group">
                <label>FULL NAME *</label>
                <input type="text" id="customerName" required placeholder="Enter your full name">
              </div>
              <div class="form-group">
                <label>EMAIL *</label>
                <input type="email" id="customerEmail" required placeholder="your@email.com">
              </div>
              <div class="form-group">
                <label>PHONE *</label>
                <input type="tel" id="customerPhone" required placeholder="+1 (555) 000-0000">
              </div>
              <div class="form-group">
                <label>SHIPPING ADDRESS *</label>
                <textarea id="shippingAddress" required placeholder="Street address, City, State, ZIP"></textarea>
              </div>
              <div class="form-group">
                <label>ORDER NOTES (optional)</label>
                <textarea id="orderNotes" placeholder="Special instructions..."></textarea>
              </div>
            </form>
          </div>
          
          <div class="checkout-summary-section">
            <h2>ORDER SUMMARY</h2>
            <div class="order-items">
              ${items.map(item => `
                <div class="order-item">
                  <div class="order-item-name">${item.name}</div>
                  <div class="order-item-details">SIZE: ${item.size} × ${item.qty}</div>
                  <div class="order-item-price">$${item.price * item.qty}.00</div>
                </div>
              `).join('')}
            </div>
            <div class="order-totals">
              <div class="order-total-row">
                <span>SUBTOTAL</span>
                <span>$${total}.00</span>
              </div>
              <div class="order-total-row">
                <span>SHIPPING</span>
                <span>FREE</span>
              </div>
              <div class="order-total-row total-final">
                <span>TOTAL</span>
                <span>$${total}.00 USD</span>
              </div>
            </div>
            <button type="submit" class="btn-place-order" id="placeOrderBtn">PLACE ORDER</button>
            <div id="orderStatus" class="order-status"></div>
          </div>
        </div>
      </div>
    `

    document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
      const form = document.getElementById('checkoutForm') as HTMLFormElement
      if (!form.checkValidity()) {
        form.reportValidity()
        return
      }
      await this.submitOrder()
    })
  }

  private async submitOrder(): Promise<void> {
    const statusEl = document.getElementById('orderStatus')
    const btnEl = document.getElementById('placeOrderBtn') as HTMLButtonElement

    if (statusEl) statusEl.innerHTML = '<div class="loading">PROCESSING ORDER...</div>'
    if (btnEl) btnEl.disabled = true

    const orderData = {
      customer_name: (document.getElementById('customerName') as HTMLInputElement).value,
      customer_email: (document.getElementById('customerEmail') as HTMLInputElement).value,
      customer_phone: (document.getElementById('customerPhone') as HTMLInputElement).value,
      shipping_address: (document.getElementById('shippingAddress') as HTMLTextAreaElement).value,
      notes: (document.getElementById('orderNotes') as HTMLTextAreaElement).value,
      items: cartStore.getItems(),
      total: cartStore.getTotal(),
      status: 'pending'
    }

    try {
      const { data, error } = await supabase.from('orders').insert([orderData]).select()

      if (error) {
        console.error('Supabase order error:', error)
        // Show error but still proceed (demo mode)
        if (statusEl) {
          statusEl.innerHTML = '<div class="warning">DATABASE UNAVAILABLE - ORDER SAVED LOCALLY</div>'
        }
        // Save to localStorage as backup
        const localOrders = JSON.parse(localStorage.getItem('nouie_orders') || '[]')
        localOrders.push({ ...orderData, id: Date.now(), created_at: new Date().toISOString() })
        localStorage.setItem('nouie_orders', JSON.stringify(localOrders))

        setTimeout(() => this.showOrderSuccess(), 1500)
      } else {
        console.log('Order saved to Supabase:', data)
        this.showOrderSuccess()
      }
    } catch (err) {
      console.warn('Order submission failed:', err)
      // Fallback: Save to localStorage
      const localOrders = JSON.parse(localStorage.getItem('nouie_orders') || '[]')
      localOrders.push({ ...orderData, id: Date.now(), created_at: new Date().toISOString() })
      localStorage.setItem('nouie_orders', JSON.stringify(localOrders))

      if (statusEl) {
        statusEl.innerHTML = '<div class="warning">OFFLINE MODE - ORDER SAVED LOCALLY</div>'
      }
      setTimeout(() => this.showOrderSuccess(), 1500)
    }
  }

  private showOrderSuccess(): void {
    cartStore.clear()

    const contentDiv = this.getContentDiv()
    contentDiv.innerHTML = `
      <div class="order-success">
        <div class="success-icon">✓</div>
        <h1>ORDER CONFIRMED</h1>
        <p>Thank you for your order. You will receive a confirmation email shortly.</p>
        <p class="order-id">ORDER REF: ${Date.now().toString(36).toUpperCase()}</p>
        <a href="#collection" class="btn-continue">CONTINUE SHOPPING</a>
      </div>
    `
  }
}
