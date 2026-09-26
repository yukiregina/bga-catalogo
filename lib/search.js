// Busca do catálogo — lê o índice gerado no prebuild (lib/search-index.json),
// nunca lib/catalog.json. É o que mantém o catálogo inteiro fora do bundle do
// client: importar qualquer coisa de lib/products.js aqui traria tudo de volta.

import searchIndex from './search-index.json'

// minúsculas, sem acento, "200mm"/"200 mm" → "200" e "200x50"/"200 × 50" →
// "200 50" (medida escrita como ancho×alto vira dois números) — mesma regra
// usada pra montar o haystack no prebuild.
export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/(\d+)\s*mm\b/g, '$1')
    .replace(/(\d)\s*[x×]\s*(?=\d)/g, '$1 ')
}

// Tira gênero/plural do fim da palavra digitada: "galvanizada" → "galvanizad"
// casa com "galvanizado", "bandejas" → "bandej" casa com "bandeja". Só na
// query — o haystack fica inteiro, e a busca por substring faz o resto. Nunca
// deixa o radical com menos de 4 letras ("tapa" continua "tapa", não "tap").
const SUFFIXES = ['as', 'os', 'es', 'a', 'o', 's']
function stem(token) {
  if (token.length < 5 || !/^[a-z]+$/.test(token)) return token
  for (const suffix of SUFFIXES) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      return token.slice(0, -suffix.length)
    }
  }
  return token
}

function tokenize(query) {
  return normalize(query)
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(stem)
}

// Número casa como número inteiro, não como pedaço de outro: "200" não pode
// achar o comprimento "2000". Letra encostada vale ("3012" acha o SKU
// "ct3012"); dígito encostado não.
function matcher(token) {
  if (/^\d+$/.test(token)) {
    const re = new RegExp(`(?:^|\\D)${token}(?:\\D|$)`)
    return text => re.test(text)
  }
  return text => text.includes(token)
}

// Casa quem tem TODOS os tokens da query no haystack. Ordena quem casa todos
// os tokens no nome primeiro (produto certo antes do acessório que só cita o
// termo de passagem); empate por nome A-Z.
export function searchProducts(query, { categoryId } = {}) {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []
  const matchers = tokens.map(matcher)

  let results = searchIndex.filter(entry =>
    matchers.every(m => m(entry.haystack))
  )

  if (categoryId) {
    results = results.filter(entry => entry.categoryId === categoryId)
  }

  results.sort((a, b) => {
    const aName = normalize(a.name)
    const bName = normalize(b.name)
    const aInName = matchers.every(m => m(aName))
    const bInName = matchers.every(m => m(bName))
    if (aInName !== bInName) return aInName ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return results
}
