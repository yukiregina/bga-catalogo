// Ficha técnica do produto — server component
// Busca dados e passa para ProductSheet (client component interativo)
// Ex: /catalogo/bandejas/CT3011

import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCategories,
  getProductsByCategory,
  getSubfamiliesByCategory,
  getProductById,
  getCategoryById,
  getCategoryDisplayMode,
  isCatalogCategory,
  resolveRecommendedProducts,
  parseMinThicknessRule,
} from '@/lib/products'
import catalogData from '@/lib/catalog.json'
import config from '@/client.config.js'
import ProductSheet from './ProductSheet'
import SubfamilyView from './SubfamilyView'

export function generateStaticParams() {
  return getCategories()
    .filter(cat => getCategoryDisplayMode(cat) === 'catalog')
    .flatMap(cat => [
      ...getProductsByCategory(cat.id),
      ...getSubfamiliesByCategory(cat.id),
    ].map(item => ({
      categoria: cat.id,
      produto: item.id,
    })))
}

export function generateMetadata({ params }) {
  const item     = getProductById(params.produto)
  const category = getCategoryById(params.categoria)
  if (!item || !category) return {}

  const title = item.meta?.title ?? `${item.name} (${item.id})`
  const description = item.meta?.description
    ?? `${item.name} — ${category.name}. Cotizá por WhatsApp o agregá al carrito de cotización. Fabricado en Paraguay por ${config.brand.name}.`

  return {
    title,
    description,
    alternates: { canonical: `/catalogo/${category.id}/${item.id}/` },
    openGraph: {
      title,
      description,
      url: `/catalogo/${category.id}/${item.id}/`,
      ...(item.images?.primary ? { images: [item.images.primary] } : {}),
    },
  }
}

export default function ProdutoPage({ params }) {
  const { categoria, produto } = params
  const item     = getProductById(produto)
  const category = getCategoryById(categoria)

  // Fichas só existem para famílias em modo "catalog" — famílias "pdf"/"contact"
  // não expõem rotas de produto.
  if (!item) notFound()
  if (getCategoryDisplayMode(category) !== 'catalog') notFound()
  if (!isCatalogCategory(item.categoryId)) notFound()

  if (item.type === 'subfamilia') {
    return <SubfamilyView subfamilia={item} category={category} categoria={categoria} />
  }

  const product = item

  // Camada de recomendação (campos opcionais vindos do Sheet)
  const recommendedProducts = resolveRecommendedProducts(product.recommended)
    .filter(p => isCatalogCategory(p.categoryId))
  const thicknessRules = parseMinThicknessRule(product.minThicknessRule)

  const faqSchema = product.faq?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: product.faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  } : null

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.meta?.description ?? '',
    ...(product.images?.primary ? { image: `https://bga.com.py${product.images.primary}` } : {}),
    brand: { '@type': 'Brand', name: config.brand.name },
    manufacturer: { '@type': 'Organization', name: config.brand.name },
  }

  return (
    <div className="min-h-screen bg-page">

      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />

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
          thicknessRules={thicknessRules}
          recommended={recommendedProducts}
        />

        {/* Descrição longa */}
        {product.longDescription && (
          <div className="mt-6 text-sm text-text-secondary leading-relaxed space-y-3 max-w-3xl">
            {product.longDescription.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {/* FAQ */}
        {product.faq?.length > 0 && (
          <section className="mt-8">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-4">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {product.faq.map(({ q, a }, i) => (
                <div key={i} className="bg-white border border-border-subtle rounded-card px-5 py-4">
                  <div className="text-sm font-semibold text-brand-primary mb-1.5">{q}</div>
                  <div className="text-sm text-text-secondary leading-relaxed">{a}</div>
                </div>
              ))}
            </div>
          </section>
        )}

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
