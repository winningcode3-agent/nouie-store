// Pages Component - Renders all page content

import { supabase } from '../lib/supabase'
import { cartStore } from '../lib/store'
import { catalogs, archiveSeasons } from '../lib/data'
import type { Product, Collection } from '../lib/types'
import { SEO } from '../lib/seo'
import { settingsService } from '../lib/settings'
import { renderSafeMarkdown, escapeHtml } from '../lib/markdown'

export class Pages {
  private contentDiv: HTMLElement | null = null

  getContentDiv(): HTMLElement {
    if (!this.contentDiv) {
      // Check if UI.init already created the div
      const existing = document.getElementById('page-content')
      if (existing) {
        this.contentDiv = existing
      } else {
        this.contentDiv = document.createElement('div')
        this.contentDiv.id = 'page-content'
        document.body.appendChild(this.contentDiv)
      }
    }
    return this.contentDiv
  }

  private async renderLegalPage(contentDiv: HTMLElement, slug: string, defaultTitle: string, fallbackMarkdown: string): Promise<void> {
    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>${defaultTitle}</h1>
          <p class="legal-loading">SYNCING DOCUMENT DATA...</p>
        </div>
        <div class="legal-content">
          <div class="loading-state">LOADING CONTENT...</div>
        </div>
      </div>
    `

    let pageTitle = defaultTitle
    let pageMarkdown = fallbackMarkdown
    let updatedAt: string | null = null

    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (!error && data) {
        pageTitle = data.title || defaultTitle
        pageMarkdown = data.body || fallbackMarkdown
        updatedAt = data.updated_at
      }
    } catch (e) {
      console.warn(`Could not load page ${slug}, using fallback:`, e)
    }

    const dateStr = updatedAt ? new Date(updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }).toUpperCase() : 'CURRENT'

    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>${escapeHtml(pageTitle)}</h1>
          <p>LAST UPDATED: ${dateStr}</p>
        </div>
        <div class="legal-content">
          ${renderSafeMarkdown(pageMarkdown)}
        </div>
      </div>
    `
  }

  private async renderShipping(contentDiv: HTMLElement): Promise<void> {
    const shippingConf = await settingsService.getShipping()
    const defaultBody = `# ORDER PROCESSING
All orders are processed within 2-4 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.

Please note that during high-volume periods or new releases, processing times may be slightly extended.

# DOMESTIC SHIPPING (USA)
We offer domestic standard and express shipping options across the United States.

- **STANDARD (${shippingConf.standard_days} BUSINESS DAYS)**: $${shippingConf.standard.toFixed(2)} (FREE STANDARD SHIPPING ON DOMESTIC ORDERS OVER $${shippingConf.free_threshold.toFixed(2)})
- **EXPRESS (${shippingConf.express_days} BUSINESS DAYS)**: $${shippingConf.express.toFixed(2)}

# INTERNATIONAL SHIPPING
We ship worldwide. Shipping charges for your order will be calculated and displayed at checkout.

- **CANADA**: 7-14 business days
- **EUROPE / ASIA**: 10-21 business days

**Customs, Duties, and Taxes:** NOUIE is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer.

# TRACKING YOUR ORDER
When your order has shipped, you will receive an email notification from us which will include a tracking number you can use to check its status.`

    await this.renderLegalPage(contentDiv, 'shipping', 'SHIPPING POLICY', defaultBody)
  }

  private async renderReturns(contentDiv: HTMLElement): Promise<void> {
    const defaultBody = `# RETURN POLICY
We want you to be completely satisfied with your purchase. If you are not satisfied, you may return your item(s) within 14 days of delivery for an exchange or store credit.

**PLEASE NOTE:** All returns must be in their original condition—unworn, unwashed, and with all tags attached. Items that do not meet these criteria will be denied.

# EXCHANGES
We offer exchanges for different sizes of the same item, subject to availability. If the desired size is out of stock, a store credit will be issued.

# RETURN PROCESS
1. Email our support desk with your order number and the item(s) you wish to return.
2. Once approved, you will receive return instructions and address.
3. Pack your item(s) securely and ship using a trackable method.`

    await this.renderLegalPage(contentDiv, 'returns', 'RETURNS & EXCHANGES', defaultBody)
  }

  private async renderPrivacy(contentDiv: HTMLElement): Promise<void> {
    const defaultBody = `# PRIVACY POLICY
NOUIE values and respects the privacy of our customers. This privacy notice outlines how your personal information is collected, used, and shared when you visit or make a purchase from our store.

# INFORMATION WE COLLECT
When you place an order, we collect certain details including your name, billing address, shipping address, email address, and phone number to fulfill and deliver your transaction.

# USE OF INFORMATION
We use your information strictly to process and ship orders, communicate with you regarding order status, and screen orders for potential risk or fraudulent activity.

# DATA SECURITY
We employ industry-standard encryption and security protocols to safeguard your personal data. We do not store full payment card numbers on our local systems.`

    await this.renderLegalPage(contentDiv, 'privacy', 'PRIVACY POLICY', defaultBody)
  }

  private async renderTerms(contentDiv: HTMLElement): Promise<void> {
    const defaultBody = `# TERMS OF SERVICE
By visiting our site and/or purchasing from NOUIE, you engage in our service and agree to be bound by the following terms and conditions.

# GENERAL CONDITIONS
We reserve the right to refuse service to anyone for any reason at any time. Prices for our products are subject to change without notice.

# ACCURACY OF BILLING & ORDERS
You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store.

# INTELLECTUAL PROPERTY
All graphics, designs, logos, product names, and content appearing on this site are the exclusive property of NOUIE.`

    await this.renderLegalPage(contentDiv, 'terms', 'TERMS OF SERVICE', defaultBody)
  }

  private async renderContact(contentDiv: HTMLElement): Promise<void> {
    const business = await settingsService.getBusiness()
    const supportEmail = business.email_support || 'support@nouie.com'
    const studioEmail = business.email_studio || 'studio@nouie.com'

    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>CONTACT</h1>
          <p>GET IN TOUCH WITH THE STUDIO.</p>
        </div>
        
        <div class="contact-layout">
          <div class="contact-info-grid">
            <div class="contact-card">
              <h3>CUSTOMER SUPPORT</h3>
              <p>FOR ORDER INQUIRIES, RETURNS, OR GENERAL QUESTIONS:</p>
              <a href="mailto:${supportEmail}" class="contact-link">${supportEmail.toUpperCase()}</a>
            </div>
            
            <div class="contact-card">
              <h3>WHOLESALE & STUDIO</h3>
              <p>FOR BUSINESS INQUIRIES OR PARTNERSHIPS:</p>
              <a href="mailto:${studioEmail}" class="contact-link">${studioEmail.toUpperCase()}</a>
            </div>
          </div>

          <form class="contact-form" id="contactForm">
            <div class="form-row">
              <div class="contact-form-group">
                <label>NAME</label>
                <input type="text" id="contactName" placeholder="YOUR NAME" required>
              </div>
              <div class="contact-form-group">
                <label>EMAIL</label>
                <input type="email" id="contactEmail" placeholder="YOUR EMAIL ADDRESS" required>
              </div>
            </div>

            <div class="contact-form-group">
              <label>SUBJECT</label>
              <select id="contactSubject" required>
                <option value="" disabled selected>SELECT A REASON</option>
                <option value="order">ORDER STATUS</option>
                <option value="return">RETURNS & EXCHANGES</option>
                <option value="product">PRODUCT INFORMATION</option>
                <option value="other">OTHER</option>
              </select>
            </div>

            <div class="contact-form-group">
              <label>MESSAGE</label>
              <textarea id="contactMessage" placeholder="HOW CAN WE HELP YOU?" rows="6" required></textarea>
            </div>

            <button type="submit" class="btn-contact-submit">TRANSMIT MESSAGE</button>
            <div id="contactFeedback"></div>
          </form>
        </div>
      </div>
    `

    // Add form handling
    const form = document.getElementById('contactForm') as HTMLFormElement
    const feedback = document.getElementById('contactFeedback')
    if (form && feedback) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        feedback.innerHTML = '<div class="success-msg">TRANSMITTING...</div>'

        const name = (document.getElementById('contactName') as HTMLInputElement).value
        const email = (document.getElementById('contactEmail') as HTMLInputElement).value
        const subject = (document.getElementById('contactSubject') as HTMLSelectElement).value
        const message = (document.getElementById('contactMessage') as HTMLTextAreaElement).value

        const { error } = await supabase.from('contact_messages').insert({ name, email, subject, message })

        if (error) {
          console.error('Contact form error:', error)
          feedback.innerHTML = '<div class="warning">MESSAGE COULD NOT BE SENT — TRY AGAIN OR EMAIL SUPPORT@NOUIE.COM DIRECTLY.</div>'
          return
        }

        feedback.innerHTML = '<div class="success-msg">MESSAGE SUCCESSFULLY RECEIVED BY THE STUDIO.</div>'
        form.reset()
      })
    }
  }
  async render(page: string): Promise<void> {
    const contentDiv = this.getContentDiv()

    // Default Organization Schema for all pages
    SEO.injectJSONLD(SEO.generateOrgSchema())

    if (page === 'home') {
      SEO.updateMeta('HOME', 'Evolution of streetwear through technical precision and architectural symmetry.')
      await this.renderHome(contentDiv)
      return
    }

    contentDiv.className = `page-container page-${page}`

    switch (page) {
      case 'collection':
        SEO.updateMeta('COLLECTION', 'Browse the latest NOUIE technical streetwear collections.')
        await this.renderCollection(contentDiv)
        break
      case 'archive':
        SEO.updateMeta('ARCHIVE', 'Explore past NOUIE seasons and design evolutions.')
        await this.renderArchive(contentDiv)
        break
      case 'studio':
        SEO.updateMeta('STUDIO', 'Inside the NOUIE design philosophy and technical process.')
        this.renderStudio(contentDiv)
        break
      case 'lookbook':
        SEO.updateMeta('LOOKBOOK', 'Visual narratives and styling from the NOUIE universe.')
        this.renderLookbook(contentDiv)
        break
      case 'checkout':
        SEO.updateMeta('CHECKOUT', 'Secure checkout for your NOUIE technical gear.')
        await this.renderCheckout(contentDiv)
        break
      case 'admin':
        SEO.updateMeta('ADMIN', 'NOUIE internal management system.')
        await this.renderAdmin(contentDiv)
        break
      case 'shipping':
        SEO.updateMeta('SHIPPING', 'Domestic and international shipping policies.')
        this.renderShipping(contentDiv)
        break
      case 'returns':
        SEO.updateMeta('RETURNS', 'Return and exchange information for NOUIE products.')
        this.renderReturns(contentDiv)
        break
      case 'privacy':
        SEO.updateMeta('PRIVACY', 'How we manage and protect your data.')
        this.renderPrivacy(contentDiv)
        break
      case 'terms':
        SEO.updateMeta('TERMS', 'Terms of service and governing policies for NOUIE.')
        this.renderTerms(contentDiv)
        break
      case 'contact':
        SEO.updateMeta('CONTACT', 'Get in touch with the NOUIE studio for support or inquiries.')
        this.renderContact(contentDiv)
        break
      default:
        if (page.startsWith('admin')) {
          await this.renderAdmin(contentDiv)
        } else if (page.startsWith('product-')) {
          const productId = page.replace('product-', '')
          const products = await this.getProducts()
          const product = products.find(c => c.id === productId)
          if (product) {
            SEO.updateMeta(product.name, product.description)
            SEO.injectJSONLD(SEO.generateProductSchema(product))
            this.renderProductDetail(contentDiv, product)
          } else {
            contentDiv.innerHTML = '<div class="page-header"><h1>PRODUCT NOT FOUND</h1></div>'
          }
        }
    }
  }
  // Placeholder enliy: yon pwodwi san foto pa dwe kraze paj la.
  private static readonly NO_IMAGE =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200">' +
      '<rect width="800" height="1200" fill="#1a1a1a"/>' +
      '<text x="400" y="600" fill="#555" font-family="monospace" font-size="42" ' +
      'text-anchor="middle" letter-spacing="6">NO IMAGE</text></svg>'
    )

  private getImageSrc(img?: string | null): string {
    if (!img) return Pages.NO_IMAGE
    return img.startsWith('http') ? img : `/assets/${img}`
  }

  private async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)

    if (error || !data || data.length === 0) {
      if (error) console.warn('Supabase products fetch failed, using fallback catalog:', error)
      return catalogs
    }
    return data as Product[]
  }

  private async renderHome(contentDiv: HTMLElement): Promise<void> {
    contentDiv.className = 'page-container page-home'
    contentDiv.innerHTML = `
      <div class="editorial-home">
        <div class="editorial-strip static-collage">
          <img src="/assets/home_cover_collage.jpg" alt="NOUIE Streetwear Collection SS26 - Editorial Collage" width="1920" height="1080" fetchpriority="high">
        </div>
      </div>
      <div class="home-products">
        <div id="home-grid" class="collection-grid">
          <div class="loading-state">LOADING PRODUCTS...</div>
        </div>
      </div>
      <div class="home-spotted">
        <div class="section-header">
          <h2>SPOTTED</h2>
          <p>REAL REACTIONS FROM REAL PEOPLE</p>
        </div>
        <video class="spotted-video" src="/assets/video/ddg_streamer_review.mp4" controls playsinline preload="metadata"></video>
      </div>
    `

    const products = await this.getProducts()
    const grid = document.getElementById('home-grid')
    if (grid) {
      this.renderCatalogGrid(grid, products)
    }

    // Add smooth navigation for Shop Now button
    contentDiv.querySelector('.btn-primary')?.addEventListener('click', (e) => {
      e.preventDefault()
      window.location.hash = '#collection'
    })
  }


  private async renderCollection(contentDiv: HTMLElement): Promise<void> {
    contentDiv.innerHTML = `
      <div class="collection-page">
        <div class="collection-header-nav" id="collectionNav"></div>
        <div id="collection-grid" class="collection-grid">
          <div class="loading-state">
            LOADING COLLECTION...
          </div>
        </div>
      </div>
    `

    const grid = document.getElementById('collection-grid')
    if (!grid) return

    const [products, collectionsRes] = await Promise.all([
      this.getProducts(),
      supabase.from('collections').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    ])

    const collections: Collection[] = collectionsRes.data || []
    const nav = document.getElementById('collectionNav')
    if (nav && collections.length > 0) {
      nav.innerHTML = `
        <div class="collection-tabs">
          <button class="col-tab active" data-id="all">ALL UNITS</button>
          ${collections.map(c => `<button class="col-tab" data-id="${c.id}">${c.title}</button>`).join('')}
        </div>
      `

      nav.querySelectorAll('.col-tab').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          nav.querySelectorAll('.col-tab').forEach(b => b.classList.remove('active'))
          const target = e.currentTarget as HTMLElement
          target.classList.add('active')
          const colId = target.getAttribute('data-id')

          if (colId === 'all') {
            this.renderCatalogGrid(grid, products)
          } else {
            const { data: linked } = await supabase
              .from('product_collections')
              .select('product_id')
              .eq('collection_id', colId)

            const pids = new Set((linked || []).map(l => l.product_id))
            const filtered = products.filter(p => pids.has(p.id))
            this.renderCatalogGrid(grid, filtered.length > 0 ? filtered : products)
          }
        })
      })
    }

    this.renderCatalogGrid(grid, products)
  }

  private renderCatalogGrid(container: HTMLElement, cats: Product[]): void {
    container.innerHTML = cats.map(cat => {
      if (cat.is_active === false) return ''

      return `
        <div class="product-card" data-id="${cat.id}">
          <div class="product-card-image">
            <img src="${this.getImageSrc(cat.images?.[0])}" alt="${cat.name} - ${cat.color || ''} ${cat.material || ''}" loading="lazy" width="800" height="1200">
            <div class="quick-add-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
          </div>
          <div class="product-card-info">
            <h3 class="product-card-title">${cat.name}</h3>
            <div class="product-card-price">$${Number(cat.price).toFixed(2)}</div>
            <div class="product-card-swatches">
              <span class="swatch-dot active" style="background: #000;"></span>
              <span class="swatch-dot" style="background: #eee;"></span>
            </div>
          </div>
        </div>
      `
    }).join('')

    // Re-add click listeners for product cards
    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id')
        if (id) window.location.hash = `#product-${id}`
      })
    })
  }

  private renderProductDetail(contentDiv: HTMLElement, product: Product): void {
    contentDiv.innerHTML = `
      <div class="product-detail-page">
        <a href="#collection" class="back-link">← COLLECTION</a>
        
        <div class="product-layout">
          <div class="product-gallery">
            <div class="main-image">
              <img id="mainProductImg" src="${this.getImageSrc(product.images?.[0])}" alt="${product.name} - ${product.color || ''} ${product.material || ''} Primary View" width="1200" height="1800" fetchpriority="high">
            </div>
            <div class="thumbnail-strip">
              ${(product.images || []).map((img: string, i: number) => `
                <div class="thumbnail ${i === 0 ? 'active' : ''}" data-img="${img}">
                  <img src="${this.getImageSrc(img)}" alt="${product.name} view ${i + 1}" width="200" height="300" loading="lazy">
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="product-info">
            <h1 class="product-title">${product.name}</h1>
            <div class="product-price">$${Number(product.price).toFixed(2)}</div>
            
            <p class="product-description">${product.description}</p>
            
            <div class="product-specs-box">
              <div class="spec-item">
                <span class="spec-label">FABRIC / MATERIAL:</span>
                <span class="spec-value">${product.material || 'PREMIUM INDUSTRIAL COTTON'}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">COLORWAY:</span>
                <span class="spec-value">${product.color || 'STANDARD'}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">IDENTIFIER / SKU:</span>
                <span class="spec-value">${product.sku || product.id}</span>
              </div>
            </div>

            <div class="size-selector">
              <label>SELECT SIZE</label>
              <div class="size-options">
                ${product.sizes.map((size: string) => {
                  const sizeStock = product.stock_by_size?.[size]
                  const isSoldOut = sizeStock !== undefined && sizeStock <= 0
                  return isSoldOut
                    ? `<button class="size-btn sold-out" data-size="${size}" disabled title="SOLD OUT">${size}</button>`
                    : `<button class="size-btn" data-size="${size}">${size}</button>`
                }).join('')}
              </div>
            </div>
            
            <div class="product-actions">
              ${(product.stock_qty || 0) > 0
                ? `<button class="btn-add-cart" id="addToCartBtn">ADD TO CART</button>
                   <button class="btn-buy-now" id="buyNowBtn">BUY NOW</button>`
                : `<button class="btn-add-cart disabled" disabled>OUT OF STOCK</button>`
              }
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
        if (mainImg && imgName) mainImg.src = this.getImageSrc(imgName)
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

  private async renderArchive(contentDiv: HTMLElement): Promise<void> {
    contentDiv.innerHTML = `
      <div class="archive-page">
        <div class="page-header">
          <h1>ARCHIVE</h1>
          <p>PAST SEASONS & ARCHIVAL ARTIFACTS</p>
        </div>
        <div id="archive-grid" class="archive-grid">
          <div class="loading-state">LOADING ARCHIVE...</div>
        </div>
      </div>
    `
    const grid = document.getElementById('archive-grid')
    if (!grid) return

    try {
      const { data: archivedCols, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_archived', true)
        .order('sort_order', { ascending: true })

      if (!error && archivedCols && archivedCols.length > 0) {
        grid.innerHTML = archivedCols.map((col: Collection) => `
          <div class="archive-card">
            <div class="archive-card-image">
              <img src="${this.getImageSrc(col.cover_image)}" alt="${col.title}" loading="lazy">
            </div>
            <div class="archive-card-info">
              <h2>${col.title}</h2>
              <p>${col.description || ''}</p>
            </div>
          </div>
        `).join('')
        return
      }
    } catch (err) {
      console.warn('Could not fetch archived collections:', err)
    }

    grid.innerHTML = archiveSeasons.map(season => `
      <div class="archive-card">
        <div class="archive-card-image">
          <img src="${this.getImageSrc(season.images[0])}" alt="${season.title}" loading="lazy">
        </div>
        <div class="archive-card-info">
          <h2>${season.title} // ${season.year}</h2>
          <p>${season.description}</p>
          <div class="archive-highlights">
            ${season.highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('')
  }

  private renderStudio(contentDiv: HTMLElement): void {
    contentDiv.innerHTML = `
      <div class="studio-page">
        <div class="page-header">
          <h1>STUDIO</h1>
          <p>THE PROCESS BEHIND THE PIECES</p>
        </div>
        <div class="studio-content">
          <section class="studio-section">
            <h2>PHILOSOPHY</h2>
            <p>NOUIE operates at the intersection of architectural form and functional streetwear. Every piece begins with raw material selection, focusing on weight, texture, and longevity.</p>
          </section>
          <section class="studio-section">
            <h2>DEVELOPMENT</h2>
            <p>Our designs undergo rigorous prototyping. From the initial hand-drawn sketch to the final screen-printed textile, each iteration is refined for balance, comfort, and presence.</p>
          </section>
          <section class="studio-section">
            <h2>MATERIALS</h2>
            <p>Heavyweight cottons, breathable technical knits, and durable hardware. We source materials that age with character, developing unique patina through wear.</p>
          </section>
        </div>
      </div>
    `
  }

  private renderLookbook(contentDiv: HTMLElement): void {
    contentDiv.innerHTML = `
      <div class="lookbook-page">
        <div class="page-header">
          <h1>LOOKBOOK</h1>
          <p>SEASONAL VISUAL NARRATIVE</p>
        </div>
        <div class="lookbook-grid">
          <div class="lookbook-item">
            <div class="lookbook-image">
              <img src="/assets/cat1_1.jpg" alt="Look 01 - Soldier Thermals" loading="lazy">
              <div class="lookbook-overlay"></div>
            </div>
            <div class="lookbook-caption">LOOK 01 // SOLDIER THERMALS</div>
          </div>
          <div class="lookbook-item">
            <div class="lookbook-image">
              <img src="/assets/cat2_1.jpg" alt="Look 02 - NOUIE Tee" loading="lazy">
              <div class="lookbook-overlay"></div>
            </div>
            <div class="lookbook-caption">LOOK 02 // NOUIE TEE</div>
          </div>
          <div class="lookbook-item">
            <div class="lookbook-image">
              <img src="/assets/cat3_1.png" alt="Look 03 - NOUIE Jersey" loading="lazy">
              <div class="lookbook-overlay"></div>
            </div>
            <div class="lookbook-caption">LOOK 03 // NOUIE JERSEY</div>
          </div>
        </div>
      </div>
    `
  }

  private checkoutUnsubscribe: (() => void) | null = null

  private async renderCheckout(contentDiv: HTMLElement): Promise<void> {
    // Rezime checkout la dwe swiv panyen an. San sa, si kliyan an chanje yon
    // kantite nan tiwa panyen an pandan li sou paj sa a, li rete ap gade yon
    // ansyen total pandan sèvè a ap chaje yon lòt.
    this.checkoutUnsubscribe?.()
    this.checkoutUnsubscribe = cartStore.subscribe(() => {
      if (window.location.hash.replace('#', '') !== 'checkout') {
        this.checkoutUnsubscribe?.()
        this.checkoutUnsubscribe = null
        return
      }
      void this.renderCheckout(contentDiv)
    })

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

    const [shippingConf, taxConf] = await Promise.all([
      settingsService.getShipping(),
      settingsService.getTax()
    ])

    const subtotal = cartStore.getTotal()
    let shippingMethod: 'standard' | 'express' = 'standard'
    let appliedDiscount: { code: string; discount_amount: number; type: string; value: number } | null = null

    const calcShipping = (method: 'standard' | 'express', sub: number) => {
      if (method === 'express') return shippingConf.express
      return sub >= shippingConf.free_threshold ? 0.00 : shippingConf.standard
    }

    const calcTax = (sub: number) => {
      if (!taxConf.enabled) return 0.00
      return Math.round(sub * taxConf.rate * 100) / 100
    }

    const renderTotals = () => {
      const shipCost = calcShipping(shippingMethod, subtotal)
      const discountAmt = appliedDiscount ? appliedDiscount.discount_amount : 0.00
      // Taks la kalkile sou baz APRE rabè — dwe rete idantik ak place_order().
      const taxCost = calcTax(Math.max(0, subtotal - discountAmt))
      const finalTotal = Math.max(0, subtotal - discountAmt + shipCost + taxCost)

      const isFree = shippingMethod === 'standard' && subtotal >= shippingConf.free_threshold
      const shipText = isFree ? 'FREE' : `$${shipCost.toFixed(2)}`

      const shipEl = document.getElementById('checkoutShippingCost')
      const totalEl = document.getElementById('checkoutFinalTotal')
      const taxEl = document.getElementById('checkoutTaxRow')
      const discountEl = document.getElementById('checkoutDiscountRow')

      if (shipEl) shipEl.textContent = shipText
      if (totalEl) totalEl.textContent = `$${finalTotal.toFixed(2)} USD`

      if (taxConf.enabled && taxEl) {
        taxEl.style.display = 'flex'
        const taxVal = document.getElementById('checkoutTaxCost')
        if (taxVal) taxVal.textContent = `$${taxCost.toFixed(2)}`
      } else if (taxEl) {
        taxEl.style.display = 'none'
      }

      if (appliedDiscount && discountEl) {
        discountEl.style.display = 'flex'
        const codeLabel = document.getElementById('appliedCodeLabel')
        const discVal = document.getElementById('checkoutDiscountAmount')
        if (codeLabel) codeLabel.textContent = appliedDiscount.code
        if (discVal) discVal.textContent = `-$${discountAmt.toFixed(2)}`
      } else if (discountEl) {
        discountEl.style.display = 'none'
      }
    }

    contentDiv.innerHTML = `
      <div class="checkout-page">
        <div class="page-header">
          <h1>CHECKOUT</h1>
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
                <label>SHIPPING METHOD *</label>
                <div class="shipping-method-selector">
                  <label class="shipping-option">
                    <input type="radio" name="shippingMethod" value="standard" checked>
                    <span>STANDARD (${shippingConf.standard_days} BUSINESS DAYS) — $${shippingConf.standard.toFixed(2)} (FREE OVER $${shippingConf.free_threshold.toFixed(2)})</span>
                  </label>
                  <label class="shipping-option">
                    <input type="radio" name="shippingMethod" value="express">
                    <span>EXPRESS (${shippingConf.express_days} BUSINESS DAYS) — $${shippingConf.express.toFixed(2)}</span>
                  </label>
                </div>
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
                  <div class="order-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                </div>
              `).join('')}
            </div>

            <div class="discount-box">
              <div class="discount-input-row">
                <input type="text" id="discountCodeInput" placeholder="PROMO_CODE" style="text-transform: uppercase;">
                <button type="button" id="applyDiscountBtn" class="btn-apply-discount">APPLY</button>
              </div>
              <div id="discountFeedback" class="discount-feedback"></div>
            </div>

            <div class="order-totals">
              <div class="order-total-row">
                <span>SUBTOTAL</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              <div class="order-total-row" id="checkoutDiscountRow" style="display: none; color: #10b981;">
                <span>DISCOUNT (<span id="appliedCodeLabel"></span>)</span>
                <span id="checkoutDiscountAmount">-$0.00</span>
              </div>
              <div class="order-total-row">
                <span>SHIPPING</span>
                <span id="checkoutShippingCost">${shippingMethod === 'standard' && subtotal >= shippingConf.free_threshold ? 'FREE' : `$${shippingConf.standard.toFixed(2)}`}</span>
              </div>
              <div class="order-total-row" id="checkoutTaxRow" style="${taxConf.enabled ? 'display: flex;' : 'display: none;'}">
                <span>${taxConf.label} (${(taxConf.rate * 100).toFixed(1)}%)</span>
                <span id="checkoutTaxCost">$${calcTax(subtotal).toFixed(2)}</span>
              </div>
              <div class="order-total-row total-final">
                <span>TOTAL</span>
                <span id="checkoutFinalTotal">$${(subtotal + calcShipping(shippingMethod, subtotal) + calcTax(subtotal)).toFixed(2)} USD</span>
              </div>
            </div>

            <button type="button" class="btn-place-order" id="placeOrderBtn">PLACE ORDER</button>
            <p class="checkout-terms-notice">
              BY PLACING AN ORDER, YOU AGREE TO NOUIE'S <a href="#terms">TERMS OF SERVICE</a> AND <a href="#privacy">PRIVACY POLICY</a>.
            </p>
            <div id="orderStatus" class="order-status"></div>
          </div>
        </div>
      </div>
    `

    // Shipping method change handler
    contentDiv.querySelectorAll('input[name="shippingMethod"]').forEach(input => {
      input.addEventListener('change', (e) => {
        shippingMethod = (e.target as HTMLInputElement).value as 'standard' | 'express'
        renderTotals()
      })
    })

    // Discount code apply handler
    document.getElementById('applyDiscountBtn')?.addEventListener('click', async () => {
      const codeInput = document.getElementById('discountCodeInput') as HTMLInputElement
      const feedback = document.getElementById('discountFeedback') as HTMLElement
      const code = codeInput.value.trim().toUpperCase()

      if (!code) {
        feedback.innerHTML = '<span class="warning">ENTER A PROMO CODE</span>'
        return
      }

      feedback.innerHTML = '<span class="loading">VALIDATING CODE...</span>'

      try {
        const { data, error } = await supabase.rpc('validate_discount', {
          p_code: code,
          p_subtotal: subtotal
        })

        if (error || !data || !data.valid) {
          appliedDiscount = null
          feedback.innerHTML = `<span class="warning">${data?.message || 'INVALID DISCOUNT CODE'}</span>`
        } else {
          appliedDiscount = data
          feedback.innerHTML = `<span class="success">PROMO CODE APPLIED: -$${Number(data.discount_amount).toFixed(2)}</span>`
        }
        renderTotals()
      } catch (err: any) {
        feedback.innerHTML = `<span class="warning">VALIDATION ERROR: ${err.message}</span>`
      }
    })

    document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
      const form = document.getElementById('checkoutForm') as HTMLFormElement
      if (!form.checkValidity()) {
        form.reportValidity()
        return
      }
      await this.submitOrder(shippingMethod, appliedDiscount?.code || null)
    })
  }

  private async submitOrder(shippingMethod: 'standard' | 'express', discountCode: string | null = null): Promise<void> {
    const statusEl = document.getElementById('orderStatus')
    const btnEl = document.getElementById('placeOrderBtn') as HTMLButtonElement

    if (statusEl) statusEl.innerHTML = '<div class="loading">PROCESSING ORDER SECURELY...</div>'
    if (btnEl) btnEl.disabled = true

    const items = cartStore.getItems()
    if (items.length === 0) {
      if (statusEl) statusEl.innerHTML = '<div class="warning">YOUR CART IS EMPTY</div>'
      if (btnEl) btnEl.disabled = false
      return
    }

    const payload = {
      p_customer_name: (document.getElementById('customerName') as HTMLInputElement).value.trim(),
      p_customer_email: (document.getElementById('customerEmail') as HTMLInputElement).value.trim(),
      p_customer_phone: (document.getElementById('customerPhone') as HTMLInputElement).value.trim(),
      p_shipping_address: (document.getElementById('shippingAddress') as HTMLTextAreaElement).value.trim(),
      p_notes: (document.getElementById('orderNotes') as HTMLTextAreaElement).value.trim() || null,
      p_items: items,
      p_shipping_method: shippingMethod,
      p_discount_code: discountCode
    }

    try {
      const { data: orderId, error } = await supabase.rpc('place_order', payload)

      if (error) {
        console.error('Supabase place_order error:', error.message)
        let userMessage = error.message

        if (userMessage.includes('PANYEN_VID')) {
          userMessage = 'YOUR CART IS EMPTY.'
        } else if (userMessage.includes('PWODWI_ENDISPONIB')) {
          userMessage = 'ONE OR MORE ITEMS IN YOUR CART ARE NO LONGER AVAILABLE.'
        } else if (userMessage.includes('ESTOK_ENSIFIZAN')) {
          userMessage = userMessage.replace('ESTOK_ENSIFIZAN:', 'OUT OF STOCK:').toUpperCase()
        } else if (userMessage.includes('KANTITE_ENVALID')) {
          userMessage = 'INVALID ITEM QUANTITY.'
        } else if (userMessage.includes('GWOSE_MANKE')) {
          userMessage = 'PLEASE SELECT A SIZE FOR EVERY ITEM.'
        } else if (userMessage.includes('RABE_ENVALID')) {
          userMessage = 'DISCOUNT CODE IS INVALID.'
        } else if (userMessage.includes('RABE_EKSPIRE')) {
          userMessage = 'DISCOUNT CODE HAS EXPIRED.'
        } else if (userMessage.includes('RABE_LIMIT_ATENN')) {
          userMessage = 'DISCOUNT CODE USAGE LIMIT REACHED.'
        } else if (userMessage.includes('RABE_MINIMÒM_ENSIFIZAN')) {
          userMessage = 'ORDER DOES NOT MEET MINIMUM FOR THIS DISCOUNT.'
        }

        if (statusEl) {
          statusEl.innerHTML = `<div class="warning">${userMessage}</div>`
        }
        if (btnEl) btnEl.disabled = false
        // Cart is retained so customer doesn't lose items
        return
      }

      // Success: clear cart and show confirmed view with real order ID
      this.showOrderSuccess(orderId)
    } catch (err: any) {
      console.error('Order submission network error:', err)
      if (statusEl) {
        statusEl.innerHTML = `<div class="warning">NETWORK TRANSMISSION FAILED: ${err?.message || 'PLEASE TRY AGAIN'}</div>`
      }
      if (btnEl) btnEl.disabled = false
    }
  }

  private showOrderSuccess(orderId?: string | number): void {
    cartStore.clear()

    const ref = orderId ? `#INV-${orderId}` : `REF_${Date.now().toString(36).toUpperCase()}`
    const contentDiv = this.getContentDiv()
    contentDiv.innerHTML = `
      <div class="order-success">
        <div class="success-icon">✓</div>
        <h1>ORDER CONFIRMED</h1>
        <p>Thank you for your order. Your technical units have been reserved in our system.</p>
        <p class="order-id">ORDER ${ref}</p>
        <a href="#collection" class="btn-continue">CONTINUE BROWSING</a>
      </div>
    `
  }


  private async renderAdmin(contentDiv: HTMLElement): Promise<void> {
    // Delegate to refactored AdminDashboard component
    const { AdminDashboard } = await import('./AdminDashboard')
    const adminDashboard = new AdminDashboard(contentDiv)
    await adminDashboard.render()
  }
}
