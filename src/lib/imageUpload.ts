// Redui yon foto nan navigatè a anvan li monte nan Storage.
//
// Foto ki soti nan yon telefòn fè 2 a 5 Mo epi yo gen 3000+ px delajè —
// mezire sou pwodwi CAT04: 9.1 Mo pou 6 foto. Boutik la pa janm bezwen plis
// pase ~1600 px, donk nou redui anvan telechajman an olye nou sere orijinal
// la pou toutan.

const MAX_SIDE = 1600
const QUALITY = 0.82

/**
 * Retounen yon fichye JPEG redui. Si navigatè a pa ka trete imaj la
 * (fòma ki pa sipòte, erè dekodaj), nou remèt fichye orijinal la — pi bon
 * yon telechajman lou pase yon telechajman ki echwe.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))

    // Deja piti epi deja lejè: pa gen anyen pou n genyen.
    if (scale === 1 && file.size <= 400 * 1024) {
      bitmap.close()
      return file
    }

    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close(); return file }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    const blob: Blob | null = await new Promise(res =>
      canvas.toBlob(res, 'image/jpeg', QUALITY)
    )
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch (err) {
    console.warn('Could not shrink image, uploading original:', err)
    return file
  }
}
