// Busca do catálogo — lê o índice gerado no prebuild (lib/search-index.json),
// nunca lib/catalog.json. É o que mantém o catálogo inteiro fora do bundle do
// client: importar qualquer coisa de lib/products.js aqui traria tudo de volta.

import searchIndex from './search-index.json'

// minúsculas, sem acento, e "200mm" → "200" (\d seguido de mm vira só o
// número) — mesma regra usada pra montar o haystack no prebuild.
export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/(\d+)mm\b/gi, '$1')
}

function tokenize(query) {
  return normalize(query)
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

// Casa quem tem TODOS os tokens da query no haystack. Ordena quem casa todos
// os tokens no nome primeiro (produto certo antes do acessório que só cita o
// termo de passagem); empate por nome A-Z.
export function searchProducts(query, { categoryId } = {}) {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  let results = searchIndex.filter(entry =>
    tokens.every(t => entry.haystack.includes(t))
  )

  if (categoryId) {
    results = results.filter(entry => entry.categoryId === categoryId)
  }

  results.sort((a, b) => {
    const aName = normalize(a.name)
    const bName = normalize(b.name)
    const aInName = tokens.every(t => aName.includes(t))
    const bInName = tokens.every(t => bName.includes(t))
    if (aInName !== bInName) return aInName ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return results
}
