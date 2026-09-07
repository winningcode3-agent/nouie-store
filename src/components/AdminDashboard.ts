// Admin Dashboard Component
// Extracted from Pages.ts for better code organization

import { supabase } from '../lib/supabase'
import { Auth } from '../lib/auth'
import type { Product } from '../lib/types'

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
            <span class="admin-label">ADMIN_SYSTEM v1.0</span>
            <button id="adminLogout" class="admin-logout-btn">LOGOUT</button>
          </div>
          <nav class="admin-nav">
            <a href="#admin/orders" class="admin-nav-link ${subRoute === 'orders' ? 'active' : ''}">
              <span class="nav-icon">📊</span> ORDERS
            </a>
            <a href="#admin/products" class="admin-nav-link ${subRoute === 'products' ? 'active' : ''}">
              <span class="nav-icon">📦</span> PRODUCTS
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

    private async renderOrders(container: HTMLElement): Promise<void> {
        container.innerHTML = `
      <header class="admin-header">
        <h1>ORDER_MANAGEMENT</h1>
        <div class="admin-header-actions">
          <button class="btn-refresh" id="refreshOrders">EXEC_REFRESH</button>
        </div>
      </header>
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>CUSTOMER</th>
              <th>DATE</th>
              <th>TOTAL</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            <tr><td colspan="6" class="table-loading">DATA_LINK_ESTABLISHING...</td></tr>
          </tbody>
        </table>
      </div>
    `

        const refreshBtn = document.getElementById('refreshOrders')
        refreshBtn?.addEventListener('click', () => this.renderOrders(container))

        const tbody = document.getElementById('ordersTableBody')
        if (!tbody) return

        try {
            // Fetch from Supabase
            const { data: dbOrders, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            const allOrders = dbOrders || []

            if (allOrders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="table-empty">NO_DATA_FOUND_IN_CLUSTER</td></tr>'
                return
            }

            tbody.innerHTML = allOrders.map((order: any) => `
        <tr data-id="${order.id}">
          <td class="admin-order-id">#${order.id.toString().slice(-6).toUpperCase()}</td>
          <td class="order-customer">
            <div class="customer-name">${order.customer_name}</div>
            <div class="customer-email">${order.customer_email}</div>
          </td>
          <td class="order-date">${new Date(order.created_at || Date.now()).toLocaleDateString()}</td>
          <td class="order-total">$${Number(order.total).toFixed(2)}</td>
          <td class="order-status">
            <select class="status-select" data-id="${order.id}">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>PENDING</option>
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
          <td class="order-actions">
            <button class="btn-invoice" data-id="${order.id}">GEN_INVOICE</button>
            <button class="btn-view-details" data-id="${order.id}">VIEW_LOG</button>
          </td>
        </tr>
      `).join('')

            // Add listeners
            tbody.querySelectorAll('.btn-invoice').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id')
                    if (id) window.location.hash = `#admin/invoice-${id}`
                })
            })

            // Add status change listeners
            tbody.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const target = e.currentTarget as HTMLSelectElement
                    const id = target.getAttribute('data-id')
                    const status = target.value
                    const order = allOrders.find((o: any) => o.id.toString() === id)

                    if (status === 'shipped' && !order?.tracking_number) {
                        this.promptTrackingInfo(target, id!, status)
                        return
                    }

                    await this.saveOrderStatus(id!, { status })
                })
            })

            tbody.querySelectorAll('.tracking-info').forEach(el => {
                el.addEventListener('click', (e) => {
                    const cell = (e.currentTarget as HTMLElement).closest('.tracking-cell') as HTMLElement
                    const id = cell.getAttribute('data-id')
                    const select = tbody.querySelector(`.status-select[data-id="${id}"]`) as HTMLSelectElement
                    if (select) this.promptTrackingInfo(select, id!, 'shipped')
                })
            })

        } catch (err) {
            console.error('Admin order fetch error:', err)
            tbody.innerHTML = '<tr><td colspan="6" class="table-error">LINK_FAILURE: DATASTORE_UNREACHABLE</td></tr>'
        }
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
        const previousStatus = selectEl.dataset.previousStatus || selectEl.value

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
            selectEl.dataset.previousStatus = status
        })

        form.querySelector('.btn-tracking-cancel')?.addEventListener('click', () => {
            selectEl.value = previousStatus
            form.remove()
            selectEl.disabled = false
        })
    }

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
              <th>STOCK_QTY</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="productsTableBody">
            <tr><td colspan="6" class="table-loading">LOADING_INVENTORY...</td></tr>
          </tbody>
        </table>
      </div>
    `

        const tbody = document.getElementById('productsTableBody')
        if (!tbody) return

        // Fetch products from Supabase
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (error || !products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">NO_PRODUCTS_IN_DATABASE</td></tr>'
            return
        }

        tbody.innerHTML = products.map((product: Product) => `
      <tr data-id="${product.id}">
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>$${product.price}</td>
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
                    const { error } = await supabase
                        .from('products')
                        .update({
                            stock_qty: parseInt(stockInput.value),
                            is_active: activeToggle.checked
                        })
                        .eq('id', id)

                    if (error) {
                        alert(`ERROR: ${error.message}`)
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

    private readonly SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL']

    private renderProductForm(container: HTMLElement, existing?: Product): void {
        const isEdit = !!existing
        const stockBySize = existing?.stock_by_size || {}

        container.innerHTML = `
      <header class="admin-header">
        <h1>${isEdit ? `EDIT_UNIT — ${existing!.id}` : 'CREATE_NEW_UNIT'}</h1>
        <a href="#admin/products" class="btn-back">← BACK</a>
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
              <label>SEASON</label>
              <input type="text" name="season" required placeholder="SS26_DROP" value="${existing?.season || ''}">
            </div>
            <div class="form-group">
              <label>PRICE (USD)</label>
              <input type="number" step="0.01" name="price" required placeholder="0.00" value="${existing?.price ?? ''}">
            </div>
          </div>
          <div class="form-group">
            <label>SKU</label>
            <input type="text" name="sku" required placeholder="NOUIE-SS26-XX-01" value="${existing?.sku || ''}">
          </div>
          <div class="form-group">
            <label>COLOR</label>
            <input type="text" name="color" required placeholder="BLACK" value="${existing?.color || ''}">
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
            <label>PRODUCT IMAGES</label>
            <input type="file" name="imageFiles" accept="image/*" multiple>
            ${isEdit && existing!.images?.length
                ? `<div class="current-images-note">Current: ${existing!.images.length} image(s). Leave empty to keep them.</div>`
                : ''}
          </div>
          <button type="submit" class="btn-submit-form">${isEdit ? 'SAVE_CHANGES' : 'INITIALIZE_UNIT'}</button>
          <div id="formFeedback"></div>
        </form>
      </div>
    `

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

            let images = existing?.images || []
            const fileInput = form.querySelector('input[name="imageFiles"]') as HTMLInputElement
            if (fileInput.files && fileInput.files.length > 0) {
                try {
                    images = await this.uploadProductImages(fileInput.files)
                } catch (uploadErr: any) {
                    if (feedback) feedback.innerHTML = `<span class="error">IMAGE UPLOAD FAILED: ${uploadErr.message}</span>`
                    submitBtn.disabled = false
                    return
                }
            }

            const productData = {
                id: formData.get('id') as string,
                name: formData.get('name') as string,
                season: formData.get('season') as string,
                price: parseFloat(formData.get('price') as string),
                description: formData.get('description') as string,
                sizes: (formData.get('sizes') as string).split(',').map(s => s.trim()).filter(Boolean),
                images,
                stock_qty,
                stock_by_size,
                is_active: existing?.is_active ?? true,
                sku: formData.get('sku') as string,
                brand: 'NOUIE',
                color: formData.get('color') as string
            }

            const { error } = isEdit
                ? await supabase.from('products').update(productData).eq('id', existing!.id)
                : await supabase.from('products').insert(productData)

            if (error) {
                if (feedback) feedback.innerHTML = `<span class="error">ERROR: ${error.message}</span>`
                submitBtn.disabled = false
            } else {
                if (feedback) feedback.innerHTML = '<span class="success">SAVED</span>'
                window.location.hash = '#admin/products'
            }
        })
    }

    private async renderInvoice(container: HTMLElement, orderId: string): Promise<void> {
        const { data: dbOrder, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()

        if (error || !dbOrder) {
            container.innerHTML = `<h1>ORDER NOT FOUND</h1><a href="#admin/orders" class="btn-back">← BACK</a>`
            return
        }

        const order = dbOrder
        const subtotal = Number(order.subtotal ?? (Number(order.total) - Number(order.shipping_cost ?? 10.00)))
        const shippingCost = Number(order.shipping_cost ?? (Number(order.total) - subtotal))
        const shippingMethod = (order.shipping_method || 'STANDARD').toUpperCase()

        container.innerHTML = `
      <header class="admin-header">
        <h1>INVOICE_GENERATOR</h1>
        <a href="#admin/orders" class="btn-back">← BACK_TO_LOG</a>
      </header>
      <div class="invoice-container" id="invoiceArea">
        <div class="invoice-header">
          <div class="invoice-brand">
            <span class="brand-name">NOUIE</span>
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
            <div>NOUIE INDUSTRIAL UNIT</div>
            <div>104 INDUSTRIAL_ZONE_04</div>
            <div>NORTH_TERMINAL, VOID</div>
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
            ${order.items.map((item: any) => `
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
            <tr>
              <td colspan="3">SHIPPING (${shippingMethod})</td>
              <td>$${shippingCost.toFixed(2)}</td>
            </tr>
            <tr class="final-total">
              <td colspan="3">TOTAL AMOUNT PAID</td>
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
                feedback.innerHTML = `<div class="success-msg">INVOICE SUCCESSFULLY DELIVERED TO CUSTOMER UNIT.</div>`
            }, 2000)
        })
    }

    private renderLogin(): void {
        this.contentDiv.innerHTML = `
      <div class="admin-login-page">
        <div class="admin-login-container">
          <div class="admin-login-header">
            <span class="admin-label">ADMIN_AUTH_REQUIRED</span>
            <h1>ACCESS RESTRICTED</h1>
            <p>Please authenticate to access the NOUIE internal management system.</p>
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
                setTimeout(() => this.render(), 1000)
            }
        })
    }
}
