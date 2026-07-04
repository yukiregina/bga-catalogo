// Página do catálogo — cards estilo LP com imagem, nome, descrição
// Também atende buscas vindas do Product Finder da home (/catalogo?q=...).
import Link from 'next/link'
import { getCategories, getProductsByCategory, getAllProducts, getCategoryById } from '@/lib/products'
import config from '@/client.config.js'
import AddToCartButton from '@/components/AddToCartButton'

export default function CatalogoPage({ searchParams }) {
  const categories = getCategories()
  const query = searchParams?.q?.trim() ?? ''

  const results = query
    ? getAllProducts().filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <div className="min-h-screen">

      {/* Nav */}
      <nav className="bg-brand-primary px-8 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="font-brand text-base font-bold text-white tracking-wide">
          {config.brand.name}
        </Link>
        <Link
          href="/cotacao"
          className="bg-brand-accent text-brand-primary text-xs font-semibold px-3 py-1.5 rounded-full"
        >
          {config.catalog.ctaText}
        </Link>
      </nav>

      <div className="p-8 max-w-6xl">
        <h1 className="font-brand text-2xl font-bold text-brand-primary mb-2">
          {config.catalog.title}
        </h1>
        <p className="text-sm text-text-muted mb-8">
          Línea completa para canalización eléctrica industrial y tableros.
        </p>

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
            const productCount = getProductsByCategory(cat.id).length

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

      </div>
    </div>
  )
}
