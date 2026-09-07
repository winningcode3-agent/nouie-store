// Secure, lightweight Markdown parser with strict HTML escaping to prevent XSS

export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

export function renderSafeMarkdown(markdown: string): string {
    if (!markdown) return ''

    // 1. Sanitize input by escaping all raw HTML tags first
    const safeText = escapeHtml(markdown)

    // 2. Process line by line
    const lines = safeText.split('\n')
    const htmlLines: string[] = []
    let inList = false

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim()

        if (!line) {
            if (inList) {
                htmlLines.push('</ul>')
                inList = false
            }
            continue
        }

        // List item
        if (line.startsWith('- ') || line.startsWith('* ')) {
            if (!inList) {
                htmlLines.push('<ul>')
                inList = true
            }
            const content = formatInline(line.substring(2).trim())
            htmlLines.push(`<li>${content}</li>`)
            continue
        }

        if (inList) {
            htmlLines.push('</ul>')
            inList = false
        }

        // Headings
        if (line.startsWith('### ')) {
            htmlLines.push(`<h3>${formatInline(line.substring(4).trim())}</h3>`)
        } else if (line.startsWith('## ')) {
            htmlLines.push(`<h2>${formatInline(line.substring(3).trim())}</h2>`)
        } else if (line.startsWith('# ')) {
            htmlLines.push(`<h1>${formatInline(line.substring(2).trim())}</h1>`)
        } else {
            // Normal paragraph
            htmlLines.push(`<p>${formatInline(line)}</p>`)
        }
    }

    if (inList) {
        htmlLines.push('</ul>')
    }

    return htmlLines.join('\n')
}

function formatInline(text: string): string {
    return text
        // Bold: **text**
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic: *text*
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Safe links: [text](url) — allow only safe schemes (http, https, #, /)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|#[^\s)]+|\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}
