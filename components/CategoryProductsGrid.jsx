'use client'

// Grid de produtos da página de família + busca local. Client component
// porque o estado da busca é local (useState) — não usar useSearchParams
// aqui: quebra o build com output 'export' fora de fronteira de Suspense.

import { useState } from 'react'
import Link from 'next/link'
import { getProductImageAlt } from '@/lib/products'
import { searchProducts } from '@/lib/search'

export default function CategoryProductsGrid({ products, categoryId, categoryName }) {
  const [q, setQ] = useState('')
  const query = q.trim()

  // Sem query: grid completo, com os dados cheios que a página já buscou
  // (variantes, dimensões). Com query: resultado enxuto do índice de busca,
  // filtrado só nesta família.
  const results = query ? searchProducts(query, { categoryId }) : null
  const list = results ?? products

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-brand text-base font-bold text-brand-primary">
          Productos
          <span className="font-primary font-normal text-sm text-text-muted ml-2">
            ({list.length} en total)
          </span>
        </h2>
      </div>

      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={`Buscar en ${categoryName} — nombre o código`}
        className="w-full max-w-sm h-10 px-3 mb-4 text-sm bg-surface-elevated border border-border-subtle rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-colors"
      />

      {list.length === 0 ? (
        query ? (
          <p className="text-text-muted text-sm">
            No encontramos nada en {categoryName}.{' '}
            <Link href={`/catalogo?q=${encodeURIComponent(query)}`} className="font-semibold text-brand-primary hover:underline">
              Buscar en todo el catálogo
            </Link>
          </p>
        ) : (
          <p className="text-text-muted text-sm">
            Productos disponibles en breve. Contactanos para más información.
          </p>
        )
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {query
            ? list.map(product => (
                <Link
                  key={product.id}
                  href={`/catalogo/${product.categoryId}/${product.id}`}
                  className="bg-white border border-black/8 rounded-card p-3 flex flex-col transition hover:border-brand-accent hover:shadow-sm focus-visible:border-brand-accent focus-visible:shadow-sm"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={`${product.name} — BGA Electric`}
                      width={300}
                      height={300}
                      loading="lazy"
                      className="w-full aspect-square object-contain rounded bg-surface-elevated mb-3"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded bg-surface-elevated flex items-center justify-center mb-3">
                      <span className="text-[10px] text-text-muted">sin imagen</span>
                    </div>
                  )}
                  <div className="font-mono text-[10px] text-text-sku mb-0.5">{product.id}</div>
                  <div className="text-sm font-semibold text-brand-primary leading-tight mb-1 flex-1">
                    {product.name}
                  </div>
                </Link>
              ))
            : list.map(product => {
                const variantCount = product.variants?.length ?? 0
                const subtext = variantCount > 0
                  ? `${variantCount} variante${variantCount > 1 ? 's' : ''}`
                  : product.dimensions?.map(d => `${d.value}${d.unit}`).join(' · ') ?? ''

                return (
                  <Link
                    key={product.id}
                    href={`/catalogo/${categoryId}/${product.id}`}
                    className="bg-white border border-black/8 rounded-card p-3 flex flex-col transition hover:border-brand-accent hover:shadow-sm focus-visible:border-brand-accent focus-visible:shadow-sm"
                  >
                    {/* Imagem */}
                    {product.images?.primary ? (
                      <img
                        src={product.images.primary}
                        alt={getProductImageAlt(product)}
                        width={300}
                        height={300}
                        loading="lazy"
                        className="w-full aspect-square object-contain rounded bg-surface-elevated mb-3"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded bg-surface-elevated flex items-center justify-center mb-3">
                        <span className="text-[10px] text-text-muted">sin imagen</span>
                      </div>
                    )}

                    {/* SKU */}
                    <div className="font-mono text-[10px] text-text-sku mb-0.5">{product.id}</div>

                    {/* Nome */}
                    <div className="text-sm font-semibold text-brand-primary leading-tight mb-1 flex-1">
                      {product.name}
                    </div>

                    {/* Subtexto */}
                    {subtext && (
                      <div className="text-[10px] text-text-muted">{subtext}</div>
                    )}
                  </Link>
                )
              })}
        </div>
      )}
    </section>
  )
}
