'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/components/CartProvider'
import config from '@/client.config.js'
import { track } from '@/lib/analytics'

// ─── SKU composto ────────────────────────────────────────────────────────────

function buildComposedSKU(productId, axes, materialId, gauge, treatmentId) {
  let sku = productId

  const axisVals = Object.values(axes)
  if (axisVals.length > 0) sku += '-' + axisVals.join('x')

  if (materialId) {
    const names = { sae1006: 'SAE1006', aisi304: 'AISI304', alum1100: 'ALUM' }
    sku += ' · ' + (names[materialId] ?? materialId.toUpperCase())
  }
  if (gauge) sku += ' · ' + gauge
  if (treatmentId) {
    const names = { pz: 'PZ', gf: 'GF', elec: 'ELEC', liq: 'LIQ' }
    sku += ' · ' + (names[treatmentId] ?? treatmentId.toUpperCase())
  }
  return sku
}

// ─── Componente interativo ───────────────────────────────────────────────────

// Comparadores de minThicknessRule → símbolo exibido
const OP_SYMBOLS = { '>=': '≥', '<=': '≤', '>': '>', '<': '<', '=': '=' }

export default function ProductSheet({ product, category, globalSpecs, thicknessRules = [] }) {
  const gs = globalSpecs ?? {}
  const hasAxes      = product.dimensionAxes?.length > 0
  const hasMaterials = gs.materials?.length > 0
  const hasGauges    = gs.thicknesses?.length > 0

  const [selectedAxes, setSelectedAxes] = useState(() => {
    const init = {}
    product.dimensionAxes?.forEach(ax => { init[ax.id] = ax.values[0] })
    return init
  })
  const [selectedMaterial,  setSelectedMaterial]  = useState(gs.materials?.[0]?.id ?? null)
  const [selectedGauge,     setSelectedGauge]     = useState(gs.thicknesses?.[1]?.gauge ?? gs.thicknesses?.[0]?.gauge ?? null)
  const [qty,      setQty]      = useState(1)
  const [activeTab, setActiveTab] = useState('specs')
  const [added,    setAdded]    = useState(false)

  const { addItem, updateQuantity } = useCart()

  const composedSKU = buildComposedSKU(product.id, selectedAxes, selectedMaterial, selectedGauge, null)

  const waText = encodeURIComponent(
    `Hola, tengo una consulta técnica sobre ${product.name} (${composedSKU}).`
  )
  const waLink = `https://wa.me/${config.contact.whatsapp.replace(/\D/g, '')}?text=${waText}`

  useEffect(() => {
    track('ver_producto', {
      sku: product.id,
      producto: product.name,
      familia: product.categoryId || '',
    })
  }, [product.id, product.name, product.categoryId])

  function handleAddToCart() {
    addItem({ ...product, composedSKU })
    if (qty > 1) updateQuantity(product.id, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)

    track('agregar_cotizacion', {
      sku: product.id,
      sku_compuesto: composedSKU,
      producto: product.name,
      familia: product.categoryId || '',
      cantidad: qty,
      origen: 'ficha',
    })
  }

  function handleWhatsappDirecto() {
    track('click_whatsapp', {
      sku: product.id,
      producto: product.name,
      familia: product.categoryId || '',
      origen: 'ficha',
    })
  }

  const tabs = [
    { id: 'specs',     label: 'Especificaciones' },
    { id: 'materials', label: 'Materiales y Tratamientos' },
    { id: 'norms',     label: 'Normas' },
  ]

  return (
    <>
      {/* ── Card principal ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-card border border-border-subtle overflow-hidden">

        {/* Grid dois colunas */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">

          {/* Coluna esquerda: imagem */}
          <div className="p-5 border-b md:border-b-0 md:border-r border-border-subtle">
            <div className="bg-surface-elevated rounded-lg aspect-square flex items-center justify-center mb-3">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-lg p-4"
                />
              ) : (
                <div className="text-center px-6">
                  <div className="text-5xl opacity-10 mb-3 select-none">⬡</div>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Imagen disponible<br />próximamente
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i}
                  className={`w-11 h-11 rounded-lg bg-surface-elevated border ${
                    i === 0 ? 'border-text-primary/40' : 'border-border-subtle'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Coluna direita: configurador */}
          <div className="p-5">

            {/* Categoria tag */}
            <div className="inline-block px-2 py-0.5 bg-surface-elevated rounded text-[11px] text-text-muted mb-2">
              {category?.name ?? ''}
            </div>

            {/* Nome */}
            <h1 className="font-brand text-xl font-bold text-brand-primary leading-tight mb-1">
              {product.name}
            </h1>

            {/* SKU + subtitle */}
            <div className="font-mono text-xs text-text-muted mb-3">
              {product.id}{product.subtitle ? ` · ${product.subtitle}` : ''}
            </div>

            {/* Descrição curta */}
            {product.shortDescription && (
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Dimensões fixas (sem axes) */}
            {product.dimensions?.length > 0 && !hasAxes && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.dimensions.map((d, i) => (
                  <span key={i}
                    className="bg-surface-elevated border border-border-subtle rounded px-2.5 py-1.5 text-xs">
                    <span className="text-text-muted">{d.label}: </span>
                    <span className="font-mono">{d.value}{d.unit}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Seletores de eixos */}
            {hasAxes && (
              <div className="space-y-3 mb-4">
                {product.dimensionAxes.map(ax => (
                  <div key={ax.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-text-muted">
                        {ax.label ?? ax.id} · {ax.unit ?? 'mm'}
                      </span>
                      <span className="text-[11px] text-text-muted/60">
                        Seleccionado: {selectedAxes[ax.id]}
                      </span>
                    </div>
                    <div
                      className="grid gap-1"
                      style={{ gridTemplateColumns: `repeat(${Math.min(ax.values.length, 6)}, minmax(0, 1fr))` }}
                    >
                      {ax.values.map(v => {
                        const sel = selectedAxes[ax.id] === v
                        return (
                          <button key={v}
                            onClick={() => setSelectedAxes(prev => ({ ...prev, [ax.id]: v }))}
                            className={`text-center py-1.5 text-[11px] rounded font-mono transition ${
                              sel
                                ? 'bg-text-primary text-white border border-text-primary font-medium'
                                : 'border border-border-subtle text-text-secondary hover:border-text-primary/30'
                            }`}
                          >
                            {v}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Advertencia de espesor mínimo (minThicknessRule do Sheet) */}
            {thicknessRules.length > 0 && (
              <div className="bg-brand-accent/10 border border-brand-accent/50 rounded-lg px-3 py-2.5 mb-4">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary mb-1">
                  <svg viewBox="0 0 256 256" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/></svg>
                  Espesor mínimo recomendado
                </div>
                <ul className="text-[11px] text-text-secondary space-y-0.5">
                  {thicknessRules.map((r, i) => (
                    <li key={i}>
                      Para anchos {OP_SYMBOLS[r.op] ?? r.op}{r.width} mm, espesor mínimo recomendado:{' '}
                      <span className="font-mono font-semibold text-text-primary">{r.gauge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tip de recomendación (recommendationNote do Sheet) */}
            {product.recommendationNote && (
              <div className="bg-surface-elevated border-l-4 border-brand-accent rounded-r-lg px-3 py-2.5 mb-4">
                <div className="text-[11px] font-semibold text-brand-primary mb-0.5">💡 Recomendación</div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {product.recommendationNote}
                </p>
              </div>
            )}

            {/* Material + Espesor */}
            {(hasMaterials || hasGauges) && (
              <div className="flex gap-4 mb-4 flex-wrap">

                {hasMaterials && (
                  <div className="flex-1 min-w-[120px]">
                    <div className="text-xs text-text-muted mb-1.5">Material</div>
                    <div className="flex flex-wrap gap-1">
                      {gs.materials.map(m => {
                        const sel = selectedMaterial === m.id
                        return (
                          <button key={m.id}
                            onClick={() => setSelectedMaterial(m.id)}
                            className="text-[11px] px-2 py-1 rounded transition"
                            style={sel
                              ? { background: '#E1F5EE', color: '#085041', outline: '1px solid #A7DFC9' }
                              : { background: '#F7F7F8', color: '#6E6E7C' }
                            }
                          >
                            {m.name.replace('Acero ', '').replace(' ASTM 1100', '')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {hasGauges && (
                  <div className="flex-1 min-w-[120px]">
                    <div className="text-xs text-text-muted mb-1.5">Espesor</div>
                    <div className="flex flex-wrap gap-1">
                      {gs.thicknesses.map(t => {
                        const sel = selectedGauge === t.gauge
                        return (
                          <button key={t.gauge}
                            onClick={() => setSelectedGauge(t.gauge)}
                            className="text-[11px] px-2 py-1 rounded font-mono transition"
                            style={sel
                              ? { background: '#EEEDFE', color: '#3C3489', outline: '1px solid #C5C3F9' }
                              : { background: '#F7F7F8', color: '#6E6E7C' }
                            }
                          >
                            {t.gauge}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* SKU composto */}
            <div className="bg-surface-elevated rounded-lg px-3 py-2.5 mb-4">
              <div className="text-[10px] text-text-muted mb-0.5">SKU compuesto</div>
              <div className="font-mono text-sm font-medium text-text-primary tracking-tight">
                {composedSKU}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center border border-border-subtle rounded-lg overflow-hidden shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-8 h-11 sm:h-9 flex items-center justify-center text-text-muted hover:bg-surface-elevated transition text-lg leading-none"
                >−</button>
                <span className="flex-1 sm:w-8 text-center font-mono text-sm select-none">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-8 h-11 sm:h-9 flex items-center justify-center text-text-muted hover:bg-surface-elevated transition text-lg leading-none"
                >+</button>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full sm:flex-1 h-11 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:brightness-110 transition"
              >
                {added ? '✓ Agregado' : 'Agregar a cotización'}
              </button>
            </div>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsappDirecto}
              className="flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-xs text-text-secondary hover:text-text-primary hover:underline transition"
            >
              <svg width="14" height="14" viewBox="0 0 256 256" fill="#25D366" aria-hidden="true">
                <path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"/>
              </svg>
              ¿Dudas técnicas? Consultá con un especialista
            </a>

          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-border-subtle">
          <div className="flex px-5 overflow-x-auto gap-0">
            {tabs.map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs py-3 px-4 whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-text-primary font-semibold text-text-primary'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-5 py-4">

          {activeTab === 'specs' && (
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border-subtle">
                <tr>
                  <td className="py-2 pr-4 text-text-muted w-2/5">Familia</td>
                  <td className="py-2 text-text-primary">{category?.name ?? ''}</td>
                </tr>
                {product.dimensions?.map((d, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 text-text-muted capitalize">{d.label}</td>
                    <td className="py-2 font-mono text-text-primary">{d.value} {d.unit}</td>
                  </tr>
                ))}
                {gs.joiningProcess && (
                  <tr>
                    <td className="py-2 pr-4 text-text-muted">Proceso de unión</td>
                    <td className="py-2 text-text-primary">
                      <span className="font-medium">{gs.joiningProcess.name}</span>
                      {' — '}{gs.joiningProcess.description}
                    </td>
                  </tr>
                )}
                {gs.thicknessTolerance && (
                  <tr>
                    <td className="py-2 pr-4 text-text-muted">Tolerancia de espesor</td>
                    <td className="py-2 font-mono text-text-primary">{gs.thicknessTolerance}</td>
                  </tr>
                )}
                {product.features?.map((f, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 text-text-muted">Característica {i + 1}</td>
                    <td className="py-2 text-text-primary">{f}</td>
                  </tr>
                ))}
                {product.note && (
                  <tr>
                    <td className="py-2 pr-4 text-text-muted">Nota</td>
                    <td className="py-2 text-text-secondary">{product.note}</td>
                  </tr>
                )}
                {product.page && (
                  <tr>
                    <td className="py-2 pr-4 text-text-muted">Catálogo impreso</td>
                    <td className="py-2 font-mono text-text-primary">pág. {product.page}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-elevated">
                      <th className="text-left py-2 px-3 text-text-muted font-medium">Tratamiento</th>
                      <th className="text-left py-2 px-3 text-text-muted font-medium">Ambiente de uso</th>
                      <th className="text-left py-2 px-3 text-text-muted font-medium">Norma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {gs.surfaceTreatments?.map((t, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 text-text-primary font-medium">{t.name}</td>
                        <td className="py-2 px-3 text-text-secondary">{t.useCase}</td>
                        <td className="py-2 px-3 font-mono text-text-muted">{t.norm ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {gs.joiningProcess && (
                <div className="bg-surface-elevated rounded-lg px-4 py-3 text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">{gs.joiningProcess.name}: </span>
                  {gs.joiningProcess.description}
                </div>
              )}
            </div>
          )}

          {activeTab === 'norms' && (
            <div className="space-y-2 text-xs text-text-secondary">
              {[
                'IEC 61537 — Cable management systems: Cable tray systems and cable ladder systems',
                'ABNT NBR 6323 — Galvanização por imersão a quente de produtos de aço e ferro fundido',
                'NBR 7008 — Chapa de aço revestida de zinco pelo processo de imersão a quente',
                'ASTM A240 — Stainless Steel Plate, Sheet, and Strip for Pressure Vessels',
                'ASTM B209 — Aluminum and Aluminum-Alloy Sheet and Plate',
              ].map((n, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-text-muted shrink-0">—</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
