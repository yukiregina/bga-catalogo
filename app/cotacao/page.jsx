'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import config from '@/client.config.js'
import { registrarCotizacion } from '@/lib/leads'
import { track } from '@/lib/analytics'
import { getProductImageAlt, buildConfigQuery } from '@/lib/products'

const RUBROS = [
  'Seleccioná un rubro',
  'Obra propia',
  'Instalación eléctrica',
  'Distribución de materiales eléctricos',
  'Otro',
]

export default function CotacaoPage() {
  const { items, removeItem, updateQuantity, updateObservation } = useCart()

  // Lido no efeito, nunca na render — sessionStorage não existe no primeiro
  // render do servidor, e ler direto quebraria a hidratação.
  const [lastProduct, setLastProduct] = useState(null)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('bga-last-product')
      if (raw) setLastProduct(JSON.parse(raw))
    } catch {}
  }, [])

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

  // Caminho pra quem já chega com a lista pronta (foto ou Excel) e vai
  // anexar na própria conversa — não passa pelo formulário nem grava lead.
  const listaWaNumber = config.contact.whatsapp.replace(/\D/g, '')
  const listaWaText = encodeURIComponent('Hola, tengo mi lista de materiales — se la envío por acá.')
  const listaWaLink = `https://wa.me/${listaWaNumber}?text=${listaWaText}`

  function handleWhatsappLista() {
    track('click_whatsapp', { origen: 'cotizacion_vacia' })
  }

  return (
    <div className="min-h-screen">

      <div className="max-w-[1180px] mx-auto px-6 py-8">
        <div className="text-xs text-text-muted mb-4">
          {lastProduct ? (
            <Link href={lastProduct.href} className="hover:underline">← Volver a {lastProduct.name}</Link>
          ) : (
            <Link href="/catalogo" className="hover:underline">← Catálogo</Link>
          )}
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

            <p className="text-xs text-text-muted mt-6 mb-1">
              ¿Ya tenés tu lista? Mandanos la foto o el Excel por WhatsApp y te cotizamos.
            </p>
            <a
              href={listaWaLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsappLista}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
            >
              <svg width="14" height="14" viewBox="0 0 509 511.514" fill="currentColor" className="text-wa" aria-hidden="true">
                <path d="M434.762 74.334C387.553 26.81 323.245 0 256.236 0h-.768C115.795.001 2.121 113.696 2.121 253.456l.001.015a253.516 253.516 0 0033.942 126.671L0 511.514l134.373-35.269a253.416 253.416 0 00121.052 30.9h.003.053C395.472 507.145 509 393.616 509 253.626c0-67.225-26.742-131.727-74.252-179.237l.014-.055zM255.555 464.453c-37.753 0-74.861-10.22-107.293-29.479l-7.72-4.602-79.741 20.889 21.207-77.726-4.984-7.975c-21.147-33.606-32.415-72.584-32.415-112.308 0-116.371 94.372-210.743 210.741-210.743 56.011 0 109.758 22.307 149.277 61.98a210.93 210.93 0 0161.744 149.095c0 116.44-94.403 210.869-210.844 210.869h.028zm115.583-157.914c-6.363-3.202-37.474-18.472-43.243-20.593-5.769-2.121-10.01-3.202-14.315 3.203-4.305 6.404-16.373 20.593-20.063 24.855-3.69 4.263-7.401 4.815-13.679 1.612-6.278-3.202-26.786-9.883-50.899-31.472a192.748 192.748 0 01-35.411-43.867c-3.712-6.363-.404-9.777 2.82-12.873 3.224-3.096 6.363-7.381 9.48-11.092a41.58 41.58 0 006.357-10.597 11.678 11.678 0 00-.508-11.09c-1.718-3.18-14.444-34.357-19.534-47.06-5.09-12.703-10.37-10.603-14.272-10.901-3.902-.297-7.911-.19-12.089-.19a23.322 23.322 0 00-16.964 7.911c-5.707 6.298-22.1 21.673-22.1 52.849s22.671 61.249 25.852 65.532c3.182 4.284 44.663 68.227 108.288 95.649 15.099 6.489 26.891 10.392 36.053 13.403a87.504 87.504 0 0025.216 3.718c4.905 0 9.82-.416 14.65-1.237 12.174-1.782 37.453-15.291 42.776-30.073s5.303-27.57 3.711-30.093c-1.591-2.524-5.704-4.369-12.088-7.615l-.038.021z"/>
              </svg>
              Enviar mi lista por WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 max-w-5xl">

            {/* ── Lista de produtos ─────────────────────────────────── */}
            <div className="space-y-3">
              {items.map(({ lineId, product, quantity, observation, image, imageAlt, title, configLabel, config: itemConfig }) => {
                // Linha vinda da ficha (title definido) usa `image` tal como veio, null
                // inclusive (ex.: tapa sem render — nunca cai na foto da peça). Linha sem
                // meta (grade/recomendados/subfamília) cai em images.primary como antes.
                const hasMeta = title !== undefined
                const thumbSrc = hasMeta ? image : (image ?? product.images?.primary)

                const query = itemConfig ? buildConfigQuery(itemConfig) : ''
                const productHref = `/catalogo/${product.categoryId}/${product.id}/${query ? `?${query}` : ''}`

                return (
                <div
                  key={lineId}
                  className="bg-white border border-border-subtle rounded-card p-3 space-y-2"
                >
                  {/* Linha principal */}
                  <div className="flex gap-3 items-center">
                    <Link
                      href={productHref}
                      className="flex gap-3 items-center flex-1 min-w-0 -m-1 p-1 rounded-lg border border-transparent transition hover:border-brand-accent hover:shadow-sm focus-visible:border-brand-accent focus-visible:shadow-sm"
                    >
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
                    </Link>

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
                <svg width="16" height="16" viewBox="0 0 509 511.514" fill="white">
                  <path d="M434.762 74.334C387.553 26.81 323.245 0 256.236 0h-.768C115.795.001 2.121 113.696 2.121 253.456l.001.015a253.516 253.516 0 0033.942 126.671L0 511.514l134.373-35.269a253.416 253.416 0 00121.052 30.9h.003.053C395.472 507.145 509 393.616 509 253.626c0-67.225-26.742-131.727-74.252-179.237l.014-.055zM255.555 464.453c-37.753 0-74.861-10.22-107.293-29.479l-7.72-4.602-79.741 20.889 21.207-77.726-4.984-7.975c-21.147-33.606-32.415-72.584-32.415-112.308 0-116.371 94.372-210.743 210.741-210.743 56.011 0 109.758 22.307 149.277 61.98a210.93 210.93 0 0161.744 149.095c0 116.44-94.403 210.869-210.844 210.869h.028zm115.583-157.914c-6.363-3.202-37.474-18.472-43.243-20.593-5.769-2.121-10.01-3.202-14.315 3.203-4.305 6.404-16.373 20.593-20.063 24.855-3.69 4.263-7.401 4.815-13.679 1.612-6.278-3.202-26.786-9.883-50.899-31.472a192.748 192.748 0 01-35.411-43.867c-3.712-6.363-.404-9.777 2.82-12.873 3.224-3.096 6.363-7.381 9.48-11.092a41.58 41.58 0 006.357-10.597 11.678 11.678 0 00-.508-11.09c-1.718-3.18-14.444-34.357-19.534-47.06-5.09-12.703-10.37-10.603-14.272-10.901-3.902-.297-7.911-.19-12.089-.19a23.322 23.322 0 00-16.964 7.911c-5.707 6.298-22.1 21.673-22.1 52.849s22.671 61.249 25.852 65.532c3.182 4.284 44.663 68.227 108.288 95.649 15.099 6.489 26.891 10.392 36.053 13.403a87.504 87.504 0 0025.216 3.718c4.905 0 9.82-.416 14.65-1.237 12.174-1.782 37.453-15.291 42.776-30.073s5.303-27.57 3.711-30.093c-1.591-2.524-5.704-4.369-12.088-7.615l-.038.021z"/>
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
