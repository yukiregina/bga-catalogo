// Página de subfamília — agrupa peças relacionadas (ex.: "Accesorios de Curva")
// Conteúdo: descrição longa + FAQ + grid das páginas que agrupa.
// Rota compartilhada com a ficha de produto: /catalogo/[categoria]/[produto]

import Link from 'next/link'
import { getProductById, getProductImageAlt } from '@/lib/products'
import config from '@/client.config.js'

export default function SubfamilyView({ subfamilia, category, categoria }) {
  const items = (subfamilia.includedPages ?? [])
    .map(slug => getProductById(slug))
    .filter(Boolean)

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: subfamilia.name,
    description: subfamilia.meta?.description ?? subfamilia.shortDescription ?? '',
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Catálogo', item: '/catalogo/' },
      { '@type': 'ListItem', position: 2, name: category?.name ?? categoria, item: `/catalogo/${categoria}/` },
      { '@type': 'ListItem', position: 3, name: subfamilia.name },
    ],
  }

  return (
    <div className="min-h-screen">

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-[1180px] mx-auto px-6 py-8">

        {/* Breadcrumb */}
        <div className="text-xs text-text-muted mb-4">
          <Link href="/catalogo" className="hover:underline">Catálogo</Link>
          <span className="mx-1">›</span>
          <Link href={`/catalogo/${categoria}`} className="hover:underline">{category?.name ?? categoria}</Link>
          <span className="mx-1">›</span>
          <span className="text-text-primary">{subfamilia.name}</span>
        </div>

        <h1 className="font-brand text-3xl font-bold text-brand-primary mb-3">
          {subfamilia.name}
        </h1>

        {subfamilia.longDescription && (
          <div className="text-sm text-text-secondary leading-relaxed max-w-3xl mb-10 space-y-3">
            {subfamilia.longDescription.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {/* Grid das peças agrupadas */}
        <section className="mb-10">
          <h2 className="font-brand text-base font-bold text-brand-primary mb-4">
            Piezas de esta línea
            <span className="font-primary font-normal text-sm text-text-muted ml-2">
              ({items.length} en total)
            </span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map(product => {
              const variantCount = product.variants?.length ?? 0
              const subtext = variantCount > 0
                ? `${variantCount} variante${variantCount > 1 ? 's' : ''}`
                : product.dimensionAxes?.map(a => a.label).join(' · ') ?? ''

              return (
                <Link
                  key={product.id}
                  href={`/catalogo/${categoria}/${product.id}`}
                  className="bg-white border border-black/8 rounded-card p-3 flex flex-col transition hover:border-brand-accent hover:shadow-sm focus-visible:border-brand-accent focus-visible:shadow-sm"
                >
                  {product.images?.primary ? (
                    <img
                      src={product.images.primary}
                      alt={getProductImageAlt(product)}
                      width={200}
                      height={200}
                      loading="lazy"
                      className="w-full aspect-square object-contain rounded bg-surface-elevated mb-3"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded bg-surface-elevated flex items-center justify-center mb-3">
                      <span className="text-[10px] text-text-muted">sin imagen</span>
                    </div>
                  )}

                  <div className="text-sm font-semibold text-brand-primary leading-tight mb-1 flex-1">
                    {product.name}
                  </div>

                  {subtext && (
                    <div className="text-[10px] text-text-muted">{subtext}</div>
                  )}
                </Link>
              )
            })}
          </div>
        </section>

        {/* FAQ */}
        {subfamilia.faq?.length > 0 && (
          <section className="mb-8">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-4">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3 max-w-3xl">
              {subfamilia.faq.map(({ q, a }, i) => (
                <div key={i} className="bg-white border border-border-subtle rounded-card px-5 py-4">
                  <div className="text-sm font-semibold text-brand-primary mb-1.5">{q}</div>
                  <div className="text-sm text-text-secondary leading-relaxed">{a}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-4">
          <a
            href={`https://wa.me/${config.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, quisiera más información sobre ${subfamilia.name}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-text-primary transition"
          >
            ¿Dudas técnicas? Consultá con un especialista →
          </a>
        </div>

      </div>
    </div>
  )
}
