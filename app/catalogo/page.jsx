// Página do catálogo — cards estilo LP com imagem, nome, descrição
import Link from 'next/link'
import { getCategories, getProductsByCategory } from '@/lib/products'
import config from '@/client.config.js'

export default function CatalogoPage() {
  const categories = getCategories()

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

        {/* Grid de famílias — estilo LP */}
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
