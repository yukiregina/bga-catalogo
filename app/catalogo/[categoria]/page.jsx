// Página de família — o layout depende de category.displayMode:
//   "catalog" → 1. H1 + texto rico  2. Cards de intenção  3. Grid produtos  4. Tabela material  5. FAQ + Schema
//   "pdf"     → intro curta + botão "Descargar PDF" (category.pdfUrl)
//   "contact" → intro curta + bloco de contato (WhatsApp + email)

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getProductsByCategory, getCategoryById, getCategoryDisplayMode } from '@/lib/products'
import catalogData from '@/lib/catalog.json'
import config from '@/client.config.js'
import { notFound } from 'next/navigation'
import AddToCartButton from '@/components/AddToCartButton'
import CartBadge from '@/components/CartBadge'
import NavLogo from '@/components/NavLogo'

const PRODUCTS_PER_PAGE = 18

export default function CategoriaPage({ params, searchParams }) {
  const { categoria } = params
  const page = Number(searchParams?.page ?? 1)

  const category = getCategoryById(categoria)
  if (!category) notFound()

  const displayMode = getCategoryDisplayMode(category)
  const isCatalog   = displayMode === 'catalog'

  const allProducts = isCatalog ? getProductsByCategory(categoria) : []
  const totalPages  = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE)
  const products    = allProducts.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE)

  const waNumber = config.contact.whatsapp.replace(/\D/g, '')
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hola, quisiera más información sobre la línea ${category.name}.`
  )}`

  // Schema FAQ para rich snippets
  const faqSchema = isCatalog && category.faq ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: category.faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  } : null

  return (
    <div className="min-h-screen">

      {/* Schema FAQ */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Nav */}
      <nav className="bg-brand-primary px-8 py-3 grid grid-cols-3 items-center sticky top-0 z-10">
        <NavLogo />
        <div className="flex items-center justify-center gap-5">
          {catalogData.categories.map(cat => (
            <Link key={cat.id} href={`/catalogo/${cat.id}`}
              className={`text-xs transition hidden md:block ${
                cat.id === categoria
                  ? 'text-white font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}>
              {cat.name.split(' ')[0]}
            </Link>
          ))}
        </div>
        <div className="flex justify-end">
          <CartBadge label={config.catalog.ctaText} />
        </div>
      </nav>

      <div className="p-8 max-w-6xl">

        {/* ── 1. Breadcrumb + H1 + texto rico ────────────────────────────── */}
        <div className="text-xs text-text-muted mb-4">
          <Link href="/catalogo" className="hover:underline">Catálogo</Link>
          <span className="mx-1">›</span>
          <span className="text-text-primary">{category.name}</span>
        </div>

        <h1 className="font-brand text-3xl font-bold text-brand-primary mb-3">
          {category.name}
        </h1>

        {category.richDescription && isCatalog ? (
          <div className="text-sm text-text-secondary leading-relaxed max-w-3xl mb-10 space-y-3">
            {category.richDescription.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary mb-10 max-w-3xl leading-relaxed">
            {category.description}
          </p>
        )}

        {/* ── Modo "pdf": intro + ficha técnica, sem grid de produtos ─────── */}
        {displayMode === 'pdf' && (
          <section className="max-w-3xl">
            {category.image && (
              <img
                src={category.image}
                alt={category.name}
                className="w-full aspect-[2/1] object-cover rounded-card mb-6"
              />
            )}
            {category.pdfUrl && (
              <a
                href={category.pdfUrl}
                download
                className="inline-flex items-center gap-2 bg-brand-accent text-brand-primary text-sm font-semibold px-6 py-3 rounded-lg hover:brightness-105 transition"
              >
                <svg viewBox="0 0 256 256" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V40a8,8,0,0,0-16,0v84.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"/></svg>
                Descargar ficha técnica PDF
              </a>
            )}
            <p className="text-xs text-text-muted mt-4">
              ¿Necesitás cotizar esta línea?{' '}
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary hover:underline">
                Escribinos por WhatsApp →
              </a>
            </p>
          </section>
        )}

        {/* ── Modo "contact": intro + bloco de contato ────────────────────── */}
        {displayMode === 'contact' && (
          <section className="max-w-3xl">
            {category.image && (
              <img
                src={category.image}
                alt={category.name}
                className="w-full aspect-[2/1] object-cover rounded-card mb-6"
              />
            )}
            <div className="bg-white border border-border-subtle rounded-card p-6">
              <p className="text-sm font-semibold text-brand-primary mb-1">
                Consúltanos para más información sobre esta línea.
              </p>
              <p className="text-xs text-text-secondary mb-4">
                Te asesoramos sobre disponibilidad, medidas y especificación según tu proyecto.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-wa text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:brightness-105 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/>
                  </svg>
                  Consultar por WhatsApp
                </a>
                <a
                  href={`mailto:${config.contact.email}`}
                  className="text-sm font-semibold text-brand-primary hover:underline"
                >
                  {config.contact.email}
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── 2. Cards de intenção ────────────────────────────────────────── */}
        {isCatalog && category.intentCards?.length > 0 && (
          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-4">
              ¿Qué necesitás hacer?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {category.intentCards.map((card, i) => (
                <div
                  key={i}
                  className="bg-white border border-border-subtle rounded-card p-4"
                >
                  <span className="inline-block text-[10px] font-semibold bg-brand-accent text-brand-primary uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5">
                    {card.tag}
                  </span>
                  <div className="text-sm font-semibold text-brand-primary leading-tight mb-1">
                    {card.label}
                  </div>
                  <div className="text-xs text-text-muted leading-relaxed">
                    {card.description}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 3. Grid de produtos ─────────────────────────────────────────── */}
        {isCatalog && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-brand text-base font-bold text-brand-primary">
              Productos
              <span className="font-primary font-normal text-sm text-text-muted ml-2">
                ({allProducts.length} en total)
              </span>
            </h2>
          </div>

          {products.length === 0 ? (
            <p className="text-text-muted text-sm">
              Productos disponibles en breve. Contactanos para más información.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {products.map(product => {
                const variantCount = product.variants?.length ?? 0
                const subtext = variantCount > 0
                  ? `${variantCount} variante${variantCount > 1 ? 's' : ''}`
                  : product.dimensions?.map(d => `${d.value}${d.unit}`).join(' · ') ?? ''

                return (
                  <div key={product.id} className="bg-white border border-black/8 rounded-card p-3 flex flex-col">

                    {/* Imagem */}
                    <Link href={`/catalogo/${categoria}/${product.id}`} className="block mb-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full aspect-square object-contain rounded bg-surface-elevated"
                        />
                      ) : (
                        <div className="w-full aspect-square rounded bg-surface-elevated flex items-center justify-center">
                          <span className="text-[10px] text-text-muted">sin imagen</span>
                        </div>
                      )}
                    </Link>

                    {/* SKU */}
                    <div className="font-mono text-[10px] text-text-sku mb-0.5">{product.id}</div>

                    {/* Nome */}
                    <Link
                      href={`/catalogo/${categoria}/${product.id}`}
                      className="text-sm font-semibold text-brand-primary leading-tight mb-1 hover:underline decoration-brand-accent underline-offset-2 transition flex-1"
                    >
                      {product.name}
                    </Link>

                    {/* Subtexto */}
                    {subtext && (
                      <div className="text-[10px] text-text-muted mb-3">{subtext}</div>
                    )}

                    {/* CTA */}
                    <AddToCartButton product={product} />

                  </div>
                )
              })}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
              {page > 1 && (
                <Link
                  href={`/catalogo/${categoria}?page=${page - 1}`}
                  className="w-7 h-7 flex items-center justify-center border border-border-subtle rounded bg-white text-sm hover:bg-surface-sunken transition"
                >
                  ‹
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link
                  key={p}
                  href={`/catalogo/${categoria}?page=${p}`}
                  className={`w-7 h-7 flex items-center justify-center rounded text-sm transition ${
                    p === page
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'border border-border-subtle bg-white hover:bg-surface-sunken'
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={`/catalogo/${categoria}?page=${page + 1}`}
                  className="w-7 h-7 flex items-center justify-center border border-border-subtle rounded bg-white text-sm hover:bg-surface-sunken transition"
                >
                  ›
                </Link>
              )}
            </div>
          )}
        </section>
        )}

        {/* ── 4. Tabela material × ambiente ───────────────────────────────── */}
        {isCatalog && category.materialTable?.length > 0 && (
          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-4">
              Material y tratamiento según ambiente
            </h2>
            <div className="bg-white border border-border-subtle rounded-card overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    {['Material', 'Tratamiento', 'Ambiente recomendado', 'Norma'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-text-muted font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {category.materialTable.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-elevated transition">
                      <td className="px-4 py-2.5 text-text-primary font-medium">{row.material}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{row.tratamiento}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{row.ambiente}</td>
                      <td className="px-4 py-2.5 text-text-muted font-mono">{row.norma}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── 5. FAQ ──────────────────────────────────────────────────────── */}
        {isCatalog && category.faq?.length > 0 && (
          <section className="mb-8">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-4">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3 max-w-3xl">
              {category.faq.map(({ q, a }, i) => (
                <div key={i} className="bg-white border border-border-subtle rounded-card px-5 py-4">
                  <div className="text-sm font-semibold text-brand-primary mb-1.5">{q}</div>
                  <div className="text-sm text-text-secondary leading-relaxed">{a}</div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
