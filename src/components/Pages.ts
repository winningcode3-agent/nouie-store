// Pages Component - Renders all page content

import { supabase } from '../lib/supabase'
import { cartStore } from '../lib/store'
import { catalogs, archiveSeasons } from '../lib/data'
import type { Product } from '../lib/types'
import { SEO } from '../lib/seo'

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

  private renderShipping(contentDiv: HTMLElement): void {
    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>SHIPPING POLICY</h1>
          <p>LAST UPDATED: JANUARY 2026</p>
        </div>
        
        <div class="legal-content">
          <section class="legal-section">
            <h2>ORDER PROCESSING</h2>
            <p>ALL ORDERS ARE PROCESSED WITHIN 2-4 BUSINESS DAYS (EXCLUDING WEEKENDS AND HOLIDAYS) AFTER RECEIVING YOUR ORDER CONFIRMATION EMAIL. YOU WILL RECEIVE ANOTHER NOTIFICATION WHEN YOUR ORDER HAS SHIPPED.</p>
            <p>PLEASE NOTE THAT DURING HIGH-VOLUME PERIODS OR NEW RELEASES, PROCESSING TIMES MAY BE SLIGHTLY EXTENDED.</p>
          </section>

          <section class="legal-section">
            <h2>DOMESTIC SHIPPING (USA)</h2>
            <div class="shipping-table">
              <div class="table-row table-header">
                <div>METHOD</div>
                <div>ESTIMATED DELIVERY</div>
                <div>COST</div>
              </div>
              <div class="table-row">
                <div>STANDARD</div>
                <div>5-7 BUSINESS DAYS</div>
                <div>$10.00</div>
              </div>
              <div class="table-row">
                <div>EXPRESS</div>
                <div>2-3 BUSINESS DAYS</div>
                <div>$25.00</div>
              </div>
            </div>
            <p>FREE STANDARD SHIPPING ON DOMESTIC ORDERS OVER $250.</p>
          </section>

          <section class="legal-section">
            <h2>INTERNATIONAL SHIPPING</h2>
            <p>WE SHIP WORLDWIDE. SHIPPING CHARGES FOR YOUR ORDER WILL BE CALCULATED AND DISPLAYED AT CHECKOUT.</p>
            <div class="shipping-table">
              <div class="table-row table-header">
                <div>REGION</div>
                <div>ESTIMATED DELIVERY</div>
                <div>COST</div>
              </div>
              <div class="table-row">
                <div>CANADA</div>
                <div>7-14 BUSINESS DAYS</div>
                <div>CALCULATED AT CHECKOUT</div>
              </div>
              <div class="table-row">
                <div>EUROPE / ASIA</div>
                <div>10-21 BUSINESS DAYS</div>
                <div>CALCULATED AT CHECKOUT</div>
              </div>
            </div>
            <p><strong>CUSTOMS, DUTIES, AND TAXES:</strong> NOUIE IS NOT RESPONSIBLE FOR ANY CUSTOMS AND TAXES APPLIED TO YOUR ORDER. ALL FEES IMPOSED DURING OR AFTER SHIPPING ARE THE RESPONSIBILITY OF THE CUSTOMER (TARIFFS, TAXES, ETC.).</p>
          </section>

          <section class="legal-section">
            <h2>TRACKING YOUR ORDER</h2>
            <p>WHEN YOUR ORDER HAS SHIPPED, YOU WILL RECEIVE AN EMAIL NOTIFICATION FROM US WHICH WILL INCLUDE A TRACKING NUMBER YOU CAN USE TO CHECK ITS STATUS. PLEASE ALLOW 48 HOURS FOR THE TRACKING INFORMATION TO BECOME AVAILABLE.</p>
            <p>IF YOU HAVE NOT RECEIVED YOUR ORDER WITHIN 14 DAYS OF RECEIVING YOUR SHIPPING CONFIRMATION EMAIL, PLEASE CONTACT US AT SUPPORT@NOUIE.COM WITH YOUR NAME AND ORDER NUMBER, AND WE WILL LOOK INTO IT FOR YOU.</p>
          </section>
        </div>
      </div>
    `
  }

  private renderReturns(contentDiv: HTMLElement): void {
    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>RETURNS & EXCHANGES</h1>
          <p>LAST UPDATED: JANUARY 2026</p>
        </div>
        
        <div class="legal-content">
          <section class="legal-section">
            <h2>RETURN POLICY</h2>
            <p>WE WANT YOU TO BE COMPLETELY SATISFIED WITH YOUR PURCHASE. IF YOU ARE NOT SATISFIED, YOU MAY RETURN YOUR ITEM(S) WITHIN 14 DAYS OF DELIVERY FOR AN EXCHANGE OR STORE CREDIT.</p>
            <p><strong>PLEASE NOTE:</strong> ALL RETURNS MUST BE IN THEIR ORIGINAL CONDITION—UNWORN, UNWASHED, AND WITH ALL TAGS ATTACHED. ITEMS THAT DO NOT MEET THESE CRITERIA WILL BE DENIED.</p>
          </section>

          <section class="legal-section">
            <h2>EXCHANGES</h2>
            <p>WE ONLY OFFER EXCHANGES FOR DIFFERENT SIZES OF THE SAME ITEM, SUBJECT TO AVAILABILITY. IF THE DESIRED SIZE IS OUT OF STOCK, A STORE CREDIT WILL BE ISSUED.</p>
          </section>

          <section class="legal-section">
            <h2>RETURN PROCESS</h2>
            <p>TO INITIATE A RETURN, PLEASE FOLLOW THESE STEPS:</p>
            <ol class="legal-list">
              <li>EMAIL <strong>RETURNS@NOUIE.COM</strong> WITH YOUR ORDER NUMBER AND THE ITEM(S) YOU WISH TO RETURN.</li>
              <li>ONCE APPROVED, YOU WILL RECEIVE A RETURN AUTHORIZATION NUMBER AND THE RETURN SHIPPING ADDRESS.</li>
              <li>PACK YOUR ITEM(S) SECURELY AND INCLUDE THE RETURN AUTHORIZATION NUMBER INSIDE THE PACKAGE.</li>
              <li>SHIP THE PACKAGE USING A TRACKABLE SHIPPING METHOD.</li>
            </ol>
            <p>CUSTOMERS ARE RESPONSIBLE FOR RETURN SHIPPING COSTS UNLESS THE ITEM RECEIVED WAS DAMAGED OR INCORRECT.</p>
          </section>

          <section class="legal-section">
            <h2>REFUNDS & STORE CREDIT</h2>
            <p>ONCE YOUR RETURN IS RECEIVED AND INSPECTED, WE WILL NOTIFY YOU OF THE APPROVAL OR REJECTION OF YOUR RETURN.</p>
            <p>IF APPROVED, A STORE CREDIT WILL BE ISSUED IN THE FORM OF A DIGITAL GIFT CARD WITHIN 5-7 BUSINESS DAYS. PLEASE NOTE THAT INITIAL SHIPPING COSTS ARE NON-REFUNDABLE.</p>
          </section>

          <section class="legal-section">
            <h2>FINAL SALE ITEMS</h2>
            <p>ITEMS MARKED AS "FINAL SALE" OR PURCHASED DURING ARCHIVE RELEASES ARE NOT ELIGIBLE FOR RETURN OR EXCHANGE. PLEASE REVIEW PRODUCT DESCRIPTIONS CAREFULLY BEFORE PURCHASING.</p>
          </section>
        </div>
      </div>
    `
  }

  private renderPrivacy(contentDiv: HTMLElement): void {
    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>PRIVACY POLICY</h1>
          <p>LAST UPDATED: JANUARY 2026</p>
        </div>
        
        <div class="legal-content">
          <section class="legal-section">
            <h2>OVERVIEW</h2>
            <p>THIS PRIVACY POLICY DESCRIBES HOW YOUR PERSONAL INFORMATION IS COLLECTED, USED, AND SHARED WHEN YOU VISIT OR MAKE A PURCHASE FROM NOUIE.COM. WE ARE COMMITTED TO PROTECTING YOUR PRIVACY AND ENSURING A SECURE SHOPPING EXPERIENCE.</p>
          </section>

          <section class="legal-section">
            <h2>INFORMATION WE COLLECT</h2>
            <p>WHEN YOU VISIT THE SITE, WE AUTOMATICALLY COLLECT CERTAIN INFORMATION ABOUT YOUR DEVICE, INCLUDING INFORMATION ABOUT YOUR WEB BROWSER, IP ADDRESS, TIME ZONE, AND SOME OF THE COOKIES THAT ARE INSTALLED ON YOUR DEVICE.</p>
            <p>ADDITIONALLY, WHEN YOU MAKE A PURCHASE OR ATTEMPT TO MAKE A PURCHASE THROUGH THE SITE, WE COLLECT CERTAIN INFORMATION FROM YOU, INCLUDING YOUR NAME, BILLING ADDRESS, SHIPPING ADDRESS, PAYMENT INFORMATION (INCLUDING CREDIT CARD NUMBERS), EMAIL ADDRESS, AND PHONE NUMBER.</p>
          </section>

          <section class="legal-section">
            <h2>HOW DO WE USE YOUR PERSONAL INFORMATION?</h2>
            <p>WE USE THE ORDER INFORMATION THAT WE COLLECT GENERALLY TO FULFILL ANY ORDERS PLACED THROUGH THE SITE (INCLUDING PROCESSING YOUR PAYMENT INFORMATION, ARRANGING FOR SHIPPING, AND PROVIDING YOU WITH INVOICES AND/OR ORDER CONFIRMATIONS).</p>
            <p>ADDITIONALLY, WE USE THIS ORDER INFORMATION TO:</p>
            <ul class="legal-list">
              <li>COMMUNICATE WITH YOU;</li>
              <li>SCREEN OUR ORDERS FOR POTENTIAL RISK OR FRAUD; AND</li>
              <li>PROVIDE YOU WITH INFORMATION OR ADVERTISING RELATING TO OUR PRODUCTS OR SERVICES.</li>
            </ul>
          </section>

          <section class="legal-section">
            <h2>DATA RETENTION</h2>
            <p>WHEN YOU PLACE AN ORDER THROUGH THE SITE, WE WILL MAINTAIN YOUR ORDER INFORMATION FOR OUR RECORDS UNLESS AND UNTIL YOU ASK US TO DELETE THIS INFORMATION.</p>
          </section>

          <section class="legal-section">
            <h2>CHANGES</h2>
            <p>WE MAY UPDATE THIS PRIVACY POLICY FROM TIME TO TIME IN ORDER TO REFLECT, FOR EXAMPLE, CHANGES TO OUR PRACTICES OR FOR OTHER OPERATIONAL, LEGAL, OR REGULATORY REASONS.</p>
          </section>

          <section class="legal-section">
            <h2>CONTACT US</h2>
            <p>FOR MORE INFORMATION ABOUT OUR PRIVACY PRACTICES, IF YOU HAVE QUESTIONS, OR IF YOU WOULD LIKE TO MAKE A COMPLAINT, PLEASE CONTACT US BY E-MAIL AT <strong>PRIVACY@NOUIE.COM</strong>.</p>
          </section>
        </div>
      </div>
    `
  }

  private renderTerms(contentDiv: HTMLElement): void {
    contentDiv.innerHTML = `
      <div class="legal-page">
        <div class="legal-header">
          <h1>TERMS OF SERVICE</h1>
          <p>LAST UPDATED: MARCH 2026</p>
        </div>
        
        <div class="legal-content">
          <section class="legal-section">
            <h2>OVERVIEW</h2>
            <p>THIS WEBSITE IS OPERATED BY NOUIE. THROUGHOUT THE SITE, THE TERMS "WE", "US" AND "OUR" REFER TO NOUIE. NOUIE OFFERS THIS WEBSITE, INCLUDING ALL INFORMATION, TOOLS AND SERVICES AVAILABLE FROM THIS SITE TO YOU, THE USER, CONDITIONED UPON YOUR ACCEPTANCE OF ALL TERMS, CONDITIONS, POLICIES AND NOTICES STATED HERE.</p>
          </section>

          <section class="legal-section">
            <h2>ONLINE STORE TERMS</h2>
            <p>BY AGREEING TO THESE TERMS OF SERVICE, YOU REPRESENT THAT YOU ARE AT LEAST THE AGE OF MAJORITY IN YOUR JURISDICTION. YOU MAY NOT USE OUR PRODUCTS FOR ANY ILLEGAL OR UNAUTHORIZED PURPOSE NOR MAY YOU, IN THE USE OF THE SERVICE, VIOLATE ANY LAWS IN YOUR JURISDICTION.</p>
          </section>

          <section class="legal-section">
            <h2>MODIFICATIONS TO SERVICE AND PRICES</h2>
            <p>PRICES FOR OUR PRODUCTS ARE SUBJECT TO CHANGE WITHOUT NOTICE. WE RESERVE THE RIGHT AT ANY TIME TO MODIFY OR DISCONTINUE THE SERVICE (OR ANY PART OR CONTENT THEREOF) WITHOUT NOTICE.</p>
          </section>

          <section class="legal-section">
            <h2>PRODUCTS AND INVENTORY</h2>
            <p>CERTAIN PRODUCTS MAY BE AVAILABLE EXCLUSIVELY ONLINE IN LIMITED QUANTITIES AND ARE SUBJECT TO RETURN OR EXCHANGE ONLY ACCORDING TO OUR RETURN POLICY. WE RESERVE THE RIGHT TO LIMIT THE QUANTITIES OF ANY PRODUCTS OR SERVICES THAT WE OFFER.</p>
          </section>

          <section class="legal-section">
            <h2>ACCURACY OF BILLING AND ORDERS</h2>
            <p>WE RESERVE THE RIGHT TO REFUSE ANY ORDER YOU PLACE WITH US. IN THE EVENT THAT WE MAKE A CHANGE TO OR CANCEL AN ORDER, WE WILL ATTEMPT TO NOTIFY YOU BY CONTACTING THE EMAIL AND/OR BILLING ADDRESS/PHONE NUMBER PROVIDED AT THE TIME THE ORDER WAS MADE.</p>
          </section>

          <section class="legal-section">
            <h2>INTELLECTUAL PROPERTY</h2>
            <p>ALL CONTENT, GRAPHICS, INDUSTRIAL DESIGNS, LOGOS, AND PRODUCT IMAGERY ARE THE EXCLUSIVE PROPERTY OF NOUIE AND PROTECTED BY COPYRIGHT AND TRADEMARK LAWS.</p>
          </section>

          <section class="legal-section">
            <h2>GOVERNING LAW</h2>
            <p>THESE TERMS OF SERVICE AND ANY SEPARATE AGREEMENTS WHEREBY WE PROVIDE YOU PRODUCTS SHALL BE GOVERNED BY AND CONSTRUED IN ACCORDANCE WITH APPLICABLE LAWS.</p>
          </section>
        </div>
      </div>
    `
  }

  private renderContact(contentDiv: HTMLElement): void {
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
              <a href="mailto:SUPPORT@NOUIE.COM" class="contact-link">SUPPORT@NOUIE.COM</a>
            </div>
            
            <div class="contact-card">
              <h3>WHOLESALE & STUDIO</h3>
              <p>FOR BUSINESS INQUIRIES OR PARTNERSHIPS:</p>
              <a href="mailto:STUDIO@NOUIE.COM" class="contact-link">STUDIO@NOUIE.COM</a>
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
        this.renderArchive(contentDiv)
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
        this.renderCheckout(contentDiv)
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
            contentDiv.innerHTML = '<div class="page-header"><h1>PRODUCT NOT FOUND</h1> </div>'
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
        <div id="collection-grid" class="collection-grid">
          <div class="loading-state">
            LOADING COLLECTION...
          </div>
        </div>
      </div>
    `

    const grid = document.getElementById('collection-grid')
    if (!grid) return

    const products = await this.getProducts()
    this.renderCatalogGrid(grid, products)
  }

  private renderCatalogGrid(container: HTMLElement, cats: Product[]): void {
    container.innerHTML = cats.map(cat => {
      if (cat.is_active === false) return ''

      return `
        <div class="product-card" data-id="${cat.id}">
          <div class="product-card-image">
            <img src="${this.getImageSrc(cat.images?.[0])}" alt="${cat.name} - ${cat.color} ${cat.material}" loading="lazy" width="800" height="1200">
            <div class="quick-add-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
 </div>
 </div>
          <div class="product-card-info">
            <h3 class="product-card-title">${cat.name}</h3>
            <div class="product-card-price">$${cat.price.toFixed(2)} </div>
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
              <img id="mainProductImg" src="${this.getImageSrc(product.images?.[0])}" alt="${product.name} - ${product.color} ${product.material} Primary View" width="1200" height="1800" fetchpriority="high">
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
            <div class="product-price">$${product.price.toFixed(2)} </div>
            
            <p class="product-description">${product.description}</p>
            
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
            
            <div class="cart-feedback" id="cartFeedback"> </div>
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

  private renderArchive(contentDiv: HTMLElement): void {
    contentDiv.innerHTML = `
      <div class="archive-page">
        
        <div class="archive-grid">
          ${archiveSeasons.map(season => `
            <div class="archive-season-card" data-season="${season.id}">
              <div class="archive-images">
                ${season.images.map(img => `
                  <div class="archive-img"><img src="/assets/${img}" alt="NOUIE Archive - ${season.title} - ${season.year}" width="400" height="600" loading="lazy"> </div>
                `).join('')}
 </div>
              <div class="archive-content">
                <div class="archive-year-badge">${season.year} </div>
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
      <div class="studio-page">
        <div class="studio-content">
          <section>
            <h2>WE MOVE FORWARD.</h2>
            <p>NOUIE is a design studio focused on the evolution of streetwear through technical precision and architectural symmetry. Our process is rooted in the intersection of utilitarian function and minimalist clarity.</p>
         </section>
 </div>
 </div>
    `
  }

  private renderLookbook(contentDiv: HTMLElement): void {
    const looks = [
      { id: 'LOOK_01', image: 'cat1_1.jpg', product: 'CAT01' },
      { id: 'LOOK_02', image: 'cat2_1.jpg', product: 'CAT02' },
      { id: 'LOOK_03', image: 'cat3_1.png', product: 'CAT03' },
      { id: 'LOOK_04', image: 'cat1_2.jpg', product: 'CAT01' },
      { id: 'LOOK_05', image: 'cat2_2.jpg', product: 'CAT02' },
      { id: 'LOOK_06', image: 'cat3_2.png', product: 'CAT03' }
    ]

    contentDiv.innerHTML = `
      <div class="lookbook-page">
        <div class="lookbook-grid">
          ${looks.map(look => `
            <div class="lookbook-item" data-product="${look.product}">
              <div class="lookbook-image">
                <img src="/assets/${look.image}" alt="NOUIE Lookbook - ${look.id}" width="600" height="900" loading="lazy">
              </div>
              <div class="lookbook-info">
                <span>${look.id}</span>
 </div>
 </div>
          `).join('')}
 </div>
 </div>
    `

    // Add click handlers to navigate to product
    contentDiv.querySelectorAll('.lookbook-item').forEach(item => {
      item.addEventListener('click', () => {
        const productId = item.getAttribute('data-product')
        if (productId) window.location.hash = `#product-${productId}`
      })
      ;(item as HTMLElement).style.cursor = 'pointer'
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

    const subtotal = cartStore.getTotal()
    let shippingMethod: 'standard' | 'express' = 'standard'

    const calcShipping = (method: 'standard' | 'express', sub: number) => {
      if (method === 'express') return 25.00
      return sub >= 250 ? 0.00 : 10.00
    }

    const renderTotals = () => {
      const shipCost = calcShipping(shippingMethod, subtotal)
      const finalTotal = subtotal + shipCost
      const shipText = shippingMethod === 'standard' && subtotal >= 250 ? 'FREE' : `$${shipCost.toFixed(2)}`

      const shipEl = document.getElementById('checkoutShippingCost')
      const totalEl = document.getElementById('checkoutFinalTotal')
      if (shipEl) shipEl.textContent = shipText
      if (totalEl) totalEl.textContent = `$${finalTotal.toFixed(2)} USD`
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
                    <span>STANDARD (5-7 BUSINESS DAYS) — $10.00 (FREE OVER $250)</span>
                  </label>
                  <label class="shipping-option">
                    <input type="radio" name="shippingMethod" value="express">
                    <span>EXPRESS (2-3 BUSINESS DAYS) — $25.00</span>
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

            <div class="order-totals">
              <div class="order-total-row">
                <span>SUBTOTAL</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              <div class="order-total-row">
                <span>SHIPPING</span>
                <span id="checkoutShippingCost">${shippingMethod === 'standard' && subtotal >= 250 ? 'FREE' : '$10.00'}</span>
              </div>
              <div class="order-total-row total-final">
                <span>TOTAL</span>
                <span id="checkoutFinalTotal">$${(subtotal + calcShipping(shippingMethod, subtotal)).toFixed(2)} USD</span>
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

    document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
      const form = document.getElementById('checkoutForm') as HTMLFormElement
      if (!form.checkValidity()) {
        form.reportValidity()
        return
      }
      await this.submitOrder(shippingMethod)
    })
  }

  private async submitOrder(shippingMethod: 'standard' | 'express'): Promise<void> {
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
      p_shipping_method: shippingMethod
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
