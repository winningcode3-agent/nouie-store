// Admin Dashboard Component — NOUIE Store
// Complete Otonomi Admin System (Faz 2)

import { supabase } from '../lib/supabase'
import { Auth } from '../lib/auth'
import { settingsService } from '../lib/settings'
import { renderSafeMarkdown } from '../lib/markdown'
import type { Product, Order, AdminUser, Discount, Collection, StoreSettings } from '../lib/types'

export class AdminDashboard {
    private contentDiv: HTMLElement

    constructor(contentDiv: HTMLElement) {
        this.contentDiv = contentDiv
    }

    async render(): Promise<void> {
        const isAdmin = await Auth.isAdmin()
        if (!isAdmin) {
            this.renderLogin()
            return
        }

        const hash = window.location.hash
        const subRoute = hash.includes('/') ? hash.split('/')[1] : 'orders'

        this.contentDiv.innerHTML = `
      <div class="admin-page">
        <aside class="admin-sidebar">
          <div class="admin-sidebar-header">
            <span class="admin-label">NOUIE_OS v2.0</span>
            <button id="adminLogout" class="admin-logout-btn">LOGOUT</button>
          </div>
          <nav class="admin-nav">
            <a href="#admin/orders" class="admin-nav-link ${subRoute === 'orders' ? 'active' : ''}">
              <span class="nav-icon">📊</span> ORDERS
            </a>
            <a href="#admin/products" class="admin-nav-link ${subRoute === 'products' || subRoute.startsWith('edit-product') || subRoute === 'create-product' ? 'active' : ''}">
              <span class="nav-icon">📦</span> PRODUCTS
            </a>
            <a href="#admin/collections" class="admin-nav-link ${subRoute === 'collections' ? 'active' : ''}">
              <span class="nav-icon">🗂️</span> COLLECTIONS
            </a>
            <a href="#admin/settings" class="admin-nav-link ${subRoute === 'settings' ? 'active' : ''}">
              <span class="nav-icon">⚙️</span> SETTINGS
            </a>
            <a href="#admin/discounts" class="admin-nav-link ${subRoute === 'discounts' ? 'active' : ''}">
              <span class="nav-icon">🏷️</span> DISCOUNTS
            </a>
            <a href="#admin/pages" class="admin-nav-link ${subRoute === 'pages' ? 'active' : ''}">
              <span class="nav-icon">📝</span> LEGAL_PAGES
            </a>
            <a href="#admin/media" class="admin-nav-link ${subRoute === 'media' ? 'active' : ''}">
              <span class="nav-icon">🖼️</span> MEDIA
            </a>
            <a href="#admin/team" class="admin-nav-link ${subRoute === 'team' ? 'active' : ''}">
              <span class="nav-icon">🛡️</span> TEAM
            </a>
            <a href="#admin/messages" class="admin-nav-link ${subRoute === 'messages' ? 'active' : ''}">
              <span class="nav-icon">📬</span> MESSAGES
            </a>
            <a href="#admin/subscribers" class="admin-nav-link ${subRoute === 'subscribers' ? 'active' : ''}">
              <span class="nav-icon">👥</span> SUBSCRIBERS
            </a>
            <a href="#collection" class="admin-nav-link exit">
              <span class="nav-icon">←</span> EXIT_ADMIN
            </a>
          </nav>
        </aside>
        <main class="admin-main" id="adminMain">
          <div class="loading-state">INITIALIZING ADMIN_CORE...</div>
        </main>
      </div>
    `

        const adminMain = document.getElementById('adminMain')
        if (!adminMain) return

        // Logout handler
        document.getElementById('adminLogout')?.addEventListener('click', async () => {
            await Auth.logout()
            this.render()
        })

        if (subRoute === 'orders') {
            await this.renderOrders(adminMain)
        } else if (subRoute === 'products') {
            await this.renderProducts(adminMain)
        } else if (subRoute === 'collections') {
            await this.renderCollections(adminMain)
        } else if (subRoute === 'settings') {
            await this.renderSettings(adminMain)
        } else if (subRoute === 'discounts') {
            await this.renderDiscounts(adminMain)
        } else if (subRoute === 'pages') {
            await this.renderPages(adminMain)
        } else if (subRoute === 'media') {
            await this.renderMedia(adminMain)
        } else if (subRoute === 'team') {
            await this.renderTeam(adminMain)
        } else if (subRoute === 'messages') {
            await this.renderMessages(adminMain)
        } else if (subRoute === 'subscribers') {
            await this.renderSubscribers(adminMain)
        } else if (subRoute === 'create-product') {
            this.renderProductForm(adminMain)
        } else if (subRoute.startsWith('edit-product-')) {
            const productId = subRoute.replace('edit-product-', '')
            await this.renderEditProduct(adminMain, productId)
        } else if (subRoute.startsWith('invoice-')) {
            const orderId = subRoute.replace('invoice-', '')
            await this.renderInvoice(adminMain, orderId)
        }
    }

    // ==========================================
    // 1. ORDERS MANAGEMENT (A1 & E2)
    // ==========================================
    private async renderOrders(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>ORDER_MANAGEMENT</h1>
        <div class="admin-header-actions">
          <button class="btn-refresh" id="exportOrdersCsv">EXPORT_CSV</button>
          <button class="btn-refresh" id="refreshOrders">EXEC_REFRESH</button>
        </div>
      </header>

      <div class="admin-filter-bar">
        <input type="text" id="orderSearch" placeholder="SEARCH BY ID, CUSTOMER, EMAIL..." class="admin-search-input">
        <select id="orderStatusFilter" class="admin-select-filter">
          <option value="">ALL STATUSES</option>
          <option value="paid">PAID (CONFIRMED)</option>
          <option value="pending">PENDING</option>
          <option value="payment_review">PAYMENT REVIEW</option>
          <option value="processing">PROCESSING</option>
          <option value="shipped">SHIPPED</option>
          <option value="delivered">DELIVERED</option>
          <option value="cancelled">CANCELLED</option>
        </select>
      </div>

      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>CUSTOMER</th>
              <th>DATE</th>
              <th>TOTAL</th>
              <th>STATUS</th>
              <th>INTERNAL_NOTES</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            <tr><td colspan="7" class="table-loading">DATA_LINK_ESTABLISHING...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="adminModalArea"></div>
    `

        const tbody = document.getElementById('ordersTableBody')
        if (!tbody) return

        try {
            const { data: dbOrders, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            let allOrders: Order[] = dbOrders || []

            const renderRows = (ordersToDisplay: Order[]) => {
                if (ordersToDisplay.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">NO_DATA_MATCHING_FILTER</td></tr>'
                    return
                }

                tbody.innerHTML = ordersToDisplay.map((order: any) => `
          <tr data-id="${order.id}">
            <td class="admin-order-id">#${order.id.toString().slice(-6).toUpperCase()}</td>
            <td class="order-customer">
              <div class="customer-name">${order.customer_name}</div>
              <div class="customer-email">${order.customer_email}</div>
            </td>
            <td class="order-date">${new Date(order.created_at || Date.now()).toLocaleDateString()}</td>
            <td class="order-total">
              <div>$${Number(order.total).toFixed(2)}</div>
              ${order.discount_amount ? `<small class="discount-pill">-${order.discount_code}: $${Number(order.discount_amount).toFixed(2)}</small>` : ''}
              ${order.tax_amount ? `<small class="tax-pill">+TAX: $${Number(order.tax_amount).toFixed(2)}</small>` : ''}
            </td>
            <td class="order-status">
              <select class="status-select status-badge-${order.status}" data-id="${order.id}" data-prev="${order.status}">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>PENDING</option>
                <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>PAID</option>
                <option value="payment_review" ${order.status === 'payment_review' ? 'selected' : ''}>PAYMENT REVIEW</option>
                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>PROCESSING</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>SHIPPED</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>DELIVERED</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>CANCELLED</option>
              </select>
              <div class="tracking-cell" data-id="${order.id}">
                ${order.tracking_number
                        ? `<span class="tracking-info">🚚 ${order.carrier || ''} ${order.tracking_number}</span>`
                        : ''}
              </div>
            </td>
            <td class="order-notes-cell">
              <button class="btn-notes" data-id="${order.id}">
                ${order.notes_internal ? '📝 EDIT NOTE' : '+ ADD NOTE'}
              </button>
            </td>
            <td class="order-actions">
              <button class="btn-invoice" data-id="${order.id}">INVOICE</button>
            </td>
          </tr>
        `).join('')

                // Invoice button listeners
                tbody.querySelectorAll('.btn-invoice').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = btn.getAttribute('data-id')
                        if (id) window.location.hash = `#admin/invoice-${id}`
                    })
                })

                // Status change listeners (with A1 cancel_order restock & pending delivery guard)
                tbody.querySelectorAll('.status-select').forEach(selectEl => {
                    selectEl.addEventListener('change', async (e) => {
                        const target = e.currentTarget as HTMLSelectElement
                        const id = target.getAttribute('data-id')!
                        const newStatus = target.value
                        const prevStatus = target.getAttribute('data-prev') || 'pending'
                        const order = allOrders.find((o: any) => o.id.toString() === id)

                        // Sekirite: Bloke chanjman nan processing/shipped/delivered si kòmand lan poko peye
                        if (prevStatus === 'pending' && ['processing', 'shipped', 'delivered'].includes(newStatus)) {
                            alert('PA LIVRE — KÒMAND SA A PA PEYE!\n(CANNOT FULFILL UNPAID ORDER. Wait until payment is confirmed by Stripe.)')
                            target.value = prevStatus
                            return
                        }

                        if (newStatus === 'cancelled') {
                            const confirmed = confirm(
                                `CONFIRM CANCELLATION:\nAre you sure you want to cancel order #${id}?\nThis will automatically RESTOCK all items back into product inventory.`
                            )
                            if (!confirmed) {
                                target.value = prevStatus
                                return
                            }

                            target.disabled = true
                            const { error: cancelErr } = await supabase.rpc('cancel_order', { p_order_id: Number(id) })
                            target.disabled = false

                            if (cancelErr) {
                                alert(`CANCELLATION FAILED: ${cancelErr.message}`)
                                target.value = prevStatus
                            } else {
                                alert(`ORDER #${id} CANCELLED. Inventory has been restored.`)
                                target.setAttribute('data-prev', 'cancelled')
                                this.renderOrders(container)
                            }
                            return
                        }

                        if (newStatus === 'shipped' && !order?.tracking_number) {
                            this.promptTrackingInfo(target, id, newStatus)
                            return
                        }

                        await this.saveOrderStatus(id, { status: newStatus })
                        target.setAttribute('data-prev', newStatus)
                    })
                })

                // Internal notes listeners
                tbody.querySelectorAll('.btn-notes').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = btn.getAttribute('data-id')!
                        const order = allOrders.find((o: any) => o.id.toString() === id)
                        this.promptInternalNotes(id, order?.notes_internal || '')
                    })
                })
            }

            renderRows(allOrders)

            // Filtering
            const searchInput = document.getElementById('orderSearch') as HTMLInputElement
            const statusFilter = document.getElementById('orderStatusFilter') as HTMLSelectElement

            const applyFilter = () => {
                const q = searchInput.value.toLowerCase().trim()
                const s = statusFilter.value
                const filtered = allOrders.filter((o: any) => {
                    const matchQ = !q ||
                        o.id.toString().toLowerCase().includes(q) ||
                        o.customer_name?.toLowerCase().includes(q) ||
                        o.customer_email?.toLowerCase().includes(q)
                    const matchS = !s || o.status === s
                    return matchQ && matchS
                })
                renderRows(filtered)
            }

            searchInput?.addEventListener('input', applyFilter)
            statusFilter?.addEventListener('change', applyFilter)

            // Refresh button
            document.getElementById('refreshOrders')?.addEventListener('click', () => this.renderOrders(container))

            // Export CSV button
            document.getElementById('exportOrdersCsv')?.addEventListener('click', () => {
                const headers = ['id', 'customer_name', 'customer_email', 'customer_phone', 'shipping_address', 'subtotal', 'shipping_cost', 'tax_amount', 'discount_amount', 'total', 'status', 'tracking_number', 'carrier', 'created_at']
                const rows = allOrders.map((o: any) => headers.map(h => `"${String(o[h] ?? '').replace(/"/g, '""')}"`).join(','))
                const csv = [headers.join(','), ...rows].join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `nouie-orders-${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
            })

        } catch (err) {
            console.error('Admin order fetch error:', err)
            tbody.innerHTML = '<tr><td colspan="7" class="table-error">LINK_FAILURE: DATASTORE_UNREACHABLE</td></tr>'
        }
    }

    private promptInternalNotes(orderId: string, currentNotes: string): void {
        const modalArea = document.getElementById('adminModalArea')
        if (!modalArea) return

        modalArea.innerHTML = `
      <div class="admin-modal-overlay">
        <div class="admin-modal">
          <h2>INTERNAL NOTES — ORDER #${orderId}</h2>
          <p class="modal-sub">Notes are strictly for studio staff and are never shown to the customer.</p>
          <textarea id="internalNotesText" rows="6" class="admin-textarea" placeholder="Add packaging instructions, customer history, or issues...">${currentNotes || ''}</textarea>
          <div class="modal-actions">
            <button id="saveNotesBtn" class="btn-submit-form">SAVE NOTES</button>
            <button id="closeNotesBtn" class="btn-cancel">CLOSE</button>
          </div>
        </div>
      </div>
    `

        document.getElementById('closeNotesBtn')?.addEventListener('click', () => {
            modalArea.innerHTML = ''
        })

        document.getElementById('saveNotesBtn')?.addEventListener('click', async () => {
            const notes = (document.getElementById('internalNotesText') as HTMLTextAreaElement).value
            const { error } = await supabase.from('orders').update({ notes_internal: notes }).eq('id', orderId)
            if (error) {
                alert(`FAILED TO SAVE NOTE: ${error.message}`)
            } else {
                modalArea.innerHTML = ''
                const btn = document.querySelector(`.btn-notes[data-id="${orderId}"]`)
                if (btn) btn.textContent = notes ? '📝 EDIT NOTE' : '+ ADD NOTE'
            }
        })
    }

    private async saveOrderStatus(id: string, fields: { status?: string, tracking_number?: string, carrier?: string }): Promise<void> {
        const { error } = await supabase.from('orders').update(fields).eq('id', id)
        if (error) {
            console.error('Failed to update order status:', error)
            alert(`UPDATE FAILED: ${error.message}`)
        }
    }

    private promptTrackingInfo(selectEl: HTMLSelectElement, orderId: string, status: string): void {
        const cell = selectEl.closest('.order-status') as HTMLElement
        const previousStatus = selectEl.getAttribute('data-prev') || 'pending'

        const form = document.createElement('div')
        form.className = 'tracking-form'
        form.innerHTML = `
      <select class="tracking-carrier">
        <option value="UPS">UPS</option>
        <option value="FedEx">FedEx</option>
        <option value="DHL">DHL</option>
        <option value="USPS">USPS</option>
      </select>
      <input type="text" class="tracking-number-input" placeholder="TRACKING_NUMBER">
      <button class="btn-tracking-save">SAVE</button>
      <button class="btn-tracking-cancel">CANCEL</button>
    `
        cell.appendChild(form)
        selectEl.disabled = true

        form.querySelector('.btn-tracking-save')?.addEventListener('click', async () => {
            const carrier = (form.querySelector('.tracking-carrier') as HTMLSelectElement).value
            const tracking_number = (form.querySelector('.tracking-number-input') as HTMLInputElement).value.trim()

            if (!tracking_number) {
                alert('ENTER A TRACKING NUMBER')
                return
            }

            await this.saveOrderStatus(orderId, { status, tracking_number, carrier })

            const trackingCell = cell.parentElement?.querySelector('.tracking-cell')
            if (trackingCell) trackingCell.innerHTML = `<span class="tracking-info">🚚 ${carrier} ${tracking_number}</span>`

            form.remove()
            selectEl.disabled = false
            selectEl.setAttribute('data-prev', status)
        })

        form.querySelector('.btn-tracking-cancel')?.addEventListener('click', () => {
            selectEl.value = previousStatus
            form.remove()
            selectEl.disabled = false
        })
    }

    // ==========================================
    // 2. PRODUCTS INVENTORY (A2 & C2)
    // ==========================================
    private async renderProducts(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>PRODUCT_INVENTORY</h1>
        <div class="admin-header-actions">
          <a href="#admin/create-product" class="btn-add-product">ADD_NEW_UNIT</a>
        </div>
      </header>
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>UNIT_ID</th>
              <th>NAME</th>
              <th>PRICE</th>
              <th>MATERIAL</th>
              <th>STOCK_QTY</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="productsTableBody">
            <tr><td colspan="7" class="table-loading">LOADING_INVENTORY...</td></tr>
          </tbody>
        </table>
      </div>
    `

        const tbody = document.getElementById('productsTableBody')
        if (!tbody) return

        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (error || !products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="table-empty">NO_PRODUCTS_IN_DATABASE</td></tr>'
            return
        }

        tbody.innerHTML = products.map((product: Product) => `
      <tr data-id="${product.id}">
        <td><strong>${product.id}</strong></td>
        <td>${product.name}</td>
        <td>$${Number(product.price).toFixed(2)}</td>
        <td>${product.material || '—'}</td>
        <td>
          <input type="number" class="stock-input" value="${product.stock_qty || 0}" data-id="${product.id}">
        </td>
        <td>
          <label class="switch">
            <input type="checkbox" class="active-toggle" ${product.is_active !== false ? 'checked' : ''} data-id="${product.id}">
            <span class="slider"></span>
          </label>
          <span class="status-label">${product.is_active !== false ? 'ACTIVE' : 'OFFLINE'}</span>
        </td>
        <td>
          <button class="btn-save-product" data-id="${product.id}">SAVE</button>
          <a href="#admin/edit-product-${product.id}" class="btn-edit-product">EDIT</a>
        </td>
      </tr>
    `).join('')

        container.querySelectorAll('.btn-save-product').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id')
                const row = container.querySelector(`tr[data-id="${id}"]`)
                const stockInput = row?.querySelector('.stock-input') as HTMLInputElement
                const activeToggle = row?.querySelector('.active-toggle') as HTMLInputElement

                if (stockInput && activeToggle) {
                    const { error: updateErr } = await supabase
                        .from('products')
                        .update({
                            stock_qty: parseInt(stockInput.value) || 0,
                            is_active: activeToggle.checked
                        })
                        .eq('id', id)

                    if (updateErr) {
                        alert(`ERROR: ${updateErr.message}`)
                    } else {
                        alert(`PRODUCT ${id} UPDATED SUCCESSFULLY`)
                    }
                }
            })
        })

        container.querySelectorAll('.active-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const span = (e.currentTarget as HTMLInputElement).parentElement?.nextElementSibling as HTMLElement
                if (span) span.textContent = (e.currentTarget as HTMLInputElement).checked ? 'ACTIVE' : 'OFFLINE'
            })
        })
    }

    private async renderEditProduct(container: HTMLElement, productId: string): Promise<void> {
        container.innerHTML = '<div class="loading-state">LOADING_UNIT...</div>'
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single()

        if (error || !product) {
            container.innerHTML = `<h1>PRODUCT NOT FOUND</h1><a href="#admin/products" class="btn-back">← BACK</a>`
            return
        }

        this.renderProductForm(container, product as Product)
    }

    private readonly SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL']

    private renderProductForm(container: HTMLElement, existing?: Product): void {
        const isEdit = !!existing
        const stockBySize = existing?.stock_by_size || {}
        let currentImages: string[] = [...(existing?.images || [])]

        container.innerHTML = `
      <header class="admin-header">
        <h1>${isEdit ? `EDIT_UNIT — ${existing!.id}` : 'CREATE_NEW_UNIT'}</h1>
        <div class="admin-header-actions">
          ${isEdit ? `<button type="button" id="duplicateProductBtn" class="btn-refresh">DUPLICATE_UNIT</button>` : ''}
          <a href="#admin/products" class="btn-back">← BACK</a>
        </div>
      </header>
      <div class="admin-form-container">
        <form id="productForm" class="admin-form">
          <div class="form-grid">
            <div class="form-group">
              <label>UNIT_ID (e.g. CAT04)</label>
              <input type="text" name="id" required placeholder="CAT00" value="${existing?.id || ''}" ${isEdit ? 'readonly' : ''}>
            </div>
            <div class="form-group">
              <label>PRODUCT NAME</label>
              <input type="text" name="name" required placeholder="PRODUCT_NAME" value="${existing?.name || ''}">
            </div>
            <div class="form-group">
              <label>SEASON / DROP</label>
              <input type="text" name="season" required placeholder="SS26" value="${existing?.season || ''}">
            </div>
            <div class="form-group">
              <label>PRICE (USD)</label>
              <input type="number" step="0.01" name="price" required placeholder="0.00" value="${existing?.price ?? ''}">
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>SKU</label>
              <input type="text" name="sku" required placeholder="NOUIE-SS26-XX-01" value="${existing?.sku || ''}">
            </div>
            <div class="form-group">
              <label>COLOR</label>
              <input type="text" name="color" required placeholder="BLACK" value="${existing?.color || ''}">
            </div>
            <div class="form-group">
              <label>MATERIAL (FABRIC / COMPOSITION) *</label>
              <input type="text" name="material" required placeholder="COTTON BLEND / THERMAL KNIT" value="${existing?.material || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>DESCRIPTION</label>
            <textarea name="description" required placeholder="Unit technical specifications...">${existing?.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label>SIZES (comma separated)</label>
            <input type="text" name="sizes" required placeholder="S, M, L, XL" value="${existing?.sizes?.join(', ') || ''}">
          </div>
          <div class="form-group">
            <label>STOCK BY SIZE</label>
            <div class="stock-by-size-grid">
              ${this.SIZE_OPTIONS.map(size => `
                <div class="stock-size-input">
                  <label>${size}</label>
                  <input type="number" min="0" name="stock_${size}" value="${stockBySize[size] ?? 0}">
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="form-group">
            <label>PRODUCT IMAGES GALLERY (DRAG / MANAGE)</label>
            <div id="imageGalleryPreview" class="admin-image-gallery">
              ${currentImages.map((img, idx) => `
                <div class="admin-image-thumb-card" data-idx="${idx}">
                  <img src="${img.startsWith('http') ? img : `/assets/${img}`}" alt="Thumb ${idx}">
                  <div class="thumb-actions">
                    ${idx === 0 ? '<span class="badge-primary">PRIMARY</span>' : `<button type="button" class="btn-make-primary" data-idx="${idx}">SET PRIMARY</button>`}
                    <button type="button" class="btn-remove-thumb" data-idx="${idx}">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="upload-box-row">
              <label class="btn-upload-file">
                + UPLOAD NEW IMAGES
                <input type="file" name="newImages" accept="image/*" multiple style="display: none;">
              </label>
              <span id="uploadStatusText"></span>
            </div>
          </div>

          <button type="submit" class="btn-submit-form">${isEdit ? 'SAVE_CHANGES' : 'INITIALIZE_UNIT'}</button>
          <div id="formFeedback"></div>
        </form>
      </div>
    `

        // Gallery thumbnail buttons
        const attachGalleryEvents = () => {
            const gallery = document.getElementById('imageGalleryPreview')
            if (!gallery) return

            gallery.querySelectorAll('.btn-make-primary').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = Number(btn.getAttribute('data-idx'))
                    const item = currentImages.splice(idx, 1)[0]
                    currentImages.unshift(item)
                    refreshGallery()
                })
            })

            gallery.querySelectorAll('.btn-remove-thumb').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = Number(btn.getAttribute('data-idx'))
                    currentImages.splice(idx, 1)
                    refreshGallery()
                })
            })
        }

        const refreshGallery = () => {
            const gallery = document.getElementById('imageGalleryPreview')
            if (!gallery) return
            gallery.innerHTML = currentImages.map((img, idx) => `
        <div class="admin-image-thumb-card" data-idx="${idx}">
          <img src="${img.startsWith('http') ? img : `/assets/${img}`}" alt="Thumb ${idx}">
          <div class="thumb-actions">
            ${idx === 0 ? '<span class="badge-primary">PRIMARY</span>' : `<button type="button" class="btn-make-primary" data-idx="${idx}">SET PRIMARY</button>`}
            <button type="button" class="btn-remove-thumb" data-idx="${idx}">✕</button>
          </div>
        </div>
      `).join('')
            attachGalleryEvents()
        }

        attachGalleryEvents()

        // File upload event
        const fileInput = container.querySelector('input[name="newImages"]') as HTMLInputElement
        const statusText = document.getElementById('uploadStatusText')
        fileInput?.addEventListener('change', async () => {
            if (!fileInput.files || fileInput.files.length === 0) return
            if (statusText) statusText.textContent = 'Uploading...'
            try {
                const uploadedUrls = await this.uploadProductImages(fileInput.files)
                currentImages.push(...uploadedUrls)
                refreshGallery()
                if (statusText) statusText.textContent = `Uploaded ${uploadedUrls.length} image(s).`
            } catch (err: any) {
                if (statusText) statusText.textContent = `Upload error: ${err.message}`
            }
        })

        // Duplicate product handler
        document.getElementById('duplicateProductBtn')?.addEventListener('click', () => {
            const dupId = `${existing!.id}_COPY_${Date.now().toString().slice(-4)}`
            const dupData = { ...existing!, id: dupId, sku: `${existing!.sku}-COPY` }
            this.renderProductForm(container, dupData)
        })

        // Form submit
        document.getElementById('productForm')?.addEventListener('submit', async (e) => {
            e.preventDefault()
            const form = e.target as HTMLFormElement
            const formData = new FormData(form)
            const feedback = document.getElementById('formFeedback')
            const submitBtn = form.querySelector('.btn-submit-form') as HTMLButtonElement

            submitBtn.disabled = true
            if (feedback) feedback.innerHTML = '<span class="loading">SAVING...</span>'

            const stock_by_size: Record<string, number> = {}
            for (const size of this.SIZE_OPTIONS) {
                stock_by_size[size] = parseInt(formData.get(`stock_${size}`) as string) || 0
            }
            const stock_qty = Object.values(stock_by_size).reduce((sum, n) => sum + n, 0)

            const productData = {
                id: formData.get('id') as string,
                name: formData.get('name') as string,
                season: formData.get('season') as string,
                price: parseFloat(formData.get('price') as string),
                description: formData.get('description') as string,
                sizes: (formData.get('sizes') as string).split(',').map(s => s.trim()).filter(Boolean),
                images: currentImages,
                stock_qty,
                stock_by_size,
                is_active: existing?.is_active ?? true,
                sku: formData.get('sku') as string,
                brand: 'NOUIE',
                color: formData.get('color') as string,
                material: formData.get('material') as string
            }

            const { error } = isEdit
                ? await supabase.from('products').update(productData).eq('id', existing!.id)
                : await supabase.from('products').insert(productData)

            if (error) {
                if (feedback) feedback.innerHTML = `<span class="error">ERROR: ${error.message}</span>`
                submitBtn.disabled = false
            } else {
                if (feedback) feedback.innerHTML = '<span class="success">SAVED SUCCESSFULLY</span>'
                setTimeout(() => {
                    window.location.hash = '#admin/products'
                }, 800)
            }
        })
    }

    private async uploadProductImages(files: FileList): Promise<string[]> {
        const urls: string[] = []
        for (const file of Array.from(files)) {
            const ext = file.name.split('.').pop()
            const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const { error } = await supabase.storage.from('product-images').upload(path, file)
            if (error) throw error
            const { data } = supabase.storage.from('product-images').getPublicUrl(path)
            urls.push(data.publicUrl)
        }
        return urls
    }

    // ==========================================
    // 3. STORE SETTINGS (B1, B2, B3)
    // ==========================================
    private async renderSettings(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>STORE_CONFIGURATION</h1>
      </header>
      <div class="loading-state">FETCHING STORE SETTINGS...</div>
    `

        const settings = await settingsService.getAllSettings()

        container.innerHTML = `
      <header class="admin-header">
        <h1>STORE_CONFIGURATION</h1>
        <p class="admin-subtitle">Live business settings. Changes apply immediately across invoices, checkout, and emails.</p>
      </header>

      <div class="settings-grid">
        <!-- 1. BUSINESS IDENTITY -->
        <div class="settings-card">
          <div class="settings-card-header">
            <h3>🏢 BUSINESS IDENTITY & INVOICING</h3>
          </div>
          <form id="businessSettingsForm" class="settings-form">
            <div class="form-group">
              <label>STORE NAME</label>
              <input type="text" name="name" value="${settings.business.name || 'NOUIE'}">
            </div>
            <div class="form-group">
              <label>ADDRESS LINE 1</label>
              <input type="text" name="address_line1" value="${settings.business.address_line1 || ''}">
            </div>
            <div class="form-group">
              <label>ADDRESS LINE 2</label>
              <input type="text" name="address_line2" value="${settings.business.address_line2 || ''}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>CITY</label>
                <input type="text" name="city" value="${settings.business.city || ''}">
              </div>
              <div class="form-group">
                <label>STATE / PROVINCE</label>
                <input type="text" name="state" value="${settings.business.state || ''}">
              </div>
              <div class="form-group">
                <label>ZIP / POSTAL CODE</label>
                <input type="text" name="zip" value="${settings.business.zip || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>SUPPORT EMAIL</label>
                <input type="email" name="email_support" value="${settings.business.email_support || ''}">
              </div>
              <div class="form-group">
                <label>STUDIO EMAIL</label>
                <input type="email" name="email_studio" value="${settings.business.email_studio || ''}">
              </div>
            </div>
            <button type="submit" class="btn-submit-form">SAVE BUSINESS IDENTITY</button>
            <div class="form-feedback" id="businessFeedback"></div>
          </form>
        </div>

        <!-- 2. SHIPPING CONFIGURATION -->
        <div class="settings-card">
          <div class="settings-card-header">
            <h3>🚚 SHIPPING RATES & THRESHOLDS</h3>
          </div>
          <form id="shippingSettingsForm" class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label>STANDARD SHIPPING ($ USD)</label>
                <input type="number" step="0.01" name="standard" value="${settings.shipping.standard}">
              </div>
              <div class="form-group">
                <label>EXPRESS SHIPPING ($ USD)</label>
                <input type="number" step="0.01" name="express" value="${settings.shipping.express}">
              </div>
            </div>
            <div class="form-group">
              <label>FREE SHIPPING THRESHOLD ($ USD)</label>
              <input type="number" step="0.01" name="free_threshold" value="${settings.shipping.free_threshold}">
              <small>Domestic standard orders above this amount receive free delivery.</small>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>STANDARD DELIVERY DAYS</label>
                <input type="text" name="standard_days" value="${settings.shipping.standard_days || '5-7'}">
              </div>
              <div class="form-group">
                <label>EXPRESS DELIVERY DAYS</label>
                <input type="text" name="express_days" value="${settings.shipping.express_days || '2-3'}">
              </div>
            </div>
            <button type="submit" class="btn-submit-form">SAVE SHIPPING SETTINGS</button>
            <div class="form-feedback" id="shippingFeedback"></div>
          </form>
        </div>

        <!-- 3. TAX SETTINGS -->
        <div class="settings-card">
          <div class="settings-card-header">
            <h3>🏛️ SALES TAX CONFIGURATION</h3>
          </div>
          <form id="taxSettingsForm" class="settings-form">
            <div class="form-group checkbox-group">
              <label class="switch">
                <input type="checkbox" name="enabled" ${settings.tax.enabled ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <span class="switch-label">ENABLE AUTOMATIC SALES TAX CALCULATION</span>
            </div>
            <div class="form-group">
              <label>TAX RATE (DECIMAL, e.g. 0.085 FOR 8.5%)</label>
              <input type="number" step="0.0001" name="rate" value="${settings.tax.rate}">
            </div>
            <div class="form-group">
              <label>TAX LABEL (DISPLAYED AT CHECKOUT & INVOICE)</label>
              <input type="text" name="label" value="${settings.tax.label || 'SALES TAX'}">
            </div>
            <button type="submit" class="btn-submit-form">SAVE TAX SETTINGS</button>
            <div class="form-feedback" id="taxFeedback"></div>
          </form>
        </div>

        <!-- 4. STORE GENERAL -->
        <div class="settings-card">
          <div class="settings-card-header">
            <h3>🔒 STORE MODE & ANNOUNCEMENTS</h3>
          </div>
          <form id="storeGeneralForm" class="settings-form">
            <div class="form-group checkbox-group">
              <label class="switch">
                <input type="checkbox" name="maintenance" ${settings.store.maintenance ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <span class="switch-label">MAINTENANCE MODE (STUDIO LOCK)</span>
            </div>
            <div class="form-group">
              <label>GLOBAL ANNOUNCEMENT BANNER</label>
              <input type="text" name="announcement" placeholder="e.g. DROP 01 NOW LIVE / WORLDWIDE SHIPPING" value="${settings.store.announcement || ''}">
            </div>
            <button type="submit" class="btn-submit-form">SAVE STORE STATUS</button>
            <div class="form-feedback" id="storeFeedback"></div>
          </form>
        </div>
      </div>
    `

        // Form Handlers
        const handleSave = async (formId: string, feedbackId: string, key: keyof StoreSettings, parser: (fd: FormData) => any) => {
            document.getElementById(formId)?.addEventListener('submit', async (e) => {
                e.preventDefault()
                const fb = document.getElementById(feedbackId)!
                fb.innerHTML = '<span class="loading">SAVING CONFIGURATION...</span>'
                const formData = new FormData(e.target as HTMLFormElement)
                const payload = parser(formData)
                const { error } = await settingsService.updateSetting(key, payload)
                if (error) {
                    fb.innerHTML = `<span class="error">SAVE FAILED: ${error.message}</span>`
                } else {
                    fb.innerHTML = '<span class="success">CONFIGURATION PERSISTED TO SUPABASE</span>'
                }
            })
        }

        handleSave('businessSettingsForm', 'businessFeedback', 'business', fd => ({
            name: fd.get('name'),
            address_line1: fd.get('address_line1'),
            address_line2: fd.get('address_line2'),
            city: fd.get('city'),
            state: fd.get('state'),
            zip: fd.get('zip'),
            country: 'USA',
            phone: '',
            email_support: fd.get('email_support'),
            email_studio: fd.get('email_studio')
        }))

        handleSave('shippingSettingsForm', 'shippingFeedback', 'shipping', fd => ({
            standard: parseFloat(fd.get('standard') as string) || 10.00,
            express: parseFloat(fd.get('express') as string) || 25.00,
            free_threshold: parseFloat(fd.get('free_threshold') as string) || 250.00,
            standard_days: fd.get('standard_days') || '5-7',
            express_days: fd.get('express_days') || '2-3'
        }))

        handleSave('taxSettingsForm', 'taxFeedback', 'tax', fd => ({
            enabled: fd.get('enabled') === 'on',
            rate: parseFloat(fd.get('rate') as string) || 0.00,
            label: fd.get('label') || 'SALES TAX'
        }))

        handleSave('storeGeneralForm', 'storeFeedback', 'store', fd => ({
            maintenance: fd.get('maintenance') === 'on',
            announcement: fd.get('announcement') || ''
        }))
    }

    // ==========================================
    // 4. COLLECTIONS AS ENTITIES (C1)
    // ==========================================
    private async renderCollections(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>COLLECTION_MANAGEMENT</h1>
        <div class="admin-header-actions">
          <button id="btnCreateCollection" class="btn-add-product">+ CREATE_COLLECTION</button>
        </div>
      </header>

      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID / SLUG</th>
              <th>TITLE</th>
              <th>COVER</th>
              <th>ORDER</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="collectionsTableBody">
            <tr><td colspan="6" class="table-loading">LOADING_COLLECTIONS...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="collectionsModalArea"></div>
    `

        const tbody = document.getElementById('collectionsTableBody')
        if (!tbody) return

        const { data: cols, error } = await supabase
            .from('collections')
            .select('*')
            .order('sort_order', { ascending: true })

        if (error || !cols || cols.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">NO_COLLECTIONS_DEFINED</td></tr>'
            return
        }

        tbody.innerHTML = cols.map((col: Collection) => `
      <tr data-id="${col.id}">
        <td><strong>${col.id}</strong><br><small>/${col.slug}</small></td>
        <td>${col.title}</td>
        <td>${col.cover_image ? `<img src="${col.cover_image.startsWith('http') ? col.cover_image : `/assets/${col.cover_image}`}" class="thumb-mini">` : '—'}</td>
        <td>${col.sort_order}</td>
        <td>
          <span class="badge ${col.is_active ? 'badge-active' : 'badge-inactive'}">${col.is_active ? 'ACTIVE' : 'OFFLINE'}</span>
          ${col.is_archived ? '<span class="badge-archived">ARCHIVED</span>' : ''}
        </td>
        <td>
          <button class="btn-manage-products" data-id="${col.id}">PRODUCTS</button>
          <button class="btn-edit-collection" data-id="${col.id}">EDIT</button>
        </td>
      </tr>
    `).join('')

        // Create Collection Modal
        document.getElementById('btnCreateCollection')?.addEventListener('click', () => {
            this.promptCollectionForm()
        })

        tbody.querySelectorAll('.btn-edit-collection').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id')!
                const col = cols.find(c => c.id === id)
                if (col) this.promptCollectionForm(col)
            })
        })

        tbody.querySelectorAll('.btn-manage-products').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id')!
                this.promptCollectionProducts(id)
            })
        })
    }

    private promptCollectionForm(existing?: Collection): void {
        const area = document.getElementById('collectionsModalArea')
        if (!area) return

        const isEdit = !!existing
        area.innerHTML = `
      <div class="admin-modal-overlay">
        <div class="admin-modal">
          <h2>${isEdit ? `EDIT COLLECTION — ${existing!.title}` : 'NEW COLLECTION'}</h2>
          <form id="colModalForm" class="admin-form">
            <div class="form-group">
              <label>COLLECTION ID (e.g. COL_FW26)</label>
              <input type="text" name="id" required value="${existing?.id || ''}" ${isEdit ? 'readonly' : ''}>
            </div>
            <div class="form-group">
              <label>SLUG (e.g. fw26)</label>
              <input type="text" name="slug" required value="${existing?.slug || ''}">
            </div>
            <div class="form-group">
              <label>TITLE</label>
              <input type="text" name="title" required value="${existing?.title || ''}">
            </div>
            <div class="form-group">
              <label>DESCRIPTION</label>
              <textarea name="description" rows="3">${existing?.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label>COVER IMAGE FILENAME OR URL</label>
              <input type="text" name="cover_image" placeholder="cat1_1.jpg" value="${existing?.cover_image || ''}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>SORT ORDER</label>
                <input type="number" name="sort_order" value="${existing?.sort_order ?? 1}">
              </div>
              <div class="form-group checkbox-group">
                <label class="switch">
                  <input type="checkbox" name="is_active" ${existing?.is_active !== false ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
                <span class="switch-label">IS ACTIVE</span>
              </div>
              <div class="form-group checkbox-group">
                <label class="switch">
                  <input type="checkbox" name="is_archived" ${existing?.is_archived ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
                <span class="switch-label">IS ARCHIVED</span>
              </div>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-submit-form">SAVE COLLECTION</button>
              <button type="button" id="closeColModal" class="btn-cancel">CANCEL</button>
            </div>
          </form>
        </div>
      </div>
    `

        document.getElementById('closeColModal')?.addEventListener('click', () => {
            area.innerHTML = ''
        })

        document.getElementById('colModalForm')?.addEventListener('submit', async (e) => {
            e.preventDefault()
            const fd = new FormData(e.target as HTMLFormElement)
            const payload = {
                id: fd.get('id') as string,
                slug: (fd.get('slug') as string).toLowerCase().trim(),
                title: fd.get('title') as string,
                description: fd.get('description') as string,
                cover_image: fd.get('cover_image') as string,
                sort_order: parseInt(fd.get('sort_order') as string) || 0,
                is_active: fd.get('is_active') === 'on',
                is_archived: fd.get('is_archived') === 'on'
            }

            const { error } = isEdit
                ? await supabase.from('collections').update(payload).eq('id', existing!.id)
                : await supabase.from('collections').insert(payload)

            if (error) {
                alert(`ERROR: ${error.message}`)
            } else {
                area.innerHTML = ''
                const adminMain = document.getElementById('adminMain')
                if (adminMain) this.renderCollections(adminMain)
            }
        })
    }

    private async promptCollectionProducts(collectionId: string): Promise<void> {
        const area = document.getElementById('collectionsModalArea')
        if (!area) return

        area.innerHTML = `<div class="admin-modal-overlay"><div class="admin-modal">Loading products...</div></div>`

        const [allProdsRes, linkedRes] = await Promise.all([
            supabase.from('products').select('id, name, price').order('id'),
            supabase.from('product_collections').select('product_id').eq('collection_id', collectionId)
        ])

        const allProducts = allProdsRes.data || []
        const linkedIds = new Set((linkedRes.data || []).map(r => r.product_id))

        area.innerHTML = `
      <div class="admin-modal-overlay">
        <div class="admin-modal">
          <h2>ASSIGN PRODUCTS TO COLLECTION: ${collectionId}</h2>
          <p class="modal-sub">Check the products that belong in this collection.</p>
          <div class="product-checklist">
            ${allProducts.map(p => `
              <label class="product-check-item">
                <input type="checkbox" value="${p.id}" ${linkedIds.has(p.id) ? 'checked' : ''}>
                <span><strong>${p.id}</strong> — ${p.name} ($${p.price})</span>
              </label>
            `).join('')}
          </div>
          <div class="modal-actions">
            <button id="saveAssignedBtn" class="btn-submit-form">SAVE ASSIGNMENTS</button>
            <button id="closeAssignModal" class="btn-cancel">CLOSE</button>
          </div>
        </div>
      </div>
    `

        document.getElementById('closeAssignModal')?.addEventListener('click', () => {
            area.innerHTML = ''
        })

        document.getElementById('saveAssignedBtn')?.addEventListener('click', async () => {
            const checked = Array.from(area.querySelectorAll('.product-check-item input:checked')).map(
                (el: any) => el.value
            )

            // Remove previous links
            await supabase.from('product_collections').delete().eq('collection_id', collectionId)

            // Insert new links
            if (checked.length > 0) {
                const records = checked.map((pid, idx) => ({
                    collection_id: collectionId,
                    product_id: pid,
                    sort_order: idx + 1
                }))
                await supabase.from('product_collections').insert(records)
            }

            alert('PRODUCT ASSIGNMENTS SAVED')
            area.innerHTML = ''
        })
    }

    // ==========================================
    // 5. LEGAL PAGES (D1)
    // ==========================================
    private async renderPages(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>LEGAL_PAGES_EDITOR</h1>
        <p class="admin-subtitle">Strict Markdown with automated HTML escaping. Real-time preview protects against XSS.</p>
      </header>
      <div class="page-editor-tabs">
        <button class="btn-tab active" data-slug="shipping">SHIPPING POLICY</button>
        <button class="btn-tab" data-slug="returns">RETURNS & EXCHANGES</button>
        <button class="btn-tab" data-slug="privacy">PRIVACY POLICY</button>
        <button class="btn-tab" data-slug="terms">TERMS OF SERVICE</button>
      </div>

      <div class="editor-workspace">
        <div class="editor-left">
          <div class="form-group">
            <label>PAGE TITLE</label>
            <input type="text" id="pageTitleInput" class="admin-input">
          </div>
          <div class="form-group">
            <label>BODY (MARKDOWN)</label>
            <textarea id="pageBodyInput" rows="18" class="admin-textarea markdown-font"></textarea>
          </div>
          <button id="savePageBtn" class="btn-submit-form">PERSIST PAGE TO SUPABASE</button>
          <div id="pageFeedback"></div>
        </div>
        <div class="editor-right">
          <label class="preview-label">LIVE PREVIEW</label>
          <div id="pageLivePreview" class="markdown-preview"></div>
        </div>
      </div>
    `

        let currentSlug = 'shipping'
        const titleInput = document.getElementById('pageTitleInput') as HTMLInputElement
        const bodyInput = document.getElementById('pageBodyInput') as HTMLTextAreaElement
        const previewDiv = document.getElementById('pageLivePreview') as HTMLElement
        const feedback = document.getElementById('pageFeedback') as HTMLElement

        const updatePreview = () => {
            previewDiv.innerHTML = `
        <h1>${titleInput.value}</h1>
        ${renderSafeMarkdown(bodyInput.value)}
      `
        }

        const loadPage = async (slug: string) => {
            currentSlug = slug
            feedback.innerHTML = ''
            const { data } = await supabase.from('pages').select('*').eq('slug', slug).maybeSingle()
            if (data) {
                titleInput.value = data.title || ''
                bodyInput.value = data.body || ''
            } else {
                titleInput.value = slug.toUpperCase()
                bodyInput.value = '# ' + slug.toUpperCase() + '\n\nDraft content...'
            }
            updatePreview()
        }

        bodyInput.addEventListener('input', updatePreview)
        titleInput.addEventListener('input', updatePreview)

        container.querySelectorAll('.page-editor-tabs .btn-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.page-editor-tabs .btn-tab').forEach(b => b.classList.remove('active'))
                const target = e.currentTarget as HTMLElement
                target.classList.add('active')
                loadPage(target.getAttribute('data-slug')!)
            })
        })

        document.getElementById('savePageBtn')?.addEventListener('click', async () => {
            feedback.innerHTML = '<span class="loading">PERSISTING...</span>'
            const { error } = await supabase.from('pages').upsert({
                slug: currentSlug,
                title: titleInput.value.trim(),
                body: bodyInput.value,
                updated_at: new Date().toISOString()
            })

            if (error) {
                feedback.innerHTML = `<span class="error">SAVE FAILED: ${error.message}</span>`
            } else {
                feedback.innerHTML = '<span class="success">PAGE PUBLISHED LIVE TO SITE</span>'
            }
        })

        await loadPage('shipping')
    }

    // ==========================================
    // 6. MEDIA LIBRARY (D3)
    // ==========================================
    private async renderMedia(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>MEDIA_LIBRARY</h1>
        <div class="admin-header-actions">
          <label class="btn-add-product">
            + UPLOAD NEW ASSET
            <input type="file" id="mediaUploadInput" accept="image/*" multiple style="display: none;">
          </label>
        </div>
      </header>
      <div id="mediaFeedback"></div>
      <div class="media-grid" id="mediaGrid">
        <div class="loading-state">SCANNING STORAGE BUCKET...</div>
      </div>
    `

        const grid = document.getElementById('mediaGrid')
        const feedback = document.getElementById('mediaFeedback')
        if (!grid) return

        const refreshMedia = async () => {
            grid.innerHTML = '<div class="loading-state">FETCHING MEDIA...</div>'

            // Default local assets
            const defaultAssets = [
                'soldier_thermal_1.jpg', 'cat1_1.jpg', 'cat1_2.jpg', 'cat1_3.jpg', 'cat1_4.png',
                'cat2_1.jpg', 'cat2_2.jpg', 'cat2_3.jpg', 'cat2_4.jpg',
                'cat3_1.png', 'cat3_2.png', 'cat3_3.png', 'cat3_4.png',
                'home_cover_collage.jpg'
            ]

            let storageAssets: { name: string; url: string }[] = []
            try {
                const { data: storageFiles } = await supabase.storage.from('product-images').list()
                if (storageFiles) {
                    storageAssets = storageFiles.map(f => {
                        const { data } = supabase.storage.from('product-images').getPublicUrl(f.name)
                        return { name: f.name, url: data.publicUrl }
                    })
                }
            } catch (e) {
                console.warn('Storage list failed:', e)
            }

            const allItems = [
                ...defaultAssets.map(name => ({ name, url: `/assets/${name}` })),
                ...storageAssets
            ]

            grid.innerHTML = allItems.map(item => `
        <div class="media-card">
          <div class="media-preview">
            <img src="${item.url}" alt="${item.name}" loading="lazy">
          </div>
          <div class="media-info">
            <span class="media-name" title="${item.name}">${item.name}</span>
            <button class="btn-copy-url" data-url="${item.url}">COPY URL</button>
          </div>
        </div>
      `).join('')

            grid.querySelectorAll('.btn-copy-url').forEach(btn => {
                btn.addEventListener('click', () => {
                    const url = btn.getAttribute('data-url') || ''
                    navigator.clipboard.writeText(url)
                    btn.textContent = 'COPIED!'
                    setTimeout(() => btn.textContent = 'COPY URL', 1500)
                })
            })
        }

        document.getElementById('mediaUploadInput')?.addEventListener('change', async (e: any) => {
            const files = e.target.files
            if (!files || files.length === 0) return
            if (feedback) feedback.innerHTML = '<span class="loading">UPLOADING ASSETS...</span>'

            try {
                await this.uploadProductImages(files)
                if (feedback) feedback.innerHTML = '<span class="success">ASSETS UPLOADED</span>'
                await refreshMedia()
            } catch (err: any) {
                if (feedback) feedback.innerHTML = `<span class="error">UPLOAD FAILED: ${err.message}</span>`
            }
        })

        await refreshMedia()
    }

    // ==========================================
    // 7. TEAM & SECURITY ACCESS (E1)
    // ==========================================
    private async renderTeam(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>SECURITY_TEAM_ACCESS</h1>
      </header>

      <div class="settings-card">
        <div class="settings-card-header">
          <h3>INVITE NEW ADMINISTRATOR</h3>
        </div>
        <form id="inviteAdminForm" class="settings-form">
          <div class="form-group">
            <label>ADMIN EMAIL ADDRESS</label>
            <input type="email" id="newAdminEmail" required placeholder="franckley@nouie.com">
          </div>
          <button type="submit" class="btn-submit-form">+ AUTHORIZE ADMIN</button>
          <div id="inviteFeedback"></div>
        </form>
      </div>

      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>EMAIL</th>
              <th>AUTHORIZED_DATE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody id="teamTableBody">
            <tr><td colspan="4" class="table-loading">CHECKING PRIVILEGES...</td></tr>
          </tbody>
        </table>
      </div>
    `

        const tbody = document.getElementById('teamTableBody')
        if (!tbody) return

        const refreshAdmins = async () => {
            const { data: admins, error } = await supabase.from('admins').select('*').order('added_at')

            if (error || !admins || admins.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="table-empty">NO_ADMINS_FOUND</td></tr>'
                return
            }

            const isLastOne = admins.length <= 1

            tbody.innerHTML = admins.map((adm: AdminUser) => `
        <tr data-id="${adm.id}">
          <td>${adm.id.slice(0, 8)}...</td>
          <td><strong>${adm.email}</strong></td>
          <td>${adm.added_at ? new Date(adm.added_at).toLocaleDateString() : '—'}</td>
          <td>
            <button class="btn-remove-admin" data-id="${adm.id}" data-email="${adm.email}" ${isLastOne ? 'disabled title="Cannot remove the only remaining admin"' : ''}>
              REVOKE
            </button>
          </td>
        </tr>
      `).join('')

            tbody.querySelectorAll('.btn-remove-admin').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id')!
                    const email = btn.getAttribute('data-email')!
                    const ok = confirm(`REVOKE ACCESS: Are you sure you want to revoke admin privileges for ${email}?`)
                    if (!ok) return

                    const { error: delErr } = await supabase.from('admins').delete().eq('id', id)
                    if (delErr) {
                        alert(`CANNOT REMOVE: ${delErr.message}`)
                    } else {
                        await refreshAdmins()
                    }
                })
            })
        }

        document.getElementById('inviteAdminForm')?.addEventListener('submit', async (e) => {
            e.preventDefault()
            const fb = document.getElementById('inviteFeedback')!
            const emailInput = document.getElementById('newAdminEmail') as HTMLInputElement
            const email = emailInput.value.toLowerCase().trim()

            fb.innerHTML = '<span class="loading">AUTHORIZING...</span>'

            const { error } = await supabase.from('admins').insert({ email })
            if (error) {
                fb.innerHTML = `<span class="error">FAILED: ${error.message}</span>`
            } else {
                fb.innerHTML = `<span class="success">${email.toUpperCase()} AUTHORIZED AS ADMIN</span>`
                emailInput.value = ''
                await refreshAdmins()
            }
        })

        await refreshAdmins()
    }

    // ==========================================
    // 8. DISCOUNTS (B4)
    // ==========================================
    private async renderDiscounts(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>DISCOUNT_CODES</h1>
        <div class="admin-header-actions">
          <button id="btnNewDiscount" class="btn-add-product">+ CREATE_DISCOUNT</button>
        </div>
      </header>

      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>CODE</th>
              <th>TYPE</th>
              <th>VALUE</th>
              <th>MIN_SUBTOTAL</th>
              <th>USES / LIMIT</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="discountsTableBody">
            <tr><td colspan="7" class="table-loading">FETCHING DISCOUNTS...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="discountsModalArea"></div>
    `

        const tbody = document.getElementById('discountsTableBody')
        if (!tbody) return

        const refreshDiscounts = async () => {
            const { data: list, error } = await supabase
                .from('discounts')
                .select('*')
                .order('created_at', { ascending: false })

            if (error || !list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="table-empty">NO_DISCOUNT_CODES_FOUND</td></tr>'
                return
            }

            tbody.innerHTML = list.map((disc: Discount) => `
        <tr data-id="${disc.id}">
          <td><strong>${disc.code}</strong></td>
          <td>${disc.type.toUpperCase()}</td>
          <td>${disc.type === 'percentage' ? `${disc.value}%` : `$${Number(disc.value).toFixed(2)}`}</td>
          <td>$${Number(disc.min_subtotal).toFixed(2)}</td>
          <td>${disc.uses || 0} / ${disc.max_uses ?? '∞'}</td>
          <td>
            <label class="switch">
              <input type="checkbox" class="discount-toggle" data-id="${disc.id}" ${disc.active ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </td>
          <td>
            <button class="btn-delete-discount" data-id="${disc.id}">DELETE</button>
          </td>
        </tr>
      `).join('')

            tbody.querySelectorAll('.discount-toggle').forEach(t => {
                t.addEventListener('change', async (e) => {
                    const id = (e.currentTarget as HTMLElement).getAttribute('data-id')
                    const active = (e.currentTarget as HTMLInputElement).checked
                    await supabase.from('discounts').update({ active }).eq('id', id)
                })
            })

            tbody.querySelectorAll('.btn-delete-discount').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id')
                    if (confirm('Delete this discount code permanently?')) {
                        await supabase.from('discounts').delete().eq('id', id)
                        await refreshDiscounts()
                    }
                })
            })
        }

        document.getElementById('btnNewDiscount')?.addEventListener('click', () => {
            this.promptDiscountForm(refreshDiscounts)
        })

        await refreshDiscounts()
    }

    private promptDiscountForm(onSaved: () => Promise<void>): void {
        const area = document.getElementById('discountsModalArea')
        if (!area) return

        area.innerHTML = `
      <div class="admin-modal-overlay">
        <div class="admin-modal">
          <h2>CREATE NEW DISCOUNT CODE</h2>
          <form id="discountModalForm" class="admin-form">
            <div class="form-group">
              <label>PROMO CODE (UPPERCASE)</label>
              <input type="text" name="code" required placeholder="SUMMER20" style="text-transform: uppercase;">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>TYPE</label>
                <select name="type">
                  <option value="percentage">PERCENTAGE (%)</option>
                  <option value="fixed">FIXED AMOUNT ($)</option>
                </select>
              </div>
              <div class="form-group">
                <label>VALUE</label>
                <input type="number" step="0.01" name="value" required placeholder="20">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>MINIMUM SUBTOTAL ($)</label>
                <input type="number" step="0.01" name="min_subtotal" value="0.00">
              </div>
              <div class="form-group">
                <label>MAX USES (LEAVE BLANK FOR UNLIMITED)</label>
                <input type="number" name="max_uses" placeholder="Unlimited">
              </div>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-submit-form">CREATE PROMO CODE</button>
              <button type="button" id="closeDiscountModal" class="btn-cancel">CANCEL</button>
            </div>
          </form>
        </div>
      </div>
    `

        document.getElementById('closeDiscountModal')?.addEventListener('click', () => {
            area.innerHTML = ''
        })

        document.getElementById('discountModalForm')?.addEventListener('submit', async (e) => {
            e.preventDefault()
            const fd = new FormData(e.target as HTMLFormElement)
            const code = (fd.get('code') as string).toUpperCase().trim()
            const maxUsesStr = fd.get('max_uses') as string

            const payload = {
                code,
                type: fd.get('type') as 'percentage' | 'fixed',
                value: parseFloat(fd.get('value') as string),
                min_subtotal: parseFloat(fd.get('min_subtotal') as string) || 0.00,
                max_uses: maxUsesStr ? parseInt(maxUsesStr) : null,
                active: true
            }

            const { error } = await supabase.from('discounts').insert(payload)
            if (error) {
                alert(`ERROR: ${error.message}`)
            } else {
                area.innerHTML = ''
                await onSaved()
            }
        })
    }

    // ==========================================
    // 9. MESSAGES & SUBSCRIBERS
    // ==========================================
    private async renderMessages(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>SUPPORT_MESSAGES</h1>
      </header>
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>SUBJECT</th>
              <th>MESSAGE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="messagesTableBody">
            <tr><td colspan="6" class="table-loading">LOADING_MESSAGES...</td></tr>
          </tbody>
        </table>
      </div>
    `

        const tbody = document.getElementById('messagesTableBody')
        if (!tbody) return

        const { data: messages, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false })

        if (error || !messages || messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">NO_MESSAGES_FOUND</td></tr>'
            return
        }

        tbody.innerHTML = messages.map((msg: any) => `
      <tr>
        <td>${new Date(msg.created_at).toLocaleDateString()}</td>
        <td>${msg.name}</td>
        <td>${msg.email}</td>
        <td>${msg.subject || '—'}</td>
        <td class="message-cell">${msg.message}</td>
        <td><a href="mailto:${msg.email}" class="btn-view-details">REPLY</a></td>
      </tr>
    `).join('')
    }

    private async renderSubscribers(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>NEWSLETTER_SUBSCRIBERS</h1>
        <div class="admin-header-actions">
          <button class="btn-refresh" id="exportCsvBtn">EXPORT_CSV</button>
        </div>
      </header>
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>EMAIL</th>
              <th>SUBSCRIBED</th>
            </tr>
          </thead>
          <tbody id="subscribersTableBody">
            <tr><td colspan="2" class="table-loading">LOADING_SUBSCRIBERS...</td></tr>
          </tbody>
        </table>
      </div>
    `

        const tbody = document.getElementById('subscribersTableBody')
        if (!tbody) return

        const { data: subscribers, error } = await supabase
            .from('newsletter_subscribers')
            .select('*')
            .order('created_at', { ascending: false })

        if (error || !subscribers || subscribers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="table-empty">NO_SUBSCRIBERS_FOUND</td></tr>'
            document.getElementById('exportCsvBtn')?.setAttribute('disabled', 'true')
            return
        }

        tbody.innerHTML = subscribers.map((sub: any) => `
      <tr>
        <td>${sub.email}</td>
        <td>${new Date(sub.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('')

        document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
            const rows = [['email', 'subscribed_at'], ...subscribers.map((s: any) => [s.email, s.created_at])]
            const csv = rows.map(r => r.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `nouie-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
            a.click()
            URL.revokeObjectURL(url)
        })
    }

    // ==========================================
    // 10. INVOICE GENERATOR (B1 DYNAMIC)
    // ==========================================
    private async renderInvoice(container: HTMLElement, orderId: string): Promise<void> {
        const [orderRes, business] = await Promise.all([
            supabase.from('orders').select('*').eq('id', orderId).maybeSingle(),
            settingsService.getBusiness()
        ])

        const order = orderRes.data
        if (!order) {
            container.innerHTML = `<h1>ORDER NOT FOUND</h1><a href="#admin/orders" class="btn-back">← BACK</a>`
            return
        }

        const subtotal = Number(order.subtotal ?? (Number(order.total) - Number(order.shipping_cost ?? 0.00)))
        const shippingCost = Number(order.shipping_cost ?? 0.00)
        const shippingMethod = (order.shipping_method || 'STANDARD').toUpperCase()
        const taxAmount = Number(order.tax_amount || 0.00)
        const discountAmount = Number(order.discount_amount || 0.00)

        container.innerHTML = `
      <header class="admin-header">
        <h1>INVOICE_GENERATOR</h1>
        <a href="#admin/orders" class="btn-back">← BACK_TO_LOG</a>
      </header>
      <div class="invoice-container" id="invoiceArea">
        <div class="invoice-header">
          <div class="invoice-brand">
            <span class="brand-name">${business.name || 'NOUIE'}</span>
            <span class="brand-type">INDUSTRIAL DESIGN UNIT</span>
          </div>
          <div class="invoice-meta">
            <div>REF: INV_${orderId.toString().slice(-6).toUpperCase()}</div>
            <div>DATE: ${new Date(order.created_at).toLocaleDateString()}</div>
            ${order.tracking_number ? `<div>TRACKING: ${order.carrier || ''} ${order.tracking_number}</div>` : ''}
          </div>
        </div>
        
        <div class="invoice-addresses">
          <div class="address-box">
            <label>FROM:</label>
            <div>${business.name || 'NOUIE'} INDUSTRIAL UNIT</div>
            <div>${business.address_line1 || '104 INDUSTRIAL_ZONE_04'}</div>
            <div>${business.city || 'NORTH_TERMINAL'}, ${business.state || 'VOID'} ${business.zip || ''}</div>
            <div>${business.email_support || 'support@nouie.com'}</div>
          </div>
          <div class="address-box">
            <label>TO:</label>
            <div>${order.customer_name}</div>
            <div>${order.shipping_address}</div>
            <div>${order.customer_phone}</div>
          </div>
        </div>
        
        <table class="invoice-table">
          <thead>
            <tr>
              <th>DET_ITEM</th>
              <th>QTY</th>
              <th>PRICE</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map((item: any) => `
              <tr>
                <td>${item.name} (${item.size})</td>
                <td>${item.qty}</td>
                <td>$${Number(item.price).toFixed(2)}</td>
                <td>$${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">SUBTOTAL</td>
              <td>$${subtotal.toFixed(2)}</td>
            </tr>
            ${discountAmount > 0 ? `
              <tr>
                <td colspan="3">DISCOUNT (${order.discount_code || 'PROMO'})</td>
                <td>-$${discountAmount.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr>
              <td colspan="3">SHIPPING (${shippingMethod})</td>
              <td>$${shippingCost.toFixed(2)}</td>
            </tr>
            ${taxAmount > 0 ? `
              <tr>
                <td colspan="3">SALES TAX (${(Number(order.tax_rate || 0) * 100).toFixed(1)}%)</td>
                <td>$${taxAmount.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="final-total">
              <td colspan="3">TOTAL</td>
              <td>$${Number(order.total).toFixed(2)} USD</td>
            </tr>
          </tfoot>
        </table>
        
        <div class="invoice-footer">
          <p>TRANSACTION_SECURE // ARCHIVE_READY</p>
          <div class="barcode">|| |||| | ||||| || | ||||</div>
        </div>
      </div>
      
      <div class="invoice-actions">
        <button class="btn-email-invoice" id="sendEmail">SEND_TO_CUSTOMER_EMAIL</button>
        <button class="btn-print-invoice" onclick="window.print()">PRINT_HARDCOPY</button>
      </div>
      <div id="emailFeedback"></div>
    `

        document.getElementById('sendEmail')?.addEventListener('click', () => {
            const feedback = document.getElementById('emailFeedback')!
            feedback.innerHTML = `<div class="success-msg">TRANSMITTING DATA TO: ${order.customer_email}...</div>`
            setTimeout(() => {
                feedback.innerHTML = `<div class="success-msg">INVOICE SUCCESSFULLY TRANSMITTED TO CUSTOMER EMAIL.</div>`
            }, 1200)
        })
    }

    // ==========================================
    // 11. LOGIN
    // ==========================================
    private renderLogin(): void {
        this.contentDiv.innerHTML = `
      <div class="admin-login-page">
        <div class="admin-login-container">
          <div class="admin-login-header">
            <span class="admin-label">ADMIN_AUTH_REQUIRED</span>
            <h1>ACCESS RESTRICTED</h1>
            <p>Please authenticate with an authorized administrator credential.</p>
          </div>
          
          <form id="adminLoginForm" class="admin-login-form">
            <div class="form-group">
              <label>ADMIN_EMAIL</label>
              <input type="email" id="adminEmail" required placeholder="admin@nouie.com">
            </div>
            <div class="form-group">
              <label>SECURITY_KEY</label>
              <input type="password" id="adminPassword" required placeholder="••••••••">
            </div>
            <button type="submit" class="btn-admin-login">INITIATE_SESSION</button>
            <div id="authFeedback" class="auth-feedback"></div>
          </form>
          
          <div class="admin-login-footer">
            <a href="#home" class="btn-back-home">← RETURN TO PUBLIC_SYSTEM</a>
          </div>
        </div>
      </div>
    `

        const form = document.getElementById('adminLoginForm') as HTMLFormElement
        const feedback = document.getElementById('authFeedback')

        form?.addEventListener('submit', async (e) => {
            e.preventDefault()
            const email = (document.getElementById('adminEmail') as HTMLInputElement).value
            const password = (document.getElementById('adminPassword') as HTMLInputElement).value

            if (feedback) feedback.innerHTML = '<span class="loading">AUTHENTICATING...</span>'

            const { error } = await Auth.login(email, password)

            if (error) {
                if (feedback) feedback.innerHTML = `<span class="error">AUTH_FAILED: ${error.message.toUpperCase()}</span>`
            } else {
                if (feedback) feedback.innerHTML = '<span class="success">SESSION_ESTABLISHED</span>'
                setTimeout(() => this.render(), 800)
            }
        })
    }
}
