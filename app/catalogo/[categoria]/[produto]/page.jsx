export const dynamic = 'force-dynamic'

// Ficha técnica do produto — server component
// Busca dados e passa para ProductSheet (client component interativo)
// Ex: /catalogo/bandejas/CT3011

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductById, getCategoryById } from '@/lib/products'
import catalogData from '@/lib/catalog.json'
import config from '@/client.config.js'
import CartBadge from '@/components/CartBadge'
import NavLogo from '@/components/NavLogo'
import ProductSheet from './ProductSheet'

export default function ProdutoPage({ params }) {
  const { categoria, produto } = params
  const product  = getProductById(produto)
  const category = getCategoryById(categoria)

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-page">

      {/* Nav */}
      <nav className="bg-brand-primary px-6 py-3 grid grid-cols-3 items-center sticky top-0 z-10">
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

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <div className="text-xs text-text-muted mb-4 flex items-center gap-1 flex-wrap">
          <Link href="/catalogo" className="hover:text-text-primary transition">Catálogo</Link>
          <span>›</span>
          <Link href={`/catalogo/${categoria}`} className="hover:text-text-primary transition">
            {category?.name ?? categoria}
          </Link>
          <span>›</span>
          <span className="text-text-primary">{product.name}</span>
        </div>

        {/* Componente interativo com toda a lógica de estado */}
        <ProductSheet
          product={product}
          category={category}
          globalSpecs={catalogData.globalSpecs}
        />

        {/* Voltar */}
        <div className="mt-4">
          <Link
            href={`/catalogo/${categoria}`}
            className="text-xs text-text-muted hover:text-text-primary transition"
          >
            ← Volver a {category?.name ?? categoria}
          </Link>
        </div>

      </div>
    </div>
  )
}
