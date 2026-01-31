// SEO Utility - 2026 Standards (GEO & AI Preparation)

import type { Product } from './types'

export class SEO {
    private static baseUrl = window.location.origin

    /**
     * Updates meta tags for a given page
     */
    static updateMeta(title: string, description: string) {
        document.title = `${title} | NOUIE`

        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
            metaDesc.setAttribute('content', description)
        } else {
            const newMeta = document.createElement('meta')
            newMeta.name = 'description'
            newMeta.content = description
            document.head.appendChild(newMeta)
        }
    }

    /**
     * Injects JSON-LD schema into the head
     */
    static injectJSONLD(schema: object) {
        // Remove existing schema scripts to prevents duplication
        const existingScript = document.getElementById('seo-json-ld')
        if (existingScript) {
            existingScript.remove()
        }

        const script = document.createElement('script')
        script.id = 'seo-json-ld'
        script.type = 'application/ld+json'
        script.text = JSON.stringify({
            '@context': 'https://schema.org',
            ...schema
        })
        document.head.appendChild(script)
    }

    /**
     * Generates Product Schema (JSON-LD)
     */
    static generateProductSchema(product: Product) {
        const schema: any = {
            '@type': 'Product',
            'name': product.name,
            'image': product.images.map(img => `${this.baseUrl}/assets/${img}`),
            'description': product.description,
            'sku': product.sku,
            'brand': {
                '@type': 'Brand',
                'name': product.brand
            },
            'color': product.color,
            'material': product.material,
            'offers': {
                '@type': 'Offer',
                'url': `${this.baseUrl}/#product-${product.id}`,
                'priceCurrency': 'USD',
                'price': product.price,
                'availability': product.stock_qty && product.stock_qty > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                'hasMerchantReturnPolicy': {
                    '@type': 'MerchantReturnPolicy',
                    'applicableCountry': 'US',
                    'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnPeriod',
                    'merchantReturnDays': 14,
                    'returnMethod': 'https://schema.org/ReturnByMail',
                    'returnFees': 'https://schema.org/ReturnFeesCustomerPaying'
                },
                'shippingDetails': {
                    '@type': 'OfferShippingDetails',
                    'shippingRate': {
                        '@type': 'MonetaryAmount',
                        'value': 10,
                        'currency': 'USD'
                    },
                    'deliveryTime': {
                        '@type': 'ShippingDeliveryTime',
                        'handlingTime': {
                            '@type': 'QuantitativeValue',
                            'minValue': 1,
                            'maxValue': 3,
                            'unitCode': 'DAY'
                        },
                        'transitTime': {
                            '@type': 'QuantitativeValue',
                            'minValue': 5,
                            'maxValue': 7,
                            'unitCode': 'DAY'
                        }
                    }
                }
            }
        }

        if (product.variants && product.variants.length > 0) {
            schema['@type'] = 'ProductGroup'
            schema['productGroupID'] = product.sku
            schema['hasVariant'] = product.variants.map(v => ({
                '@type': 'Product',
                'name': v.name,
                'sku': v.sku,
                'color': v.color,
                'image': v.images.map(img => `${this.baseUrl}/assets/${img}`),
                'offers': {
                    '@type': 'Offer',
                    'price': v.price,
                    'priceCurrency': 'USD',
                    'availability': v.stock_qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
                }
            }))
        }

        return schema
    }

    /**
     * Generates Organization Schema
     */
    static generateOrgSchema() {
        return {
            '@type': 'Organization',
            'name': 'NOUIE',
            'url': this.baseUrl,
            'logo': `${this.baseUrl}/vite.svg`,
            'description': 'Evolution of streetwear through technical precision and architectural symmetry.'
        }
    }
}
