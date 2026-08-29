// Este arquivo carrega os dados dos produtos.
// Agora usa o JSON local (placeholder).
// Quando o Google Sheets estiver pronto, a lógica de busca vai entrar aqui —
// o resto do projeto não precisa mudar.

import data from './catalog.json'

export function getCategories() {
  return data.categories
}

// Só "producto" — "subfamilia" não é ficha nem entra na grilla/busca.
// Ausência do campo `type` = "producto" (retrocompatível com as outras famílias).
function isProductoPage(p) {
  return (p.type ?? 'producto') === 'producto'
}

export function getProductsByCategory(categoryId) {
  return data.products.filter(p => p.categoryId === categoryId && isProductoPage(p))
}

export function getAllProducts() {
  return data.products.filter(isProductoPage)
}

export function getSubfamiliesByCategory(categoryId) {
  return data.products.filter(p => p.categoryId === categoryId && p.type === 'subfamilia')
}

export function getMaterialsPage() {
  return data.materialsPage ?? null
}

export function getBrand() {
  return data.brand
}

export function getProductById(productId) {
  return data.products.find(p => p.id === productId) ?? null
}

export function getCategoryById(categoryId) {
  return data.categories.find(c => c.id === categoryId) ?? null
}

// ─── Display mode por família ────────────────────────────────────────────────
// "catalog" → experiência completa (grid + ficha + cotização)
// "pdf"     → página da família só com intro + botão "Descargar PDF" (category.pdfUrl)
// "contact" → página da família só com intro + bloco de contato (WhatsApp/email)
// Ausência do campo = "catalog" (retrocompatível).

export function getCategoryDisplayMode(category) {
  return category?.displayMode ?? 'catalog'
}

export function isCatalogCategory(categoryId) {
  return getCategoryDisplayMode(getCategoryById(categoryId)) === 'catalog'
}

// ─── Camada de recomendação (colunas novas do Sheet) ────────────────────────
// No Sheet, cada produto pode trazer (todas opcionais):
//   recommended        → "CT3114,CT3210" (lista de códigos)  → string[] no JSON
//   minThicknessRule   → ">=500:#14; >=300:#16; <300:#18"    → string
//   recommendationNote → texto livre curto                    → string
// Quando a importação do Sheet entrar aqui, mapear essas 3 colunas 1:1.

// Resolve códigos → produtos existentes, preservando a ordem da lista.
// Códigos que não existem no catálogo são ignorados silenciosamente.
export function resolveRecommendedProducts(codes) {
  if (!Array.isArray(codes)) return []
  return codes.map(code => getProductById(code)).filter(Boolean)
}

// Converte ">=500:#14; >=300:#16; <300:#18" em regras ordenadas:
//   [{ op: '>=', width: 500, gauge: '#14' }, ...]
// Segmentos malformados são descartados sem erro.
export function parseMinThicknessRule(rule) {
  if (typeof rule !== 'string' || !rule.trim()) return []
  return rule
    .split(';')
    .map(seg => {
      const m = seg.trim().match(/^(>=|<=|>|<|=)\s*(\d+(?:[.,]\d+)?)\s*:\s*(\S+)$/)
      if (!m) return null
      return { op: m[1], width: parseFloat(m[2].replace(',', '.')), gauge: m[3] }
    })
    .filter(Boolean)
}

// ─── Alt text de imagem — gerado do nome/subtitle da página, nunca do slug ──
// variant: 'primary' | 'tapa' | { ala: '75' }
export function getProductImageAlt(product, variant = 'primary') {
  const base = `${product.name} BGA${product.subtitle ? ` — ${product.subtitle}` : ''}`
  if (variant === 'tapa') return `Tapa para ${base}`
  if (variant && typeof variant === 'object' && variant.ala) return `${base} — kit para ala ${variant.ala} mm`
  return base
}
