// Gera lib/search-index.json a partir de lib/catalog.json. Roda no prebuild
// (ver package.json) — o arquivo de saída é gerado, não versionado (.gitignore).
//
// Índice enxuto: uma entrada por ficha de produto (type === 'producto') nas
// famílias com displayMode 'catalog' — hoje só Bandejas, 36 entradas. As
// subfamílias (5 em Bandejas) não têm ficha própria e ficam de fora.
//
// lib/search.js lê este arquivo e nunca importa catalog.json diretamente —
// é o que evita que o catálogo inteiro volte pro bundle do client só por
// causa da busca.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const catalogPath = path.join(__dirname, '..', 'lib', 'catalog.json')
const outputPath = path.join(__dirname, '..', 'lib', 'search-index.json')

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))

// Mesma normalização de lib/search.js — duplicada de propósito: este script
// roda em Node puro no prebuild, lib/search.js é bundlado pelo Next. Manter
// as duas em sincronia se uma mudar.
function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/(\d+)mm\b/gi, '$1')
}

// Junta tudo que a busca deveria achar num produto — nome, subtítulo, id,
// keywords, SKUs (do produto e de cada variante) e os valores dos eixos de
// dimensão — depois limpa pontuação/espaço e deduplica token por token
// preservando a ordem (corta ~20% do peso do índice).
function buildHaystack(product) {
  const parts = []

  parts.push(product.name ?? '')
  parts.push(product.subtitle ?? '')
  parts.push((product.id ?? '').replace(/-/g, ' '))
  parts.push(product.keywords ?? '')
  if (product.sku) parts.push(product.sku)

  ;(product.variants ?? []).forEach(v => {
    if (v.sku) parts.push(v.sku)
    else if (v.code) parts.push(v.code)
    if (v.label) parts.push(v.label)
    if (v.attributes) parts.push(...Object.values(v.attributes).map(String))
  })

  ;(product.dimensionAxes ?? []).forEach(axis => {
    (axis.values ?? []).forEach(value => parts.push(String(value)))
  })

  const cleaned = normalize(parts.join(' '))
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const seen = new Set()
  const tokens = []
  cleaned.split(' ').forEach(token => {
    if (token && !seen.has(token)) {
      seen.add(token)
      tokens.push(token)
    }
  })

  return tokens.join(' ')
}

const catalogCategoryIds = new Set(
  catalog.categories.filter(c => c.displayMode === 'catalog').map(c => c.id)
)

const categoryNameById = Object.fromEntries(
  catalog.categories.map(c => [c.id, c.name])
)

const index = catalog.products
  .filter(p => p.type === 'producto' && catalogCategoryIds.has(p.categoryId))
  .map(p => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: categoryNameById[p.categoryId] ?? '',
    image: p.images?.primary ?? null,
    haystack: buildHaystack(p),
  }))

fs.writeFileSync(outputPath, JSON.stringify(index))
console.log(`search-index.json: ${index.length} produto(s)`)
