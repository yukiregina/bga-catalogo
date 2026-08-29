'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getCategories, getProductsByCategory, getAllProducts, getCategoryById, getCategoryDisplayMode, isCatalogCategory, getProductImageAlt } from '@/lib/products'
import AddToCartButton from '@/components/AddToCartButton'

export default function CatalogPageClient() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const categories = getCategories()

  // Busca só devolve produtos de famílias em modo "catalog" —
  // as demais não têm ficha para onde apontar.
  const results = query
    ? getAllProducts().filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) && isCatalogCategory(p.categoryId)
      )
    : []

  return (
    <>
      {query && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-brand text-base font-bold text-brand-primary">
              Resultados para "{query}"
              <span className="font-primary font-normal text-sm text-text-muted ml-2">
                ({results.length} producto{results.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <Link href="/catalogo" className="text-xs font-semibold text-brand-primary hover:underline">
              Limpiar búsqueda ✕
            </Link>
          </div>

          {results.length === 0 ? (
            <p className="text-text-muted text-sm">
              No encontramos productos con ese término. Probá con otra palabra o navegá por familia abajo.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {results.map(product => {
                const category = getCategoryById(product.categoryId)
                return (
                  <div key={product.id} className="bg-white border border-black/8 rounded-card p-3 flex flex-col">
                    <Link href={`/catalogo/${product.categoryId}/${product.id}`} className="block mb-3">
                      {product.images?.primary ? (
                        <img
                          src={product.images.primary}
                          alt={getProductImageAlt(product)}
                          width={200}
                          height={200}
                          loading="lazy"
                          className="w-full aspect-square object-contain rounded bg-surface-elevated"
                        />
                      ) : (
                        <div className="w-full aspect-square rounded bg-surface-elevated flex items-center justify-center">
                          <span className="text-[10px] text-text-muted">sin imagen</span>
                        </div>
                      )}
                    </Link>
                    <div className="font-mono text-[10px] text-text-sku mb-0.5">{product.id}</div>
                    <Link
                      href={`/catalogo/${product.categoryId}/${product.id}`}
                      className="text-sm font-semibold text-brand-primary leading-tight mb-1 hover:underline decoration-brand-accent underline-offset-2 transition flex-1"
                    >
                      {product.name}
                    </Link>
                    {category && (
                      <div className="text-[10px] text-text-muted mb-3">{category.name}</div>
                    )}
                    <AddToCartButton product={product} />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Grid de famílias — estilo LP */}
      {query && (
        <h2 className="font-brand text-base font-bold text-brand-primary mb-4">
          Explorá por familia
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map(cat => {
          const isCatalog    = getCategoryDisplayMode(cat) === 'catalog'
          const productCount = isCatalog ? getProductsByCategory(cat.id).length : 0

          return (
            <div
              key={cat.id}
              className="bg-white border border-black/8 rounded-card overflow-hidden hover:shadow-md transition group flex flex-col"
            >
              {/* Imagen */}
              <Link href={`/catalogo/${cat.id}`} className="block">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full aspect-[4/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-surface-elevated flex items-center justify-center">
                    <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">{cat.id}</span>
                  </div>
                )}
              </Link>

              {/* Contenido */}
              <div className="p-5 flex flex-col flex-1">
                <Link href={`/catalogo/${cat.id}`} className="block flex-1">
                  <div className="font-brand text-base font-bold text-brand-primary mb-2 group-hover:text-brand-primary transition">
                    {cat.name}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                    {cat.cardDescription ?? cat.description}
                  </p>
                </Link>

                {/* Footer do card */}
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <Link
                    href={`/catalogo/${cat.id}`}
                    className="text-xs font-semibold text-brand-primary"
                  >
                    {productCount > 0
                      ? `${productCount} producto${productCount !== 1 ? 's' : ''} →`
                      : 'Ver familia →'}
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
