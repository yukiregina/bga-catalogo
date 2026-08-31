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

// ─── SKU composto ────────────────────────────────────────────────────────────
// Único lugar que monta o SKU — carrinho, ficha e cotação usam esta função,
// não reimplementam a lógica.
export function buildComposedSKU(baseSku, axes, materialId, gauge, treatmentId) {
  let sku = baseSku

  const axisVals = Object.values(axes ?? {})
  if (axisVals.length > 0) sku += '-' + axisVals.join('x')

  if (materialId) {
    const names = { sae1006: 'SAE1006', aisi304: 'AISI304', aisi316: 'AISI316', alum1100: 'ALUM' }
    sku += ' · ' + (names[materialId] ?? materialId.toUpperCase())
  }
  if (gauge) sku += ' · ' + gauge
  if (treatmentId) {
    const names = { pz: 'PZ', gf: 'GF', elec: 'ELEC', liq: 'LIQ' }
    sku += ' · ' + (names[treatmentId] ?? treatmentId.toUpperCase())
  }
  return sku
}

// ─── Configuração na URL da ficha ────────────────────────────────────────────
// config: { variante, axes: { ancho, ala, ... }, material, espesor } — valores
// crus (sem o sufixo "(variante a confirmar)" do composedSKU). Usado tanto
// pela ficha (grava ao vivo) quanto pelo carrinho (reconstrói o link salvo).
export function buildConfigQuery(config) {
  if (!config) return ''
  const params = new URLSearchParams()
  if (config.variante) params.set('variante', config.variante)
  Object.entries(config.axes ?? {}).forEach(([id, value]) => {
    if (value !== undefined && value !== null) params.set(id, String(value))
  })
  if (config.material) params.set('material', config.material)
  if (config.espesor) params.set('espesor', config.espesor)
  return params.toString()
}

// ─── Variantes — normaliza o schema novo { sku, label, role } e o antigo
// { code, attributes } que ST2239 e KIT5262 ainda usam. Nenhuma das duas está
// roteada hoje, mas sem isso as opções do <select> renderizariam em branco
// no dia em que entrarem.
export function normalizeVariant(v) {
  if (!v) return v
  return {
    sku: v.sku ?? v.code,
    label: v.label ?? (v.attributes ? Object.values(v.attributes).join(' · ') : ''),
    role: v.role ?? 'pieza',
  }
}

// ─── Título da linha do carrinho ────────────────────────────────────────────
// A tapa é uma peça diferente da bandeja — o título tem que dizer isso.
export function buildLineTitle(product, variant) {
  if (variant?.role === 'tapa') return `Tapa para ${product.name}`
  return product.name
}

// Tira o "[A]"/"[B]" do label do eixo — útil no seletor da ficha, redundante
// numa frase corrida.
function stripAxisBracket(label) {
  return (label ?? '').replace(/\s*\[[^\]]*\]\s*$/, '')
}

// ─── Config legível em español — o que o carrinho, o WhatsApp e a planilha
// mostram além do SKU composto. Ex.: "Lisa Tipo C · Ancho 500 mm · Ala 150 mm
// · Acero inoxidable AISI 304 · Espesor #14". Omite o que não existe.
export function buildConfigLabel({ variant, axes = [], material, gauge, globalSpecs } = {}) {
  const parts = []
  if (variant?.label) parts.push(variant.label)

  axes.forEach(ax => {
    if (ax.value === undefined || ax.value === null) return
    const label = stripAxisBracket(ax.label ?? ax.id)
    parts.push(`${label} ${ax.value}${ax.unit ? ` ${ax.unit}` : ''}`)
  })

  const materialName = globalSpecs?.materials?.find(m => m.id === material)?.name
  if (materialName) parts.push(materialName)

  if (gauge) parts.push(`Espesor ${gauge}`)

  return parts.join(' · ')
}
