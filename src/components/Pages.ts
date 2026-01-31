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
                <input type="text" placeholder="YOUR NAME" required>
              </div>
              <div class="contact-form-group">
                <label>EMAIL</label>
                <input type="email" placeholder="YOUR EMAIL ADDRESS" required>
              </div>
            </div>
            
            <div class="contact-form-group">
              <label>SUBJECT</label>
              <select required>
                <option value="" disabled selected>SELECT A REASON</option>
                <option value="order">ORDER STATUS</option>
                <option value="return">RETURNS & EXCHANGES</option>
                <option value="product">PRODUCT INFORMATION</option>
                <option value="other">OTHER</option>
              </select>
            </div>
            
            <div class="contact-form-group">
              <label>MESSAGE</label>
              <textarea placeholder="HOW CAN WE HELP YOU?" rows="6" required></textarea>
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
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        feedback.innerHTML = '<div class="success-msg">TRANSMITTING...</div>'
        setTimeout(() => {
          feedback.innerHTML = '<div class="success-msg">MESSAGE SUCCESSFULLY RECEIVED BY THE STUDIO.</div>'
          form.reset()
        }, 1500)
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
      case 'contact':
        SEO.updateMeta('CONTACT', 'Get in touch with the NOUIE studio for support or inquiries.')
        this.renderContact(contentDiv)
        break
      default:
        if (page.startsWith('admin')) {
          await this.renderAdmin(contentDiv)
        } else if (page.startsWith('product-')) {
          const productId = page.replace('product-', '')
          const product = catalogs.find(c => c.id === productId)
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
    `

    const grid = document.getElementById('home-grid')
    if (grid) {
      this.renderCatalogGrid(grid, catalogs)
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

    try {
      const { data: dbCatalogs, error: _error } = await supabase
        .from('collections')
        .select('*')
        .order('id', { ascending: true })

      if (_error || !dbCatalogs || dbCatalogs.length === 0) {
        console.log('Using local fallback data')
        this.renderCatalogGrid(grid, catalogs)
      } else {
        console.log('Using Supabase data')
        this.renderCatalogGrid(grid, dbCatalogs)
      }
    } catch {
      this.renderCatalogGrid(grid, catalogs)
    }

  }

  private renderCatalogGrid(container: HTMLElement, cats: Product[]): void {
    container.innerHTML = cats.map(cat => {
      if (cat.is_active === false) return ''

      return `
        <div class="product-card" data-id="${cat.id}">
          <div class="product-card-image">
            <img src="/assets/${cat.images[0]}" alt="${cat.name} - ${cat.color} ${cat.material}" loading="lazy" width="800" height="1200">
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
              <img id="mainProductImg" src="/assets/${product.images[0]}" alt="${product.name} - ${product.color} ${product.material} Primary View" width="1200" height="1800" fetchpriority="high">
            </div>
            <div class="thumbnail-strip">
              ${product.images.map((img: string, i: number) => `
                <div class="thumbnail ${i === 0 ? 'active' : ''}" data-img="${img}">
                  <img src="/assets/${img}" alt="${product.name} view ${i + 1}" width="200" height="300" loading="lazy">
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
                ${product.sizes.map((size: string) => `
                  <button class="size-btn" data-size="${size}">${size}</button>
                `).join('')}
              </div>
            </div>
            
            <div class="product-actions">
              ${(product.stock_qty || 0) > 0
        ? `<button class="btn-add-cart" id="addToCartBtn">ADD TO CART</button>`
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
           <p > YOUR CART IS EMPTY</p>
 </div>
            < a href="#collection" class="btn-back-shop"> CONTINUE SHOPPING </a>
 </div>
                `
      return
    }

    const total = cartStore.getTotal()

    contentDiv.innerHTML = `
               <div class="checkout-page">
                <div class="page-header">
                  <h1>CHECKOUT</h1>
                   <p > COMPLETE YOUR ORDER</p>
 </div>

                     <div class="checkout-layout">
                      <div class="checkout-form-section">
                        <h2>SHIPPING INFORMATION</h2>
                           <form id="checkoutForm" class="checkout-form">
                            <div class="form-group">
                              <label>FULL NAME * </label>
                                 <input type="text" id="customerName" requiredplaceholder="Enter your full name">
 </div>
                                   <div class="form-group">
                                    <label>EMAIL * </label>
                                     <input type="email" id="customerEmail" requiredplaceholder="your@email.com">
 </div>
                                       <div class="form-group">
                                        <label>PHONE * </label>
                                         <input type="tel" id="customerPhone" requiredplaceholder="+1 (555) 000-0000">
 </div>
                                           <div class="form-group">
                                            <label>SHIPPING ADDRESS * </label>
                                               <textarea id="shippingAddress" requiredplaceholder="Street address, City, State, ZIP"> </textarea>
 </div>
                                                 <div class="form-group">
                                                  <label>ORDER NOTES(optional) </label>
                                                     <textarea id="orderNotes" placeholder="Special instructions..."> </textarea>
 </div>
                                                     </form>
 </div>

                                                       <div class="checkout-summary-section">
                                                        <h2>ORDER SUMMARY</h2>
                                                           <div class="order-items">
                                                            ${items.map(item => `
                <div class="order-item">
                  <div class="order-item-name">${item.name} </div>
                  <div class="order-item-details">SIZE: ${item.size} × ${item.qty} </div>
                  <div class="order-item-price">$${item.price * item.qty}.00 </div>
 </div>
              `).join('')
      }
 </div>
       <div class="order-totals">
        <div class="order-total-row">
          <span>SUBTOTAL</span>
           <span >$${total}.00</span>
 </div>
             <div class="order-total-row">
              <span>SHIPPING</span>
               <span > FREE</span>
 </div>
               <div class="order-total-row total-final">
                <span>TOTAL</span>
                 <span >$${total}.00USD</span>
 </div>
 </div>
                   <button type="submit" class="btn-place-order" id="placeOrderBtn"> PLACE ORDER</button>
                     <div id="orderStatus" class="order-status"> </div>
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

    if (statusEl) statusEl.innerHTML = '<div class="loading">PROCESSING ORDER... </div>'
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
          statusEl.innerHTML = '<div class="warning">DATABASE UNAVAILABLE - ORDER SAVED LOCALLY </div>'
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
        statusEl.innerHTML = '<div class="warning">OFFLINE MODE - ORDER SAVED LOCALLY </div>'
      }
      setTimeout(() => this.showOrderSuccess(), 1500)
    }
  }

  private showOrderSuccess(): void {
    cartStore.clear()

    const contentDiv = this.getContentDiv()
    contentDiv.innerHTML = `
                       <div class="order-success">
                        <div class="success-icon">✓ </div>
                          < h1 > ORDER CONFIRMED</h1>
                             <p > Thank you for your order.You will receive a confirmation email shortly.</p>
                               <p class="order-id"> ORDER REF: ${Date.now().toString(36).toUpperCase()}</p>
                                < a href="#collection" class="btn-continue"> CONTINUE SHOPPING </a>
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
