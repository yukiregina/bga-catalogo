// Página do catálogo — cards estilo LP com imagem, nome, descrição
// Também atende buscas vindas do Product Finder da home (/catalogo?q=...).
import { Suspense } from 'react'
import config from '@/client.config.js'
import CatalogPageClient from '@/components/CatalogPageClient'
import { getCategoryCards } from '@/lib/products'

export const metadata = {
  title: config.catalog.title,
  description: 'Línea completa para canalización eléctrica industrial y tableros: bandejas portacables, perfilados, escaleras, cajas y gabinetes. Fabricados en Paraguay.',
  alternates: { canonical: '/catalogo/' },
}

export default function CatalogoPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1180px] mx-auto px-6 py-8">
        <h1 className="font-brand text-2xl font-bold text-brand-primary mb-2">
          {config.catalog.title}
        </h1>
        <p className="text-sm text-text-secondary mb-1">
          Armá tu lista de productos y pedí cotización — te respondemos por WhatsApp.
        </p>
        <p className="text-sm text-text-muted mb-8">
          Línea completa para canalización eléctrica industrial y tableros.
        </p>

        <Suspense fallback={null}>
          <CatalogPageClient categories={getCategoryCards()} />
        </Suspense>

      </div>
    </div>
  )
}
