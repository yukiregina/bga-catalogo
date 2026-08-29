// Página raiz de materiais e tratamentos — não é listagem de produto.
// Resolve a duplicação da materialTable que se repetia em cada família:
// esta é a resposta canônica; cada família mantém só um resumo + link pra cá.

import Link from 'next/link'
import catalogData from '@/lib/catalog.json'
import { getMaterialsPage } from '@/lib/products'
import config from '@/client.config.js'

export function generateMetadata() {
  const page = getMaterialsPage()
  if (!page) return {}

  return {
    title: page.meta?.title ?? page.name,
    description: page.meta?.description,
    alternates: { canonical: '/materiales-y-tratamientos/' },
    openGraph: {
      title: page.meta?.title ?? page.name,
      description: page.meta?.description,
      url: '/materiales-y-tratamientos/',
    },
  }
}

export default function MaterialesYTratamientosPage() {
  const page = getMaterialsPage()
  const gs = catalogData.globalSpecs
  const waNumber = config.contact.whatsapp.replace(/\D/g, '')
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    'Hola, tengo una consulta sobre materiales y tratamientos para mi proyecto.'
  )}`

  if (!page) return null

  const faqSchema = page.faq?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  } : null

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.name,
    description: page.meta?.description ?? '',
    author: { '@type': 'Organization', name: config.brand.name },
  }

  return (
    <div className="min-h-screen">

      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div className="max-w-[1180px] mx-auto px-6 py-8">

        <div className="text-xs text-text-muted mb-4">
          <Link href="/" className="hover:underline">Inicio</Link>
          <span className="mx-1">›</span>
          <span className="text-text-primary">{page.name}</span>
        </div>

        <h1 className="font-brand text-3xl font-bold text-brand-primary mb-3">{page.name}</h1>
        {page.subtitle && (
          <p className="text-sm text-text-secondary mb-8 max-w-3xl leading-relaxed">{page.subtitle}</p>
        )}

        {page.longDescription && (
          <div className="text-sm text-text-secondary leading-relaxed max-w-3xl mb-10 space-y-3">
            {page.longDescription.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
          </div>
        )}

        {/* Materia prima */}
        <section className="mb-10">
          <h2 className="font-brand text-base font-bold text-brand-primary mb-4">Materia prima</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
            {gs.materials.map(m => (
              <div key={m.id} className="bg-white border border-border-subtle rounded-card px-4 py-3">
                <div className="text-sm font-semibold text-brand-primary">{m.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tratamentos superficiais */}
        <section className="mb-10">
          <h2 className="font-brand text-base font-bold text-brand-primary mb-4">Tratamientos superficiales</h2>
          <div className="bg-white border border-border-subtle rounded-card overflow-hidden max-w-3xl">
            <table className="w-full text-xs">
              <thead className="bg-surface-elevated">
                <tr>
                  {['Tratamiento', 'Ambiente de uso', 'Norma'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-text-muted font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {gs.surfaceTreatments.map((t, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-text-primary font-medium">{t.name}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{t.useCase}</td>
                    <td className="px-4 py-2.5 text-text-muted font-mono">{t.norm ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Espesores */}
        <section className="mb-10">
          <h2 className="font-brand text-base font-bold text-brand-primary mb-4">Espesores y tolerancia</h2>
          <div className="flex flex-wrap gap-2 max-w-3xl mb-2">
            {gs.thicknesses.map(t => (
              <span key={t.gauge} className="bg-surface-elevated border border-border-subtle rounded px-2.5 py-1.5 text-xs font-mono">
                {t.gauge} ({t.mm} mm)
              </span>
            ))}
          </div>
          <p className="text-xs text-text-muted">Tolerancia: {gs.thicknessTolerance}</p>
        </section>

        {/* Unión CLINCH */}
        {gs.joiningProcess && (
          <section className="mb-10">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-4">Unión {gs.joiningProcess.name}</h2>
            <p className="text-sm text-text-secondary max-w-3xl leading-relaxed">{gs.joiningProcess.description}</p>
          </section>
        )}

        {/* CTA + link descendente pra produto */}
        <section className="mb-10 bg-white border border-border-subtle rounded-card p-6 max-w-3xl">
          <p className="text-sm font-semibold text-brand-primary mb-1">
            ¿Necesitás cotizar con un material o tratamiento específico?
          </p>
          <p className="text-xs text-text-secondary mb-4">
            Ver la línea de bandejas portacables y elegir material, espesor y tratamiento en la ficha de cada pieza.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/catalogo/bandejas/"
              className="inline-flex items-center gap-2 bg-brand-accent text-brand-primary text-sm font-semibold px-5 py-2.5 rounded-lg hover:brightness-105 transition"
            >
              Ver bandejas portacables →
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-wa text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:brightness-105 transition"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </section>

        {/* FAQ */}
        {page.faq?.length > 0 && (
          <section className="mb-8">
            <h2 className="font-brand text-base font-bold text-brand-primary mb-4">Preguntas frecuentes</h2>
            <div className="space-y-3 max-w-3xl">
              {page.faq.map(({ q, a }, i) => (
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
