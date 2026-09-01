// Este arquivo carrega os dados dos produtos.
// Agora usa o JSON local (placeholder).
// Quando o Google Sheets estiver pronto, a lógica de busca vai entrar aqui —
// o resto do projeto não precisa mudar.
//
// ⚠️ SÓ SERVER COMPONENT IMPORTA DAQUI. O `import data from './catalog.json'`
// abaixo é o catálogo inteiro (155 KB); qualquer componente client que importe
// qualquer coisa deste arquivo o leva junto pro navegador. Função pura vive em
// lib/product-helpers.js e é de lá que componente client importa.
// Ver item 34 do docs/BUGS-carrinho-2026-08-29.md.

import data from './catalog.json'
import { getCategoryDisplayMode } from './product-helpers'

// Reexporta as funções puras: quem já importava daqui (Server Component) não
// muda nada. Componente client importa de '@/lib/product-helpers'.
export {
  getCategoryDisplayMode,
  parseMinThicknessRule,
  getProductImageAlt,
  buildComposedSKU,
  buildConfigQuery,
  normalizeVariant,
  buildLineTitle,
  buildConfigLabel,
} from './product-helpers'

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

export function isCatalogCategory(categoryId) {
  return getCategoryDisplayMode(getCategoryById(categoryId)) === 'catalog'
}

// ─── Recortes para componente client ────────────────────────────────────────
// Server Component chama estes e passa o resultado como prop. É o que mantém o
// catalog.json fora do navegador: em vez de mandar o catálogo e deixar o client
// filtrar, manda só o que ele desenha.

// Header, em todas as páginas do site. Só id e nome — 6 registros, ~200 bytes.
export function getCategoryNav() {
  return data.categories.map(c => ({ id: c.id, name: c.name }))
}

// Grade de famílias da home (ProductFinder) e do /catalogo (CatalogPageClient).
// A contagem de produtos já vem resolvida: sem isso o client precisaria da
// lista inteira de produtos só para dar um `.length`.
export function getCategoryCards() {
  return data.categories.map(c => ({
    id: c.id,
    name: c.name,
    image: c.image ?? null,
    description: c.description ?? '',
    cardDescription: c.cardDescription ?? null,
    productCount:
      getCategoryDisplayMode(c) === 'catalog' ? getProductsByCategory(c.id).length : 0,
  }))
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
