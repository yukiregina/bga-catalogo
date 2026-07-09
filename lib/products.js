// Este arquivo carrega os dados dos produtos.
// Agora usa o JSON local (placeholder).
// Quando o Google Sheets estiver pronto, a lógica de busca vai entrar aqui —
// o resto do projeto não precisa mudar.

import data from './catalog.json'

export function getCategories() {
  return data.categories
}

export function getProductsByCategory(categoryId) {
  return data.products.filter(p => p.categoryId === categoryId)
}

export function getAllProducts() {
  return data.products
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
