// Gera public/sitemap.xml a partir de lib/catalog.json. Roda no prebuild (ver
// package.json), ao lado do build-search-index.mjs — antes disso o sitemap
// era escrito à mão e ficou parado em 2026-08-29, sem "gabinetes"/"tableros"
// que já têm ficha própria e ainda citando "aramados", que nem existe mais
// como categoria.
//
// Uma entrada por página que generateStaticParams realmente gera:
//   app/catalogo/[categoria]/page.jsx          → uma por categoria
//   app/catalogo/[categoria]/[produto]/page.jsx → uma por produto E por
//     subfamília (as duas moram no mesmo array `products`, distintas só pelo
//     campo `type`), só em categorias com displayMode "catalog" — mesma
//     guarda das duas páginas.
//
// catalog.json ainda não tem um campo `active`/`draft`: hoje toda categoria e
// todo produto do JSON vira página, e é por isso que este script não filtra
// nada além da guarda de displayMode acima. Se um dia entrar um jeito de
// marcar item como rascunho (fora do catálogo publicado), o filtro entra
// bem aqui, no mesmo lugar que hoje decide o displayMode.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL } from '../lib/site.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const catalogPath = path.join(__dirname, '..', 'lib', 'catalog.json')
const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml')

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
const today = new Date().toISOString().slice(0, 10)

const urls = []

function addUrl(loc, changefreq, priority) {
  urls.push({ loc: `${SITE_URL}${loc}`, changefreq, priority })
}

// Mesmo default de lib/product-helpers.js (getCategoryDisplayMode), duplicado
// de propósito — mesmo motivo do normalize() em build-search-index.mjs: este
// script roda em Node puro no prebuild, fora do bundle do Next.
function displayMode(category) {
  return category.displayMode ?? 'catalog'
}

// Rotas estáticas. /cotacao/ fica de fora: não é conteúdo pra indexar, é o
// carrinho de quem está navegando — o que aparece ali vem do localStorage de
// cada visitante, não da URL. Indexado, o Google veria uma página vazia (ou,
// pior, o rascunho de cotização de quem quer que tenha aberto a rota com
// ?editar= na hora do crawl) — nunca a mesma coisa duas vezes.
addUrl('/', 'weekly', '1.0')
addUrl('/catalogo/', 'weekly', '1.0')
addUrl('/materiales-y-tratamientos/', 'monthly', '0.7')
addUrl('/politica-de-privacidad/', 'yearly', '0.3')

catalog.categories.forEach(category => {
  addUrl(`/catalogo/${category.id}/`, 'weekly', '0.8')

  if (displayMode(category) !== 'catalog') return

  catalog.products
    .filter(p => p.categoryId === category.id)
    .forEach(item => {
      // Hub de subfamília pesa um pouco mais que a ficha de um SKU: agrupa
      // vários produtos e é o link que a página de família manda primeiro.
      const priority = item.type === 'subfamilia' ? '0.65' : '0.6'
      addUrl(`/catalogo/${category.id}/${item.id}/`, 'monthly', priority)
    })
})

const body = urls
  .map(({ loc, changefreq, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`

fs.writeFileSync(outputPath, xml)
console.log(`sitemap.xml: ${urls.length} URL(s)`)
