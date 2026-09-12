// Sous inik pou konstwi URL imaj.
//
// Imaj Franckley telechaje nan admin nan ale nan Supabase Storage jan yo soti
// nan aparèy fòto a — mezire sou pwodwi CAT04: 455 Ko a 2.6 Mo chak, 9.1 Mo
// pou 6 foto. Supabase gen yon transfòmatè ki redimansyone epi konprese sou
// vòl (epi ki sèvi WebP lè navigatè a aksepte l): menm foto a tonbe de 1.6 Mo
// a 106 Ko. Nou pase tout URL Storage ladan l.
//
// Fichye lokal nan /assets pa pase la — yo sèvi jan yo ye.

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200">' +
    '<rect width="800" height="1200" fill="#1a1a1a"/>' +
    '<text x="400" y="600" fill="#555" font-family="monospace" font-size="42" ' +
    'text-anchor="middle" letter-spacing="6">NO IMAGE</text></svg>'
  )

export const NO_IMAGE = PLACEHOLDER

/** `width` se lajè aparan an nan CSS px; nou mande 2× pou ekran retina. */
export function imageSrc(img?: string | null, width = 700): string {
  if (!img) return PLACEHOLDER
  if (!img.startsWith('http')) return `/assets/${img}`
  if (!img.includes('/storage/v1/object/public/')) return img

  const target = Math.min(Math.round(width * 2), 1600)
  const quality = target <= 800 ? 62 : 70
  return img.replace('/object/public/', '/render/image/public/') +
    `?width=${target}&quality=${quality}`
}
