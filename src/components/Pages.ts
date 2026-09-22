// Pages Component - Renders all page content

import { supabase } from '../lib/supabase'
import { cartStore } from '../lib/store'
import { catalogs } from '../lib/data'
import type { Product, Collection } from '../lib/types'
import { pozisyonImaj } from '../lib/types'
import { SEO } from '../lib/seo'
import { settingsService } from '../lib/settings'
import { renderSafeMarkdown, escapeHtml } from '../lib/markdown'
import { imageSrc, NO_IMAGE } from '../lib/images'

// Yon « ghost click »: sou iOS, lè yon paj rechaje, touch ki te kòmanse anvan
// rechajman an ka rejwe kòm yon klik sou eleman ki anba dwèt la. Rezilta pou
// Jackpot: chak refresh sou akèy te louvri yon paj pwodwi li pa t mande.
// Nou inyore tout klik navigasyon nan premye 600 ms apre chajman an.
const PAJ_CHAJE_A = Date.now()
const MS_GAD_GHOST = 600

function klikValab(): boolean {
  // Sèlman fenèt tan an. Yon tchèk `isTrusted` pa t ede: ghost click iOS yo make
  // kòm « trusted » tou, epi li te bloke tout klik zouti tès yo.
  return Date.now() - PAJ_CHAJE_A >= MS_GAD_GHOST
}

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
    // Menm tèks ak `pages.returns` nan baz la (migrasyon 20260922000016) —
    // sèvi sèlman si baz la pa reponn.
    const defaultBody = `**NO RETURNS OR EXCHANGES. ALL SALES ARE FINAL!!!!**

## DAMAGES AND ISSUES

Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right.`

    await this.renderLegalPage(contentDiv, 'returns', 'REFUND POLICY', defaultBody)
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
    // Pa gen imèl pa defo: `support@nouie.com` pa t pou nou (domèn nan se
    // no-uie.com) — kliyan yo t ap ekri nan vid. Kat la kache jiskaske
    // STORE_CONFIGURATION gen yon vrè adrès; fòm kontak la toujou mache.
    const supportEmail = (business.email_support || '').trim()
    const studioEmail = (business.email_studio || '').trim()

    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>CONTACT</h1>
          <p>GET IN TOUCH WITH THE STUDIO.</p>
        </div>
        
        <div class="contact-layout">
          <div class="contact-info-grid">
            ${supportEmail ? `<div class="contact-card">
              <h3>CUSTOMER SUPPORT</h3>
              <p>FOR ORDER INQUIRIES, DAMAGED ITEMS, OR GENERAL QUESTIONS:</p>
              <a href="mailto:${encodeURIComponent(supportEmail)}" class="contact-link">${escapeHtml(supportEmail.toUpperCase())}</a>
            </div>` : ''}
            ${studioEmail ? `<div class="contact-card">
              <h3>WHOLESALE & STUDIO</h3>
              <p>FOR BUSINESS INQUIRIES OR PARTNERSHIPS:</p>
              <a href="mailto:${encodeURIComponent(studioEmail)}" class="contact-link">${escapeHtml(studioEmail.toUpperCase())}</a>
            </div>` : ''}
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
                <option value="return">DAMAGED OR WRONG ITEM</option>
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
        // ARCHIVE fonn nan LOOKBOOK. Nou redireksyone olye nou bay 404: lyen
        // ki te deja pataje yo dwe kontinye rive yon kote ki gen sans.
        window.location.replace('#lookbook')
        return
      case 'studio':
        SEO.updateMeta('STUDIO', 'Inside the NOUIE design philosophy and technical process.')
        this.renderStudio(contentDiv)
        break
      case 'lookbook':
        SEO.updateMeta('LOOKBOOK', 'The NOUIE gallery — imagery, detail and motion from the NOUIE universe.')
        await this.renderLookbook(contentDiv)
        break
      case 'checkout':
        SEO.updateMeta('CHECKOUT', 'Secure checkout for your NOUIE technical gear.')
        await this.renderCheckout(contentDiv)
        break
      case 'order/success':
        this.renderOrderSuccess(contentDiv)
        break
      case 'order/cancel':
        this.renderOrderCancel(contentDiv)
        break
      case 'admin':
        SEO.updateMeta('ADMIN', 'NOUIE internal management system.')
        await this.renderAdmin(contentDiv)
        break
      case 'modpas':
        SEO.updateMeta('SET PASSWORD', 'NOUIE internal access.')
        await this.renderSetPassword(contentDiv)
        break
      case 'shipping':
        SEO.updateMeta('SHIPPING', 'Domestic and international shipping policies.')
        this.renderShipping(contentDiv)
        break
      case 'returns':
        SEO.updateMeta('REFUND POLICY', 'All NOUIE sales are final. Contact us if your item arrives defective, damaged or incorrect.')
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
            SEO.updateMeta('PRODUCT NOT FOUND', 'This piece is no longer available.')
            this.renderNotFound(contentDiv, 'THIS PIECE IS NO LONGER AVAILABLE.')
          }
        } else {
          // San sa a, nenpòt lyen kase (#nenpòt) te kite paj la vid nèt.
          SEO.updateMeta('PAGE NOT FOUND', 'This page does not exist.')
          this.renderNotFound(contentDiv, 'THIS PAGE DOES NOT EXIST.')
        }
    }
  }

  private renderNotFound(contentDiv: HTMLElement, message: string): void {
    contentDiv.innerHTML = `
      <div class="order-success">
        <h1>NOT FOUND</h1>
        <p>${message}</p>
        <a href="#collection" class="btn-continue">BROWSE THE COLLECTION</a>
      </div>
    `
  }
  private getImageSrc(img?: string | null, width = 700): string {
    return img ? imageSrc(img, width) : NO_IMAGE
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

    // Pwodwi kouvèti a pwomote. Si reglaj la vid, nou pa montre yon lyen ki kase.
    const store = await settingsService.getStoreGeneral()
    const featuredId = (store.featured_product || '').trim()

    // Nou pati chèche pwodwi yo KOUNYE A, men nou pa tann yo pou n tache koutè
    // bouton an — gade nòt la pi ba.
    const productsPromise = this.getProducts()

    contentDiv.innerHTML = `
      <div class="editorial-home">
        <!-- Yon <h1> pa paj pou Google ak lektè ekran; kouvèti a se yon imaj. -->
        <h1 class="sr-only">NOUIE — Technical Streetwear</h1>
        <div class="editorial-strip static-collage">
          <picture>
            <!-- Sou telefòn, twa panno kòt a kòt bay twa ti imaj 130 px — pwodwi
                 a pa li. Donk telefòn resevwa yon sèl panno an fòma vètikal. -->
            <source media="(max-width: 768px)" srcset="/assets/home_cover_mobile.jpg" width="1080" height="1350">
            <img src="/assets/home_cover_collage.jpg" alt="NOUIE Streetwear Collection SS26 - Editorial Collage" width="1920" height="880" fetchpriority="high">
          </picture>
        </div>
        <!-- De bouton sou kouvèti a. BUY NOW mennen sou paj pwodwi ki nan kouvèti
             a — pa dirèk nan checkout — paske yon rad mande yon gwosè; san
             gwosè kòmand lan pa ka monte. Pwodwi a soti nan reglaj boutik la
             (store.featured_product), konsa lè yon nouvo drop soti nou pa
             bezwen touche kòd la. -->
        <div class="cover-actions">
          ${featuredId ? `<button type="button" id="coverBuyNow" class="cover-btn cover-btn-primary">BUY NOW</button>` : ''}
          <a href="#collection" class="cover-btn">CATALOG</a>
        </div>
      </div>
      <div class="home-products">
        <div class="section-header">
          <h2>THE COLLECTION</h2>
          <p>SS26 — AVAILABLE NOW</p>
        </div>
        <div id="home-grid" class="collection-grid">
          <div class="loading-state">LOADING PRODUCTS...</div>
        </div>
      </div>
      <div class="home-spotted">
        <div class="section-header">
          <h2>SPOTTED</h2>
          <p>REAL REACTIONS FROM REAL PEOPLE</p>
        </div>
        <div class="spotted-track">
          <div class="spotted-slide">
            <video src="/assets/video/nouie_clip_01.mp4" controls playsinline preload="metadata"></video>
          </div>
          <div class="spotted-slide">
            <video src="/assets/video/ddg_streamer_review.mp4" controls playsinline preload="metadata"></video>
          </div>
          <div class="spotted-slide">
            <video src="/assets/video/nouie_clip_02.mp4" controls playsinline preload="metadata"></video>
          </div>
        </div>
        <p class="spotted-hint">SWIPE FOR MORE</p>
      </div>
    `

    // BUY NOW sou kouvèti a: mete pwodwi ki nan foto a nan panyen an epi ale
    // dirèk nan checkout. Yon rad mande yon gwosè, epi kouvèti a pa gen kote
    // pou chwazi youn — donk nou pran premye gwosè ki gen estòk. Si okenn pa
    // gen estòk, nou pa ka vann: nou voye moun nan sou paj pwodwi a kote li wè
    // sa ki SOLD OUT, olye nou kreye yon kòmand ki pa ka livre.
    //
    // NÒT: koutè a TACHE ISIT, anvan tout `await`. Premye vèsyon an te tache l
    // apre `await this.getProducts()` — lè paj la te rann de fwa, bouton ki te
    // sou ekran an pa t gen okenn koutè epi klik la pa t fè anyen ditou.
    document.getElementById('coverBuyNow')?.addEventListener('click', async () => {
      if (!klikValab()) return
      const list = await productsPromise
      const featured = list.find(p => p.id === featuredId)
      if (!featured) {
        window.location.hash = '#collection'
        return
      }

      const stock = featured.stock_by_size || {}
      const sizeOrder = featured.sizes?.length ? featured.sizes : Object.keys(stock)
      const available = sizeOrder.find(size => Number(stock[size] ?? 0) > 0)

      if (!available) {
        window.location.hash = `#product-${featured.id}`
        return
      }

      cartStore.addItem(featured.id, featured.name, available, featured.price)
      window.location.hash = '#checkout'
    })

    const products = await productsPromise
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
        <h1 class="sr-only">NOUIE Collection</h1>
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
            <img src="${this.getImageSrc(cat.images?.[0], 420)}" alt="${cat.name} - ${cat.color || ''} ${cat.material || ''}" loading="lazy" width="800" height="1200" style="object-position: ${pozisyonImaj(cat.image_position)}">
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
        if (!klikValab()) return
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
            <!-- Tout foto yo youn akote lòt nan yon bann ki glise (scroll-snap).
                 Anvan se te yon sèl <img> ki chanje sèlman lè yo klike yon
                 ti kad — sou telefòn, glise dwèt sou foto a pa t fè anyen. -->
            <div class="main-image" id="mainProductTrack">
              ${(product.images?.length ? product.images : [undefined]).map((img: string | undefined, i: number) => `
                <img src="${this.getImageSrc(img, 720)}" alt="${product.name} - ${product.color || ''} ${product.material || ''} ${i === 0 ? 'Primary View' : `View ${i + 1}`}" width="1200" height="1800" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} style="object-position: ${pozisyonImaj(product.image_position)}">
              `).join('')}
            </div>
            <div class="thumbnail-strip">
              ${(product.images || []).map((img: string, i: number) => `
                <div class="thumbnail ${i === 0 ? 'active' : ''}" data-index="${i}">
                  <img src="${this.getImageSrc(img, 120)}" alt="${product.name} view ${i + 1}" width="200" height="300" loading="lazy">
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

            <!-- Louvri pa defo: « all sales are final » dwe vizib ANVAN kliyan
                 an achte, pa kache nan yon paj legal. -->
            <details class="product-accordion" open>
              <summary>SHIPPING &amp; RETURNS</summary>
              <div class="product-accordion-body" id="shippingReturnsBody">
                <p class="loading-state">LOADING...</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    `

    void this.fillShippingReturns()
    this.initProductDetailHandlers(product)
  }

  // Menm chif ak checkout la (STORE_CONFIGURATION → SHIPPING) — si Franckley
  // chanje yon pri, paj pwodwi a swiv otomatikman.
  private async fillShippingReturns(): Promise<void> {
    const [ship, store] = await Promise.all([
      settingsService.getShipping(),
      settingsService.getStoreGeneral(),
    ])
    const el = document.getElementById('shippingReturnsBody')
    if (!el) return
    const usd = (n: number) => `$${Number(n).toFixed(2)}`
    const free = Number(ship.free_threshold) > 0
      ? ` Free standard shipping on U.S. orders over ${usd(ship.free_threshold)}.`
      : ''
    el.innerHTML = `
      <p><strong>Shipping.</strong> Standard (${escapeHtml(String(ship.standard_days))} business days) ${usd(ship.standard)} · Express (${escapeHtml(String(ship.express_days))} business days) ${usd(ship.express)}.${free} <a href="#shipping">Shipping policy</a></p>
      ${store.returns_summary ? `<p><strong>Returns.</strong> ${escapeHtml(store.returns_summary)} <a href="#returns">Refund policy</a></p>` : ''}
    `
  }

  private initProductDetailHandlers(product: Product): void {
    const contentDiv = this.getContentDiv()

    // Galri: glise sou foto a OSWA klike yon ti kad — de chemen yo rete
    // senkronize. Se navigatè a ki jere glisad la (scroll-snap), donk li swiv
    // dwèt la ak momantòm natif iOS olye yon animasyon JS.
    const track = document.getElementById('mainProductTrack')
    const thumbs = Array.from(contentDiv.querySelectorAll<HTMLElement>('.thumbnail'))
    const makeActive = (i: number) => {
      thumbs.forEach((t, j) => t.classList.toggle('active', j === i))
    }

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const i = Number(thumb.dataset.index) || 0
        makeActive(i)
        track?.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' })
      })
    })

    track?.addEventListener('scroll', () => {
      makeActive(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)))
    }, { passive: true })

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

  // Galeri NOUIE. Videyo 16:9 la pran 2 kolòn; rès la se kare 3/4.
  // Videyo yo — sèl kontni galeri a ki kode isit. Tout imaj yo soti nan
  // katalòg la, donk chak pwodwi Franckley ajoute nan admin nan parèt
  // otomatikman. RÈG: pa kode okenn non fichye imaj isit. Dosye `assets/`
  // la te gen randi AI ki soti nan yon faz prototip; sèl sous verite pou
  // imaj se pwodwi ki nan baz done a.
  private static readonly GALLERY_VIDEOS: Array<{ video: string; alt: string; wide?: boolean }> = [
    { video: 'nouie_clip_01.mp4', alt: 'NOUIE clip 01' },
    { video: 'ddg_streamer_review.mp4', alt: 'Spotted — streamer review', wide: true },
    { video: 'nouie_clip_02.mp4', alt: 'NOUIE clip 02' },
  ]

  private async renderLookbook(contentDiv: HTMLElement): Promise<void> {
    // `img` la se yon src konplè deja (getImageSrc jere non lokal ak URL Storage).
    const tile = (t: { img?: string; video?: string; alt: string; wide?: boolean }) => `
      <figure class="gallery-item${t.wide ? ' gallery-item--wide' : ''}">
        ${t.video
          ? `<video src="/assets/video/${t.video}" controls playsinline preload="metadata" aria-label="${escapeHtml(t.alt)}"></video>`
          : `<img src="${t.img}" alt="${escapeHtml(t.alt)}" loading="lazy">`}
      </figure>`

    contentDiv.innerHTML = `
      <div class="lookbook-page">
        <div class="page-header">
          <h1>LOOKBOOK</h1>
          <p>THE NOUIE GALLERY — IMAGERY, DETAIL & MOTION</p>
        </div>
        <div class="gallery-grid" id="gallery-grid">
          <div class="loading-state">LOADING GALLERY...</div>
        </div>
        <div id="gallery-archived"></div>
      </div>
    `

    // Tout imaj yo soti nan katalòg la epi videyo yo simen ladan yo.
    const products = await this.getProducts()
    const shots = products.flatMap(p =>
      (p.images || []).map(img => ({ img: this.getImageSrc(img, 420), alt: p.name.trim() }))
    )

    const tiles: Array<{ img?: string; video?: string; alt: string; wide?: boolean }> = []
    const step = Math.max(1, Math.ceil(shots.length / (Pages.GALLERY_VIDEOS.length + 1)))
    let v = 0
    shots.forEach((shot, i) => {
      tiles.push(shot)
      if ((i + 1) % step === 0 && v < Pages.GALLERY_VIDEOS.length) {
        tiles.push(Pages.GALLERY_VIDEOS[v++])
      }
    })
    while (v < Pages.GALLERY_VIDEOS.length) tiles.push(Pages.GALLERY_VIDEOS[v++])

    const grid = document.getElementById('gallery-grid')
    if (grid) {
      grid.innerHTML = tiles.length
        ? tiles.map(tile).join('')
        : '<div class="loading-state">GALLERY COMING SOON</div>'
    }

    // Koleksyon Franckley make « ARCHIVED » nan admin nan ateri isit — konsa
    // travay la pa vin òfelen kounye a ke paj ARCHIVE la fonn nan galeri a.
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_archived', true)
        .order('sort_order', { ascending: true })

      if (error || !data || data.length === 0) return
      const host = document.getElementById('gallery-archived')
      if (!host) return

      host.innerHTML = `
        <div class="page-header gallery-past-header">
          <h2>PAST SEASONS</h2>
        </div>
        <div class="gallery-grid">
          ${data.map((col: Collection) => `
            <figure class="gallery-item">
              <img src="${this.getImageSrc(col.cover_image, 420)}" alt="${col.title}" loading="lazy">
              <figcaption>${col.title}</figcaption>
            </figure>
          `).join('')}
        </div>
      `
    } catch (err) {
      console.warn('Could not load archived collections:', err)
    }
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

    const [shippingConf, taxConf, storeConf] = await Promise.all([
      settingsService.getShipping(),
      settingsService.getTax(),
      settingsService.getStoreGeneral()
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

            ${storeConf.maintenance
              // Mòd maintenance: kliyan an wè poukisa, panyen li rete sove.
              // Sèvè a refize tou (create-checkout-session) — sa a se sèlman
              // pou l pa ranpli tout fòm lan pou granmesi.
              ? `<button type="button" class="btn-place-order" disabled>CHECKOUT OPENS SOON</button>
                 <p class="checkout-terms-notice">WE ARE UPDATING THE STORE. YOUR CART IS SAVED — COME BACK SHORTLY TO COMPLETE YOUR ORDER.</p>`
              : `<button type="button" class="btn-place-order" id="placeOrderBtn">PLACE ORDER</button>`}
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

    // Kòd fenèt enskripsyon an: nou mete l nan bwat la pou kliyan an pa bezwen
    // sonje l. Li toujou peze APPLY li menm — nou pa aplike anyen san l konnen.
    try {
      const welcome = localStorage.getItem('nouie_welcome_code')
      const codeBox = document.getElementById('discountCodeInput') as HTMLInputElement | null
      if (welcome && codeBox && !codeBox.value) codeBox.value = welcome
    } catch { /* mòd prive */ }

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
        console.error('Discount validation error:', err)
        feedback.innerHTML = '<span class="warning">COULD NOT CHECK THIS CODE RIGHT NOW — TRY AGAIN.</span>'
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

    if (statusEl) statusEl.innerHTML = '<div class="loading">CONNECTING TO SECURE CHECKOUT...</div>'
    if (btnEl) btnEl.disabled = true

    const items = cartStore.getItems()
    if (items.length === 0) {
      if (statusEl) statusEl.innerHTML = '<div class="warning">YOUR CART IS EMPTY</div>'
      if (btnEl) btnEl.disabled = false
      return
    }

    const previousOrderIdStr = sessionStorage.getItem('nouie_pending_order')
    const previousOrderId = previousOrderIdStr ? Number(previousOrderIdStr) : null

    const payload = {
      p_customer_name: (document.getElementById('customerName') as HTMLInputElement).value.trim(),
      p_customer_email: (document.getElementById('customerEmail') as HTMLInputElement).value.trim(),
      p_customer_phone: (document.getElementById('customerPhone') as HTMLInputElement).value.trim(),
      p_shipping_address: (document.getElementById('shippingAddress') as HTMLTextAreaElement).value.trim(),
      p_notes: (document.getElementById('orderNotes') as HTMLTextAreaElement).value.trim() || null,
      p_items: items,
      p_shipping_method: shippingMethod,
      p_discount_code: discountCode,
      previous_order_id: previousOrderId,
    }

    try {
      // Rele Edge Function create-checkout-session ki rele place_order bò sèvè
      const { data, error, response } = await supabase.functions.invoke('create-checkout-session', {
        body: payload,
      }) as { data: any; error: any; response?: Response }

      if (error || !data || data.error) {
        // supabase-js mete yon mesaj jenerik ('Edge Function returned a non-2xx
        // status code') nan error.message; vrè mesaj biznis la (ESTOK_ENSIFIZAN,
        // RABE_ENVALID...) rete nan kò repons lan. San lekti sa a, TOUT mapping
        // erè anba yo mouri an silans.
        let bodyErr = ''
        const raw = response ?? (error as any)?.context
        if (raw && typeof raw.json === 'function') {
          try {
            const parsed = await raw.clone().json()
            bodyErr = parsed?.error || ''
          } catch { /* kò a pa JSON — nou tonbe sou error.message */ }
        }

        const errMsg = bodyErr || data?.error || error?.message || 'CHECKOUT INITIATION FAILED'
        console.error('Checkout session creation error:', errMsg)

        // LIS BLAN. Nou pati ak yon mesaj pwofesyonèl epi nou ranplase l SÈLMAN
        // pou erè biznis nou konnen. Lojik la te ranvèse anvan (pati ak mesaj brit
        // la, ranplase si rekonèt) — se konsa yon erè Stripe te rive parèt tou nen
        // sou paj checkout la devan kliyan yo. Yon detay teknik pa gen dwa soti isit.
        let userMessage = 'CHECKOUT IS TEMPORARILY UNAVAILABLE. YOUR CART IS SAVED — PLEASE TRY AGAIN SHORTLY, OR <a href="#contact">CONTACT US</a> IF THE PROBLEM CONTINUES.'

        if (errMsg.includes('BOUTIK_FÈMEN')) {
          userMessage = 'CHECKOUT IS CLOSED WHILE WE UPDATE THE STORE. YOUR CART IS SAVED — PLEASE COME BACK SHORTLY.'
        } else if (errMsg.includes('PANYEN_VID')) {
          userMessage = 'YOUR CART IS EMPTY.'
        } else if (errMsg.includes('PWODWI_ENDISPONIB')) {
          userMessage = 'ONE OR MORE ITEMS IN YOUR CART ARE NO LONGER AVAILABLE.'
        } else if (errMsg.includes('ESTOK_ENSIFIZAN')) {
          userMessage = errMsg.slice(errMsg.indexOf('ESTOK_ENSIFIZAN'))
            .replace('ESTOK_ENSIFIZAN:', 'OUT OF STOCK:').toUpperCase()
        } else if (errMsg.includes('KANTITE_ENVALID')) {
          userMessage = 'INVALID ITEM QUANTITY.'
        } else if (errMsg.includes('GWOSE_MANKE')) {
          userMessage = 'PLEASE SELECT A SIZE FOR EVERY ITEM.'
        } else if (errMsg.includes('RABE_ENVALID')) {
          userMessage = 'DISCOUNT CODE IS INVALID.'
        } else if (errMsg.includes('RABE_EKSPIRE')) {
          userMessage = 'DISCOUNT CODE HAS EXPIRED.'
        } else if (errMsg.includes('RABE_LIMIT_ATENN')) {
          userMessage = 'DISCOUNT CODE USAGE LIMIT REACHED.'
        } else if (errMsg.includes('RABE_MINIMÒM_ENSIFIZAN')) {
          userMessage = 'ORDER DOES NOT MEET MINIMUM FOR THIS DISCOUNT.'
        }

        if (statusEl) {
          statusEl.innerHTML = `<div class="warning">${userMessage}</div>`
        }
        if (btnEl) btnEl.disabled = false
        // Cart is retained so customer doesn't lose items
        return
      }

      // Sove order_id nan sessionStorage pou si kliyan an anile oswa pou paj siksè a
      if (data.order_id) {
        sessionStorage.setItem('nouie_pending_order', String(data.order_id))
      }

      // Redireksyone sou Stripe Checkout Hosted (PA vide panyen an anvan redireksyon!)
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('NO CHECKOUT REDIRECT URL RETURNED')
      }
    } catch (err: any) {
      console.error('Order submission network error:', err)
      if (statusEl) {
        // Detay teknik la rete nan konsòl la sèlman.
        statusEl.innerHTML = '<div class="warning">WE COULD NOT REACH OUR CHECKOUT SERVICE. CHECK YOUR CONNECTION AND TRY AGAIN — YOUR CART IS SAVED.</div>'
      }
      if (btnEl) btnEl.disabled = false
    }
  }

  private renderOrderSuccess(contentDiv: HTMLElement): void {
    SEO.updateMeta('ORDER CONFIRMED', 'Thank you for your NOUIE purchase.')

    const orderId = sessionStorage.getItem('nouie_pending_order')

    // Yon vizitè ki tape #order/success dirèkteman (oswa ki resevwa lyen an) pa
    // gen okenn kòmand an kou: nou pa gen dwa vide panyen l ni di l li peye.
    if (!orderId) {
      contentDiv.innerHTML = `
        <div class="order-success">
          <h1>NO RECENT ORDER</h1>
          <p>We have no checkout session on this device. If you just paid, check your email for the Stripe receipt.</p>
          <a href="#collection" class="btn-continue">CONTINUE BROWSING</a>
        </div>
      `
      return
    }

    // Kliyan an sot nan Stripe: vide panyen an epi montre nimewo kòmand lan
    cartStore.clear()
    const ref = `#INV-${orderId}`
    sessionStorage.removeItem('nouie_pending_order')

    contentDiv.innerHTML = `
      <div class="order-success">
        <div class="success-icon">✓</div>
        <h1>ORDER CONFIRMED & PAID</h1>
        <p>Thank you for your purchase. Your payment was verified through Stripe and your technical units are now queued for fulfillment.</p>
        <p class="order-id">ORDER ${ref}</p>
        <a href="#collection" class="btn-continue">CONTINUE BROWSING</a>
      </div>
    `
  }

  private renderOrderCancel(contentDiv: HTMLElement): void {
    SEO.updateMeta('PAYMENT CANCELLED', 'Your checkout session was cancelled.')
    // Nou kenbe 'nouie_pending_order' nan sessionStorage pou pwochen tantativ pase previous_order_id
    contentDiv.innerHTML = `
      <div class="order-cancelled">
        <div class="cancel-icon">✕</div>
        <h1>PAYMENT CANCELLED</h1>
        <p>Your payment session was cancelled. Your cart is still intact and your items are held for you.</p>
        <div class="cancel-actions" style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: center;">
          <a href="#checkout" class="btn-continue" style="background: var(--color-gold); color: #000; padding: 0.75rem 1.5rem; font-weight: 700; text-decoration: none;">RETURN TO CHECKOUT</a>
          <a href="#collection" class="btn-secondary" style="border: 1px solid var(--border-color); color: var(--color-white); padding: 0.75rem 1.5rem; text-decoration: none;">CONTINUE BROWSING</a>
        </div>
      </div>
    `
  }


  // Ekran « chwazi modpas » pou moun ki rive via yon lyen envitasyon. San li,
  // yon nouvo admin konekte yon sèl fwa via lyen an epi li pa janm gen yon
  // modpas pou pwochen fwa a.
  private async renderSetPassword(contentDiv: HTMLElement): Promise<void> {
    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>SET YOUR PASSWORD</h1>
          <p class="legal-loading">VERIFYING INVITE LINK...</p>
        </div>
      </div>
    `

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      contentDiv.innerHTML = `
        <div class="legal-page">
          <div class="legal-header">
            <h1>LINK EXPIRED</h1>
            <p>THIS INVITE LINK IS NO LONGER VALID.</p>
          </div>
          <div class="legal-content">
            <p>Invite links expire after a short time. Ask the store owner to send you a new one from the admin panel.</p>
          </div>
        </div>
      `
      try { sessionStorage.removeItem('nouie_mande_modpas') } catch (e) { /* mòd prive */ }
      return
    }

    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>SET YOUR PASSWORD</h1>
          <p>${escapeHtml(user.email || '')}</p>
        </div>
        <div class="legal-content">
          <form id="setPasswordForm" class="settings-form">
            <div class="form-group">
              <label>NEW PASSWORD</label>
              <input type="password" id="newPass" autocomplete="new-password" required minlength="10" placeholder="AT LEAST 10 CHARACTERS">
            </div>
            <div class="form-group">
              <label>CONFIRM PASSWORD</label>
              <input type="password" id="newPass2" autocomplete="new-password" required minlength="10" placeholder="TYPE IT AGAIN">
            </div>
            <button type="submit" class="btn-submit-form" id="setPassBtn">SAVE PASSWORD</button>
            <div id="setPassFeedback"></div>
          </form>
        </div>
      </div>
    `

    const form = document.getElementById('setPasswordForm') as HTMLFormElement
    const fb = document.getElementById('setPassFeedback')!
    const btn = document.getElementById('setPassBtn') as HTMLButtonElement

    form?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const p1 = (document.getElementById('newPass') as HTMLInputElement).value
      const p2 = (document.getElementById('newPass2') as HTMLInputElement).value

      if (p1.length < 10) {
        fb.innerHTML = '<span class="error">PASSWORD MUST BE AT LEAST 10 CHARACTERS.</span>'
        return
      }
      if (p1 !== p2) {
        fb.innerHTML = '<span class="error">THE TWO PASSWORDS DO NOT MATCH.</span>'
        return
      }

      btn.disabled = true
      fb.innerHTML = '<span class="loading">SAVING...</span>'

      const { error } = await supabase.auth.updateUser({ password: p1 })

      if (error) {
        btn.disabled = false
        fb.innerHTML = `<span class="error">${escapeHtml(error.message)}</span>`
        return
      }

      try { sessionStorage.removeItem('nouie_mande_modpas') } catch (err) { /* mòd prive */ }
      fb.innerHTML = '<span class="success">PASSWORD SAVED. OPENING ADMIN...</span>'
      setTimeout(() => { window.location.hash = '#admin' }, 900)
    })
  }

  private async renderAdmin(contentDiv: HTMLElement): Promise<void> {
    // Delegate to refactored AdminDashboard component
    const { AdminDashboard } = await import('./AdminDashboard')
    const adminDashboard = new AdminDashboard(contentDiv)
    await adminDashboard.render()
  }
}
