'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import config from '@/client.config.js'
import { registrarCotizacion } from '@/lib/leads'
import { track } from '@/lib/analytics'
import { getProductImageAlt } from '@/lib/products'

const RUBROS = [
  'Seleccioná un rubro',
  'Obra propia',
  'Instalación eléctrica',
  'Distribución de materiales eléctricos',
  'Otro',
]

export default function CotacaoPage() {
  const { items, removeItem, updateQuantity, updateObservation } = useCart()

  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    proyecto: '',
    plazo: '',
    rubro: '',
  })

  function handleForm(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function buildMessage() {
    const lines = ['Hola, quisiera cotizar:']
    items.forEach(({ product, quantity, observation, title }) => {
      const obs = observation ? ` (${observation})` : ''
      lines.push(`• ${product.composedSKU ?? product.id} — ${title ?? product.name} · ${quantity} un${obs}`)
    })
    lines.push('')
    if (form.nombre)  lines.push(`Cliente: ${form.nombre}${form.empresa ? ` — ${form.empresa}` : ''}`)
    if (form.empresa && !form.nombre) lines.push(`Empresa: ${form.empresa}`)
    if (form.rubro && form.rubro !== 'Seleccioná un rubro') lines.push(`Rubro: ${form.rubro}`)
    if (form.proyecto) lines.push(`Obra: ${form.proyecto}`)
    if (form.plazo)   lines.push(`Plazo: ${form.plazo}`)
    return lines.join('\n')
  }

  function handleSend() {
    // ── 1. Grava primeiro ───────────────────────────────────────────────────
    // Sem await de propósito: `keepalive` garante o envio da requisição, e
    // esperar aqui faria o navegador tratar o window.open abaixo como popup
    // não solicitado e bloquear.
    registrarCotizacion({
      origen: 'catalogo',
      nombre: form.nombre,
      empresa: form.empresa,
      rubro: form.rubro && form.rubro !== RUBROS[0] ? form.rubro : '',
      proyecto: form.proyecto,
      plazo: form.plazo,
      items: items.map(({ product, quantity, observation, title }) => ({
        sku: product.composedSKU ?? product.id,
        nombre: title ?? product.name,
        familia: product.categoryId || '',
        cantidad: quantity,
        observacion: observation || '',
      })),
    })

    track('cotizacion_enviada', {
      items: items.length,
      unidades: items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
      rubro: form.rubro || '(sin rubro)',
    })

    // ── 2. Só depois abre a conversa ────────────────────────────────────────
    const msg = encodeURIComponent(buildMessage())
    const number = config.contact.whatsapp.replace(/\D/g, '')
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank')
  }

  const preview = buildMessage()

  return (
    <div className="min-h-screen">

      <div className="max-w-[1180px] mx-auto px-6 py-8">
        <div className="text-xs text-text-muted mb-4">
          <Link href="/catalogo" className="hover:underline">← Catálogo</Link>
        </div>
        <h1 className="font-brand text-2xl font-bold text-brand-primary mb-1">Tu cotización</h1>
        <p className="text-sm text-text-muted mb-6">
          {items.length > 0
            ? `${items.length} producto${items.length > 1 ? 's' : ''} · revisá los datos antes de enviar.`
            : 'No tenés productos agregados aún.'}
        </p>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-sm mb-4">Tu cotización está vacía.</p>
            <Link
              href="/catalogo"
              className="inline-block bg-brand-accent text-brand-primary text-sm font-semibold px-5 py-2.5 rounded-lg hover:brightness-105 transition"
            >
              Explorar catálogo →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 max-w-5xl">

            {/* ── Lista de produtos ─────────────────────────────────── */}
            <div className="space-y-3">
              {items.map(({ lineId, product, quantity, observation, image, imageAlt, title, configLabel }) => {
                // Linha vinda da ficha (title definido) usa `image` tal como veio, null
                // inclusive (ex.: tapa sem render — nunca cai na foto da peça). Linha sem
                // meta (grade/recomendados/subfamília) cai em images.primary como antes.
                const hasMeta = title !== undefined
                const thumbSrc = hasMeta ? image : (image ?? product.images?.primary)
                return (
                <div
                  key={lineId}
                  className="bg-white border border-border-subtle rounded-card p-3 space-y-2"
                >
                  {/* Linha principal */}
                  <div className="flex gap-3 items-center">
                    {/* Thumb */}
                    <div className="w-14 h-14 bg-surface-elevated rounded flex-shrink-0 flex items-center justify-center">
                      {thumbSrc
                        ? <img src={thumbSrc} alt={imageAlt ?? getProductImageAlt(product)} width={56} height={56} className="w-full h-full object-contain" />
                        : <span className="text-[9px] text-text-muted text-center leading-tight px-1">sin imagen</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] text-text-sku">{product.composedSKU ?? product.id}</div>
                      <div className="text-sm font-semibold text-brand-primary leading-tight mt-0.5">
                        {title ?? product.name}
                      </div>
                      {configLabel ? (
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {configLabel}
                        </div>
                      ) : product.dimensions?.length > 0 && (
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {product.dimensions.map(d => `${d.label}: ${d.value}${d.unit}`).join(' · ')}
                        </div>
                      )}
                    </div>

                    {/* Qty + trash */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center border border-black/20 rounded h-7">
                        <button
                          onClick={() => updateQuantity(lineId, quantity - 1)}
                          className="w-6 text-center text-sm text-text-primary hover:bg-surface-sunken rounded-l transition"
                        >−</button>
                        <span className="w-7 text-center font-mono text-xs">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(lineId, quantity + 1)}
                          className="w-6 text-center text-sm text-text-primary hover:bg-surface-sunken rounded-r transition"
                        >+</button>
                      </div>
                      <button
                        onClick={() => removeItem(lineId)}
                        className="text-text-muted hover:text-red-500 transition p-1"
                        title="Quitar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Observação */}
                  <input
                    type="text"
                    placeholder="Observación (opcional)"
                    value={observation}
                    onChange={e => updateObservation(lineId, e.target.value)}
                    className="w-full h-7 text-[11px] px-2 border border-border-subtle rounded bg-surface-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>
                )
              })}

              <Link
                href="/catalogo"
                className="block text-center text-xs text-text-muted hover:text-brand-primary transition py-2"
              >
                + Agregar más productos
              </Link>
            </div>

            {/* ── Form + Preview ─────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Preview WhatsApp */}
              <div className="bg-white border border-border-subtle rounded-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-brand-primary">Vista previa WhatsApp</span>
                  <span className="text-[10px] text-text-muted font-mono">{config.contact.whatsapp}</span>
                </div>
                <pre className="bg-[#E1F5EE] rounded-lg px-3 py-2.5 text-[10px] leading-relaxed text-[#04342C] font-mono whitespace-pre-wrap break-words">
                  {preview}
                </pre>
              </div>

              {/* Form */}
              <div className="bg-white border border-border-subtle rounded-card p-4 space-y-3">
                <div className="text-sm font-semibold text-brand-primary">Datos del proyecto</div>

                {[
                  { label: 'Nombre / empresa', name: 'nombre', placeholder: 'Mariana Acosta · Acosta Eléctrica' },
                  { label: 'RUC / CNPJ', name: 'empresa', placeholder: '80012345-6', mono: true },
                ].map(field => (
                  <div key={field.name}>
                    <label className="text-[11px] font-semibold text-text-secondary block mb-1">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleForm}
                      placeholder={field.placeholder}
                      className={`w-full h-10 px-3 text-sm bg-surface-elevated border border-border-subtle rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-colors ${field.mono ? 'font-mono' : ''}`}
                    />
                  </div>
                ))}

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Rubro</label>
                  <div className="relative">
                    <select
                      name="rubro"
                      value={form.rubro}
                      onChange={handleForm}
                      className="w-full h-10 pl-3 pr-9 text-sm bg-surface-elevated border border-border-subtle rounded text-text-primary appearance-none focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
                    >
                      {RUBROS.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão */}
              <button
                onClick={handleSend}
                className="w-full h-11 bg-wa text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:brightness-105 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/>
                </svg>
                Enviar cotización por WhatsApp
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
