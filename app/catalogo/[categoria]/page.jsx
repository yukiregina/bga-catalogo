// Página de família — o layout depende de category.displayMode:
//   "catalog" → 1. H1  2. Chips de intenção  3. Grid produtos (busca + grid)
//               4. Texto rico ("Sobre la línea")  5. Tabela material  6. FAQ + Schema
//   "pdf"     → intro curta + botão "Descargar PDF" (category.pdfUrl)
//   "contact" → intro curta + bloco de contato (WhatsApp + email)
//
// Produto na primeira dobra: o texto rico desce pra depois do grid — só os
// chips (não os cards inteiros) ficam acima, pra não empurrar o grid pra
// baixo dos ~810px de antes.

import Link from 'next/link'
import { getCategories, getProductsByCategory, getCategoryById, getCategoryDisplayMode } from '@/lib/products'
import config from '@/client.config.js'
import { notFound } from 'next/navigation'
import TrackView from '@/components/TrackView'
import CategoryProductsGrid from '@/components/CategoryProductsGrid'
import WhatsappIcon from '@/components/WhatsappIcon'

export function generateStaticParams() {
  return getCategories().map(cat => ({ categoria: cat.id }))
}

export function generateMetadata({ params }) {
  const category = getCategoryById(params.categoria)
  if (!category) return {}

  return {
    title: category.name,
    description: category.cardDescription ?? category.description,
    alternates: { canonical: `/catalogo/${category.id}/` },
    openGraph: {
      title: category.name,
      description: category.cardDescription ?? category.description,
      url: `/catalogo/${category.id}/`,
    },
  }
}

export default function CategoriaPage({ params }) {
  const { categoria } = params

  const category = getCategoryById(categoria)
  if (!category) notFound()

  const displayMode = getCategoryDisplayMode(category)
  const isCatalog   = displayMode === 'catalog'

  const products = isCatalog ? getProductsByCategory(categoria) : []

  // Chips "Ir directo a:" — só os intentCards que apontam pra dentro do
  // catálogo (subfamílias). O de galvanizado aponta pra /materiales-y-tratamientos/
  // e fica de fora: não é uma seção desta grid.
  const intentChips = isCatalog
    ? (category.intentCards ?? []).filter(card => card.href.startsWith('/catalogo/'))
    : []

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

      <TrackView
        event="ver_familia"
        params={{ familia: category.id, nombre: category.name, modo: displayMode }}
      />

      {/* Schema FAQ */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="max-w-[1180px] mx-auto px-6 py-8">

        {/* ── 1. Breadcrumb + H1 ──────────────────────────────────────────── */}
        <div className="text-xs text-text-muted mb-4">
          <Link href="/catalogo" className="hover:underline">Catálogo</Link>
          <span className="mx-1">›</span>
          <span className="text-text-primary">{category.name}</span>
        </div>

        <h1 className="font-brand text-3xl font-bold text-brand-primary mb-3">
          {category.name}
        </h1>

        {isCatalog && (
          <p className="text-sm text-text-secondary mb-3">
            Armá tu lista de productos y pedí cotización — te respondemos por WhatsApp.
          </p>
        )}

        {!isCatalog && (
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
                  <WhatsappIcon size={14} />
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

        {/* ── 2. Chips de intenção ─────────────────────────────────────────── */}
        {isCatalog && intentChips.length > 0 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto flex-nowrap md:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-xs text-text-muted shrink-0">Ir directo a:</span>
            {intentChips.map((card, i) => (
              <Link
                key={i}
                href={card.href}
                className="border border-border-subtle rounded-full px-3 py-1.5 text-xs font-semibold text-brand-primary bg-white hover:border-brand-primary/30 transition whitespace-nowrap"
              >
                {card.tag}
              </Link>
            ))}
          </div>
        )}

        {/* ── 3. Grid de produtos ─────────────────────────────────────────── */}
        {isCatalog && (
          <CategoryProductsGrid
            products={products}
            categoryId={categoria}
            categoryName={category.name}
          />
        )}

        {/* ── 4. Texto rico — "Sobre la línea" ────────────────────────────── */}
        {isCatalog && category.richDescription && (
          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-4">
              Sobre la línea {category.name}
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed max-w-3xl space-y-3">
              {category.richDescription.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Tabela material × ambiente ───────────────────────────────── */}
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
            <Link
              href="/materiales-y-tratamientos/"
              className="inline-block mt-3 text-xs font-semibold text-brand-primary hover:underline"
            >
              Ver materiales y tratamientos en detalle →
            </Link>
          </section>
        )}

        {/* ── 6. FAQ ──────────────────────────────────────────────────────── */}
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
