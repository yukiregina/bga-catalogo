'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import config from '@/client.config.js'
import { track } from '@/lib/analytics'
import {
  getProductImageAlt,
  buildComposedSKU,
  normalizeVariant,
  buildLineTitle,
  buildConfigLabel,
  buildConfigQuery,
} from '@/lib/products'
import RecommendedProducts from '@/components/RecommendedProducts'

// ─── Componente interativo ───────────────────────────────────────────────────

// Comparadores de minThicknessRule → símbolo exibido
const OP_SYMBOLS = { '>=': '≥', '<=': '≤', '>': '>', '<': '<', '=': '=' }

export default function ProductSheet({ product, category, globalSpecs, thicknessRules = [], recommended = [] }) {
  const gs = globalSpecs ?? {}
  const variants = (product.variants ?? []).map(normalizeVariant)
  const hasVariants  = variants.length > 0
  const [selectedVariant, setSelectedVariant] = useState(null)
  const isTapa = selectedVariant?.role === 'tapa'
  const tapaImageMissing = isTapa && !product.images?.tapa

  // A tapa não tem "ala" própria — segue só o ancho da bandeja que cobre.
  const axesToShow   = product.dimensionAxes?.filter(ax => !(isTapa && ax.id === 'ala')) ?? []
  const hasAxes      = axesToShow.length > 0
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
  const [galleryTab, setGalleryTab] = useState('primary') // 'primary' | 'tapa'

  // A primeira escrita na URL precisa esperar a leitura (mesmo commit,
  // efeito anterior) terminar de aplicar seus setState — senão ela usa o
  // estado default (do render anterior à leitura) e sobrescreve os
  // parâmetros que acabaram de chegar. Adia pro próximo tick e lê o valor
  // mais recente por uma ref, não pelo closure: por aí, não importa quantos
  // renders a leitura disparar (zero ou vários), o valor já assentou.
  const skipInitialWrite = useRef(true)

  // kit-de-uniones: a imagem carrega a tornillería do ala escolhido — troca
  // sozinha, sem clique. As demais páginas seguem a galeria peça/tapa normal.
  const kitAla = product.images?.byAla ? String(selectedAxes.ala ?? '') : null
  const mainImageSrc = kitAla
    ? (product.images.byAla[kitAla] ?? product.images.primary)
    : tapaImageMissing
      ? null // tapa sem render: vazio, nunca a foto da peça — é a troca que comunica a variante
      : (galleryTab === 'tapa' && product.images?.tapa ? product.images.tapa : product.images?.primary)
  const mainImageAlt = kitAla
    ? getProductImageAlt(product, { ala: kitAla })
    : getProductImageAlt(product, galleryTab === 'tapa' && product.images?.tapa ? 'tapa' : 'primary')

  const { addItem, items } = useCart()

  // Base do SKU: variante escolhida > SKU único da página > id da página.
  // Com variantes disponíveis e nenhuma escolhida, o pedido sai sem punir
  // quem não sabe — o vendedor confirma o modelo/tipo depois.
  const baseSku = selectedVariant?.sku ?? product.sku ?? product.id
  const axesForSku = Object.fromEntries(
    axesToShow.map(ax => [ax.id, selectedAxes[ax.id]])
  )
  const composedSKU = buildComposedSKU(baseSku, axesForSku, selectedMaterial, selectedGauge, null)
    + (hasVariants && !selectedVariant ? ' (variante a confirmar)' : '')

  // O botão reflete o carrinho, não um estado próprio: a configuração atual
  // já está lá se essa linha (mesmo lineId = composedSKU) existir.
  const cartLine = items.find(i => i.lineId === composedSKU)

  const lineTitle = buildLineTitle(product, selectedVariant)
  const configLabel = buildConfigLabel({
    variant: selectedVariant,
    axes: axesToShow.map(ax => ({ label: ax.label, unit: ax.unit, value: selectedAxes[ax.id] })),
    material: selectedMaterial,
    gauge: selectedGauge,
    globalSpecs: gs,
  })

  // Configuração crua (sem o sufixo do composedSKU) — vira query da URL e vai
  // pro carrinho, pra a linha saber pra onde linkar de volta.
  const currentConfig = {
    variante: selectedVariant?.sku,
    axes: axesForSku,
    material: selectedMaterial,
    espesor: selectedGauge,
  }
  const configQuery = buildConfigQuery(currentConfig)
  const configQueryRef = useRef(configQuery)
  configQueryRef.current = configQuery

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

  // Lê a configuração da URL uma vez, no mount — não usar useSearchParams:
  // com output 'export' ele exige fronteira de Suspense e quebra o build.
  // Nunca confiar no valor cru: cada parâmetro só aplica se bater com um
  // valor real do produto; se não bater, mantém o default atual.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const varianteSku = params.get('variante')
    if (varianteSku) {
      const v = variants.find(v => v.sku === varianteSku)
      if (v) {
        setSelectedVariant(v)
        setGalleryTab(v.role === 'tapa' ? 'tapa' : 'primary')
      }
    }

    const materialId = params.get('material')
    if (materialId && gs.materials?.some(m => m.id === materialId)) {
      setSelectedMaterial(materialId)
    }

    const gauge = params.get('espesor')
    if (gauge && gs.thicknesses?.some(t => t.gauge === gauge)) {
      setSelectedGauge(gauge)
    }

    product.dimensionAxes?.forEach(ax => {
      const raw = params.get(ax.id)
      if (raw == null) return
      const match = ax.values.find(v => String(v) === raw)
      if (match !== undefined) {
        setSelectedAxes(prev => ({ ...prev, [ax.id]: match }))
      }
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escreve a configuração na URL a cada mudança — replaceState, não
  // router.push: é a mesma página, não uma navegação nova no histórico.
  useEffect(() => {
    if (skipInitialWrite.current) {
      skipInitialWrite.current = false
      // Adia pro próximo tick: dá tempo do efeito de leitura (que roda antes,
      // no mesmo commit) assentar seus setState e o React re-renderizar —
      // lê pela ref porque o closure daqui é o do primeiro render (default).
      const id = setTimeout(() => {
        const q = configQueryRef.current
        const url = q ? `${window.location.pathname}?${q}` : window.location.pathname
        window.history.replaceState(null, '', url)
      }, 0)
      return () => clearTimeout(id)
    }
    const url = configQuery ? `${window.location.pathname}?${configQuery}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [configQuery])

  // Última ficha visitada — a /cotacao usa isso pro breadcrumb "← Volver a…".
  useEffect(() => {
    try {
      const href = `/catalogo/${product.categoryId}/${product.id}/${window.location.search}`
      sessionStorage.setItem('bga-last-product', JSON.stringify({ href, name: product.name }))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAddToCart() {
    addItem({ ...product, composedSKU }, qty, {
      image: mainImageSrc,
      imageAlt: mainImageAlt,
      title: lineTitle,
      configLabel,
      config: currentConfig,
    })

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
              {mainImageSrc ? (
                <img
                  src={mainImageSrc}
                  alt={mainImageAlt}
                  width={420}
                  height={420}
                  className="w-full h-full object-contain rounded-lg p-4"
                />
              ) : (
                <div className="text-center px-6">
                  <div className="text-5xl opacity-10 mb-3 select-none">⬡</div>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    {tapaImageMissing
                      ? <>Tapa — imagen<br />en preparación</>
                      : <>Imagen disponible<br />próximamente</>}
                  </p>
                </div>
              )}
            </div>

            {/* Galería peza/tapa — a tapa se cotiza aparte, dos piezas distintas */}
            {product.images?.tapa && (
              <div className="flex gap-2">
                {[
                  { id: 'primary', label: 'Pieza', src: product.images.primary },
                  { id: 'tapa',    label: 'Tapa',  src: product.images.tapa },
                ].map(thumb => (
                  <button
                    key={thumb.id}
                    onClick={() => setGalleryTab(thumb.id)}
                    className={`flex-1 rounded-lg border overflow-hidden ${
                      galleryTab === thumb.id ? 'border-text-primary/40' : 'border-border-subtle'
                    }`}
                  >
                    <div className="bg-surface-elevated aspect-square flex items-center justify-center">
                      <img
                        src={thumb.src}
                        alt={getProductImageAlt(product, thumb.id)}
                        width={80}
                        height={80}
                        loading="lazy"
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="text-[10px] text-text-muted py-0.5">{thumb.label}</div>
                  </button>
                ))}
              </div>
            )}
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

            {/* Variante (modelo/tipo ou diámetro) — seleção dentro da ficha, não rota */}
            {hasVariants && (
              <div className="mb-4">
                <label htmlFor="variante" className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-muted">Modelo / variante</span>
                </label>
                <div className="relative">
                  <select
                    id="variante"
                    value={selectedVariant?.sku ?? ''}
                    onChange={e => {
                      const v = variants.find(v => v.sku === e.target.value)
                      setSelectedVariant(v ?? null)
                      setGalleryTab(v?.role === 'tapa' ? 'tapa' : 'primary')
                    }}
                    className="w-full text-sm border border-border-subtle rounded-lg px-3 py-2 bg-white text-text-primary appearance-none pr-9 focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
                  >
                    <option value="">Seleccioná modelo y tipo…</option>
                    {variants.map(v => (
                      <option key={v.sku} value={v.sku}>{v.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Diagrama de apoio: corte transversal tipo U / tipo C (só bandeja-portacables) —
                    legenda do select acima, não um card à parte. */}
                {product.secciones && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { tipo: 'U', src: product.secciones.U, label: 'Tipo U — alas rectas' },
                      { tipo: 'C', src: product.secciones.C, label: 'Tipo C — alas con retorno' },
                    ].filter(s => s.src).map(s => (
                      <div key={s.tipo} className="text-center">
                        <img
                          src={s.src}
                          alt={`Corte transversal Tipo ${s.tipo} — ${product.name} BGA`}
                          width={300}
                          height={100}
                          loading="lazy"
                          className="w-full h-auto"
                        />
                        <span className="text-[10px] text-text-muted">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Seletores de eixos */}
            {hasAxes && (
              <div className="space-y-3 mb-4">
                {axesToShow.map(ax => (
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

            {/* Pieza a medida — la ficha lo dice explícitamente (ver Sheet §Peças configuráveis) */}
            {product.configurable && (
              <div className="bg-brand-accent/10 border border-brand-accent/50 rounded-lg px-3 py-2.5 mb-3 text-[11px] text-text-secondary">
                <span className="font-semibold text-brand-primary">Pieza a medida — </span>
                confirmá el detalle con el vendedor antes de cotizar (ver preguntas frecuentes abajo).
              </div>
            )}

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
                className={`w-full sm:flex-1 h-11 rounded-lg text-sm font-semibold transition ${
                  cartLine
                    ? 'bg-brand-primary text-white hover:brightness-110'
                    : 'bg-brand-accent text-brand-primary hover:brightness-105'
                }`}
              >
                {cartLine ? `✓ En tu cotización (${cartLine.quantity})` : 'Agregar a cotización'}
              </button>

              {product.configurable && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsappDirecto}
                  className="w-full sm:w-auto h-11 px-4 flex items-center justify-center gap-1.5 border border-wa text-wa rounded-lg text-sm font-semibold hover:bg-wa/5 transition shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                    <path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"/>
                  </svg>
                  Consultar con un especialista
                </a>
              )}
            </div>

            {/* Peças complementares (campo `recommended` do Sheet) — só link, sem CTA próprio */}
            <RecommendedProducts products={recommended} />

            {cartLine && (
              <Link
                href="/cotacao"
                className="block text-center sm:text-left text-xs text-text-muted hover:text-brand-primary hover:underline transition mt-2"
              >
                Ver cotización →
              </Link>
            )}

            {!product.configurable && (
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
            )}

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
                {product.unidadVenta && (
                  <tr>
                    <td className="py-2 pr-4 text-text-muted">Unidad de venta</td>
                    <td className="py-2 text-text-primary">{product.unidadVenta}</td>
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
