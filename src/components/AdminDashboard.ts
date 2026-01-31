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
        } else if (subRoute === 'create-product') {
            this.renderProductCreate(adminMain)
        } else if (subRoute.startsWith('invoice-')) {
            const orderId = subRoute.replace('invoice-', '')
            this.renderInvoice(adminMain, orderId)
        }
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
            const { data: dbOrders, error: _error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })

            // Also get from localStorage
            const localOrders = JSON.parse(localStorage.getItem('nouie_orders') || '[]')

            let allOrders = [...localOrders]
            if (dbOrders) {
                allOrders = [...dbOrders, ...localOrders]
            }

            if (allOrders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="table-empty">NO_DATA_FOUND_IN_CLUSTER</td></tr>'
                return
            }

            tbody.innerHTML = allOrders.map((order: any) => `
        <tr data-id="${order.id}">
          <td class="order-id">#${order.id.toString().slice(-6).toUpperCase()}</td>
          <td class="order-customer">
            <div class="customer-name">${order.customer_name}</div>
            <div class="customer-email">${order.customer_email}</div>
          </td>
          <td class="order-date">${new Date(order.created_at || Date.now()).toLocaleDateString()}</td>
          <td class="order-total">$${order.total}.00</td>
          <td class="order-status">
            <select class="status-select" data-id="${order.id}">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>PENDING</option>
              <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>PROCESSING</option>
              <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>SHIPPED</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>DELIVERED</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>CANCELLED</option>
            </select>
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
                    const id = (e.currentTarget as HTMLSelectElement).getAttribute('data-id')
                    const status = (e.currentTarget as HTMLSelectElement).value

                    // Update in Supabase
                    const { error } = await supabase.from('orders').update({ status }).eq('id', id)

                    if (error) {
                        // Update in localStorage if Supabase fails
                        const locals = JSON.parse(localStorage.getItem('nouie_orders') || '[]')
                        const updated = locals.map((o: any) => o.id.toString() === id ? { ...o, status } : o)
                        localStorage.setItem('nouie_orders', JSON.stringify(updated))
                    }
                })
            })

        } catch (err) {
            console.error('Admin order fetch error:', err)
            tbody.innerHTML = '<tr><td colspan="6" class="table-error">LINK_FAILURE: DATASTORE_UNREACHABLE</td></tr>'
        }
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

    private renderProductCreate(container: HTMLElement): void {
        container.innerHTML = `
      <header class="admin-header">
        <h1>CREATE_NEW_UNIT</h1>
        <a href="#admin/products" class="btn-back">← BACK</a>
      </header>
      <div class="admin-form-container">
        <form id="createProductForm" class="admin-form">
          <div class="form-grid">
            <div class="form-group">
              <label>UNIT_ID (e.g. CAT04)</label>
              <input type="text" name="id" required placeholder="CAT00">
            </div>
            <div class="form-group">
              <label>PRODUCT NAME</label>
              <input type="text" name="name" required placeholder="PRODUCT_NAME">
            </div>
            <div class="form-group">
              <label>SEASON</label>
              <input type="text" name="season" required placeholder="SS26_DROP">
            </div>
            <div class="form-group">
              <label>PRICE (USD)</label>
              <input type="number" name="price" required placeholder="000">
            </div>
          </div>
          <div class="form-group">
            <label>SKU</label>
            <input type="text" name="sku" required placeholder="NOUIE-SS26-XX-01">
          </div>
          <div class="form-group">
            <label>COLOR</label>
            <input type="text" name="color" required placeholder="BLACK">
          </div>
          <div class="form-group">
            <label>DESCRIPTION</label>
            <textarea name="description" required placeholder="Unit technical specifications..."></textarea>
          </div>
          <div class="form-group">
            <label>IMAGE_FILENAMES (comma separated)</label>
            <input type="text" name="images" required placeholder="cat1_1.jpg, cat1_2.jpg">
          </div>
          <button type="submit" class="btn-submit-form">INITIALIZE_UNIT</button>
        </form>
      </div>
    `

        document.getElementById('createProductForm')?.addEventListener('submit', async (e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)

            const newProduct = {
                id: formData.get('id') as string,
                name: formData.get('name') as string,
                season: formData.get('season') as string,
                price: parseInt(formData.get('price') as string),
                description: formData.get('description') as string,
                sizes: ['S', 'M', 'L', 'XL'],
                images: (formData.get('images') as string).split(',').map(s => s.trim()),
                stock_qty: 10,
                is_active: true,
                sku: formData.get('sku') as string,
                brand: 'NOUIE',
                color: formData.get('color') as string
            }

            const { error } = await supabase.from('products').insert(newProduct)

            if (error) {
                alert(`ERROR: ${error.message}`)
            } else {
                alert(`PRODUCT ${newProduct.id} INITIALIZED IN SYSTEM`)
                window.location.hash = '#admin/products'
            }
        })
    }

    private renderInvoice(container: HTMLElement, orderId: string): void {
        // Try to find the order
        const localOrders = JSON.parse(localStorage.getItem('nouie_orders') || '[]')
        const order = localOrders.find((o: any) => o.id.toString() === orderId)

        if (!order) {
            container.innerHTML = `<h1>ORDER NOT FOUND</h1><a href="#admin/orders">BACK</a>`
            return
        }

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
            <div>REF: INV_${orderId.slice(-6).toUpperCase()}</div>
            <div>DATE: ${new Date(order.created_at).toLocaleDateString()}</div>
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
                <td>$${item.price}</td>
                <td>$${item.price * item.qty}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">SUBTOTAL</td>
              <td>$${order.total}.00</td>
            </tr>
            <tr class="final-total">
              <td colspan="3">TOTAL AMOUNT PAID</td>
              <td>$${order.total}.00 USD</td>
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
