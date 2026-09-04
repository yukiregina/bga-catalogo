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
} from '@/lib/product-helpers'
import RecommendedProducts from '@/components/RecommendedProducts'
import WhatsappIcon from '@/components/WhatsappIcon'

// ─── Componente interativo ───────────────────────────────────────────────────

// Normaliza a quantidade — inválido ou < 1 vira 1; acima de 9999 vira 9999.
// Mesma regra do CartProvider, pra quem digita valer o mesmo que quem clica.
function clampQty(n) {
  const num = Number(n)
  if (!num || num < 1) return 1
  return Math.min(num, 9999)
}

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
  const [galleryTab, setGalleryTab] = useState('primary') // 'primary' | 'tapa'

  // Material y terminación como eixo único (seção 6) — só entra quando o
  // produto lista `finishes` (array de ids pra globalSpecs.finishes, mesmo
  // padrão do `recommended`). Sem o campo, o produto segue no caminho de
  // tags de Material + Espesor de sempre — os dois caminhos não se
  // unificam, pra não vazar a UI nova pros outros 71 produtos.
  const hasFinishes = product.finishes?.length > 0 && gs.finishes?.length > 0
  const resolvedFinishes = hasFinishes
    ? product.finishes.map(id => gs.finishes.find(f => f.id === id)).filter(Boolean)
    : []
  const [selectedFinish, setSelectedFinish] = useState(null)
  const [selectedColor,  setSelectedColor]  = useState('')
  const activeFinish = hasFinishes ? resolvedFinishes.find(f => f.id === selectedFinish) ?? null : null

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
  // bandeja-portacables: uma miniatura por variante (CT3011…CT3211), não o
  // toggle peça/tapa fixo. Produto sem images.bySku não entra por aqui —
  // os outros 71 continuam no galleryTab de sempre, sem mudar.
  const hasBySku = !!product.images?.bySku
  const mainImageSrc = kitAla
    ? (product.images.byAla[kitAla] ?? product.images.primary)
    : tapaImageMissing
      ? null // tapa sem render: vazio, nunca a foto da peça — é a troca que comunica a variante
      : hasBySku
        ? (product.images.bySku[selectedVariant?.sku] ?? product.images.primary)
        : (galleryTab === 'tapa' && product.images?.tapa ? product.images.tapa : product.images?.primary)
  const mainImageAlt = kitAla
    ? getProductImageAlt(product, { ala: kitAla })
    : hasBySku
      ? getProductImageAlt(product, selectedVariant ? { variantLabel: selectedVariant.label } : 'primary')
      : getProductImageAlt(product, galleryTab === 'tapa' && product.images?.tapa ? 'tapa' : 'primary')

  const { addItem, items } = useCart()

  // Base do SKU: variante escolhida > SKU único da página > id da página.
  // Com variantes disponíveis e nenhuma escolhida, o pedido sai sem punir
  // quem não sabe — o vendedor confirma o modelo/tipo depois.
  const baseSku = selectedVariant?.sku ?? product.sku ?? product.id
  const axesForSku = Object.fromEntries(
    axesToShow.map(ax => [ax.id, selectedAxes[ax.id]])
  )
  // Sem finish escolhido, o pedido sai sem punir (mesmo espírito do
  // baseSku/variante). Com elec e sem cor, falta só o texto do color.
  const finishSuffix = !hasFinishes
    ? ''
    : !selectedFinish
      ? ' (terminación a confirmar)'
      : (activeFinish?.needsColor && !selectedColor.trim())
        ? ' (color a confirmar)'
        : ''

  const composedSKU = buildComposedSKU(
    baseSku,
    axesForSku,
    hasFinishes ? (activeFinish?.material ?? null) : selectedMaterial,
    selectedGauge,
    hasFinishes ? (activeFinish?.treatment ?? null) : null,
    hasFinishes && activeFinish?.needsColor ? selectedColor.trim() : null
  )
    + (hasVariants && !selectedVariant ? ' (variante a confirmar)' : '')
    + finishSuffix

  // O botão reflete o carrinho, não um estado próprio: a configuração atual
  // já está lá se essa linha (mesmo lineId = composedSKU) existir.
  const cartLine = items.find(i => i.lineId === composedSKU)

  const lineTitle = buildLineTitle(product, selectedVariant)
  const configLabel = buildConfigLabel({
    variant: selectedVariant,
    axes: axesToShow.map(ax => ({ label: ax.label, unit: ax.unit, value: selectedAxes[ax.id] })),
    material: hasFinishes ? undefined : selectedMaterial,
    gauge: selectedGauge,
    globalSpecs: gs,
    finish: hasFinishes ? selectedFinish ?? undefined : undefined,
    color: hasFinishes && activeFinish?.needsColor ? (selectedColor.trim() || undefined) : undefined,
  })

  // Configuração crua (sem o sufixo do composedSKU) — vira query da URL e vai
  // pro carrinho, pra a linha saber pra onde linkar de volta.
  const currentConfig = {
    variante: selectedVariant?.sku,
    axes: axesForSku,
    material: hasFinishes ? undefined : selectedMaterial,
    espesor: selectedGauge,
    finish: hasFinishes ? selectedFinish ?? undefined : undefined,
    color: hasFinishes && activeFinish?.needsColor ? (selectedColor.trim() || undefined) : undefined,
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

    // Eixo de terminación (seção 6). `finish` primeiro; na ausência dele,
    // cai no `material` antigo — carrinhos gravados antes desta mudança têm
    // só esse parâmetro, e sem essa leitura a linha antiga perde o "voltar
    // pra ficha configurada". `material` sozinho não diz qual tratamento:
    // assume pregalvanizado (pz), que era a única opção antes de existir
    // finish — exceto pra inox, onde o material já resolve sozinho.
    if (hasFinishes) {
      const finishId = params.get('finish')
      if (finishId && resolvedFinishes.some(f => f.id === finishId)) {
        setSelectedFinish(finishId)
      } else if (materialId) {
        const legacyMatches = resolvedFinishes.filter(f => f.material === materialId)
        const legacyFinish = legacyMatches.find(f => f.treatment === 'pz') ?? legacyMatches[0]
        if (legacyFinish) setSelectedFinish(legacyFinish.id)
      }

      const colorParam = params.get('color')
      if (colorParam) setSelectedColor(colorParam.slice(0, 40))
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

  // Regra de espesor que vale pro ancho escolhido — troca a lista inteira por
  // uma resposta. Sem ancho selecionado ou nenhuma regra batendo, cai no
  // fallback (a lista completa, como antes).
  const anchoValue = selectedAxes.ancho
  const matchedThicknessRule = anchoValue != null
    ? thicknessRules.find(r => {
        const w = Number(anchoValue)
        switch (r.op) {
          case '>=': return w >= r.width
          case '<=': return w <= r.width
          case '>':  return w > r.width
          case '<':  return w < r.width
          case '=':  return w === r.width
          default:   return false
        }
      })
    : undefined

  // A nota fala especificamente do limiar de 500mm (primeira regra) — abaixo
  // disso não se aplica.
  const showRecommendationNote = anchoValue != null
    && thicknessRules[0] != null
    && Number(anchoValue) >= thicknessRules[0].width

  // Compara em milímetro, não em número de bitola — #12 é mais grosso que
  // #14, então comparar a string do rótulo inverteria o sentido. Só entra em
  // âmbar (seção 6) quando a pessoa já escolheu uma bitola mais fina que o
  // mínimo do ancho atual — hoje a caixa só informava, nunca comparava.
  const gaugeMm = g => gs.thicknesses?.find(t => t.gauge === g)?.mm
  const belowMinimumGauge = hasFinishes && matchedThicknessRule && selectedGauge
    ? gaugeMm(selectedGauge) < gaugeMm(matchedThicknessRule.gauge)
    : false

  return (
    <>
      {/* ── Card principal ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-card border border-border-subtle overflow-hidden">

        {/* Grid dois colunas */}
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">

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

            {/* Galería de variantes (bandeja-portacables) — uma miniatura por SKU do
                mapa images.bySku, na ordem de `variants`. Clicar seleciona a variante
                no configurador, não só troca a imagem: é o mesmo estado do select
                "Modelo / variante" abaixo, nos dois sentidos. */}
            {hasBySku ? (
              <div className="flex gap-1.5">
                {variants.filter(v => product.images.bySku[v.sku]).map(v => {
                  const sel = selectedVariant?.sku === v.sku
                  return (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedVariant(v)}
                      className={`flex-1 rounded-lg border overflow-hidden ${
                        sel ? 'border-text-primary/40' : 'border-border-subtle'
                      }`}
                    >
                      <div className="bg-surface-elevated aspect-square flex items-center justify-center">
                        <img
                          src={product.images.bySku[v.sku]}
                          alt={getProductImageAlt(product, { variantLabel: v.label })}
                          width={80}
                          height={80}
                          loading="lazy"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="text-[10px] text-text-muted py-0.5 leading-tight">{v.label.replace('Tipo ', '')}</div>
                    </button>
                  )
                })}
              </div>
            ) : (
              /* Galería peza/tapa — a tapa se cotiza aparte, dos piezas distintas */
              product.images?.tapa && (
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
              )
            )}

            {/* Diagrama de apoio: corte transversal tipo U / tipo C (só bandeja-portacables) —
                fica perto da imagem, não do select: é o rótulo que desambigua, a imagem ajuda. */}
            {product.secciones && (
              <div className="grid grid-cols-2 gap-3 mt-3">
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

            {/* Subtitle — só a frase, sem o slug do produto (não diz nada pra
                quem compra) nem a shortDescription (repetia esta linha quase
                palavra por palavra). shortDescription continua em
                lib/catalog.json alimentando meta description e busca. */}
            {product.subtitle && (
              <div className="text-xs text-text-muted mb-4">
                {product.subtitle}
              </div>
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
              <div className="no-print mb-4">
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
              </div>
            )}

            {/* Seletores de eixos */}
            {hasAxes && (
              <div className="space-y-3 mb-4">
                {axesToShow.map(ax => {
                  // Linhas equilibradas em vez de "auto-fill" (que sobra um valor
                  // sozinho na última linha): 14 → 7+7, 16 → 8+8, 5 → 5, 1 → 1.
                  const n = ax.values.length
                  const rows = Math.ceil(n / 8)
                  const cols = Math.ceil(n / rows)
                  return (
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
                        className="no-print grid grid-cols-5 md:[grid-template-columns:var(--axis-cols)] gap-1"
                        style={{ '--axis-cols': `repeat(${cols}, minmax(0, 88px))` }}
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
                  )
                })}
              </div>
            )}

            {/* Advertencia de espesor mínimo (minThicknessRule do Sheet) — só faz
                sentido em fichas com eixo ancho e regra batendo; sem ancho (ex.:
                kit-de-uniones, só ala) não há nada certo pra mostrar. Produto com
                finishes (seção 6) não usa esta caixa — a mesma regra vira linha
                embaixo do bloco de Espesor, e passa a comparar com a bitola
                escolhida em vez de só informar. */}
            {!hasFinishes && matchedThicknessRule && (
              <div className="bg-brand-accent/10 border border-brand-accent/50 rounded-lg px-3 py-2.5 mb-4">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary mb-1">
                  <svg viewBox="0 0 256 256" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/></svg>
                  Espesor mínimo recomendado
                </div>
                <p className="text-[11px] text-text-secondary">
                  Ancho {anchoValue} mm → espesor mínimo{' '}
                  <span className="font-mono font-semibold text-text-primary">{matchedThicknessRule.gauge}</span>
                </p>
              </div>
            )}

            {/* Tip de recomendación (recommendationNote do Sheet) — só quando o ancho
                escolhido é o que a nota descreve (hoje, >=500mm). */}
            {product.recommendationNote && showRecommendationNote && (
              <div className="bg-surface-elevated border-l-4 border-brand-accent rounded-r-lg px-3 py-2.5 mb-4">
                <div className="text-[11px] font-semibold text-brand-primary mb-0.5">💡 Recomendación</div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {product.recommendationNote}
                </p>
              </div>
            )}

            {/* Espesor + Material y terminación (seção 6) — só produto com
                `product.finishes`. Os outros 71 seguem no bloco de tags
                Material + Espesor logo abaixo, sem nenhuma mudança; os dois
                caminhos não se unificam de propósito. */}
            {hasFinishes ? (
              <>
                {hasGauges && (
                  <div className="no-print mb-4">
                    <div className="text-[12px] font-semibold text-text-muted uppercase tracking-[.05em] mb-1.5">
                      Espesor
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gs.thicknesses.map(t => {
                        const sel = selectedGauge === t.gauge
                        return (
                          <button key={t.gauge}
                            onClick={() => setSelectedGauge(t.gauge)}
                            className={`w-[62px] h-[62px] flex flex-col items-center justify-center gap-0.5 rounded font-mono text-[13.5px] transition ${
                              sel
                                ? 'bg-text-primary text-white border border-text-primary font-medium'
                                : 'border border-border-subtle text-text-secondary hover:border-text-primary/30'
                            }`}
                          >
                            <span>{t.gauge}</span>
                            <span className={`text-[10px] ${sel ? 'opacity-80' : 'opacity-60'}`}>
                              {String(t.mm).replace('.', ',')} mm
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {matchedThicknessRule && (
                      <p className={`text-[11px] mt-1.5 ${belowMinimumGauge ? 'font-semibold' : 'text-text-muted'}`}
                        style={belowMinimumGauge ? { color: '#92620B' } : undefined}
                      >
                        Espesor mínimo recomendado:{' '}
                        <span className="font-mono font-semibold">{matchedThicknessRule.gauge}</span>
                        {belowMinimumGauge ? ' — la bitola elegida está por debajo del mínimo' : ''}
                      </p>
                    )}
                  </div>
                )}

                <div className="no-print mb-4">
                  <div className="text-[12px] font-semibold text-text-muted uppercase tracking-[.05em] mb-1.5">
                    Material y terminación
                  </div>
                  <div className="space-y-1">
                    {resolvedFinishes.map(f => {
                      const sel = selectedFinish === f.id
                      return (
                        <button key={f.id}
                          onClick={() => setSelectedFinish(f.id)}
                          className={`w-full flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-left px-[11px] py-2 rounded-lg border transition ${
                            sel ? '' : 'border-border-subtle bg-white hover:border-text-primary/30'
                          }`}
                          style={sel ? { background: '#E1F5EE', borderColor: '#A7DFC9' } : undefined}
                        >
                          <span
                            className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                            style={{ borderColor: sel ? '#085041' : '#C7C7CC' }}
                            aria-hidden="true"
                          >
                            {sel && <span className="w-2 h-2 rounded-full" style={{ background: '#085041' }} />}
                          </span>
                          <span className="text-[13px] font-semibold"
                            style={sel ? { color: '#085041' } : undefined}
                          >
                            {f.label}
                          </span>
                          <span className="text-[10.5px] text-text-muted ml-auto">{f.ambiente}</span>
                        </button>
                      )
                    })}
                  </div>

                  {activeFinish?.needsColor && (
                    <div className="mt-3">
                      <label htmlFor="color" className="block text-xs text-text-muted mb-1.5">¿Qué color?</label>
                      <input
                        id="color"
                        type="text"
                        maxLength={40}
                        value={selectedColor}
                        onChange={e => setSelectedColor(e.target.value)}
                        placeholder="Escribí el color"
                        className="w-full text-sm border border-border-subtle rounded-lg px-3 py-2 bg-white text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                      />
                    </div>
                  )}

                  {/* Nota da peça sobre a terminação (campo `finishNote` do Sheet) —
                      opcional, hoje só nas peças de união/kit que precisam bater com
                      o acabamento da bandeja que empalman. */}
                  {product.finishNote && (
                    <p className="text-[10.5px] text-text-muted mt-1.5">{product.finishNote}</p>
                  )}
                </div>
              </>
            ) : (
              /* Material + Espesor — caminho de hoje, intacto */
              (hasMaterials || hasGauges) && (
                <div className="no-print flex gap-4 mb-4 flex-wrap">

                  {hasMaterials && (
                    <div className="flex-1 min-w-[120px]">
                      <div className="text-xs text-text-muted mb-1.5">Material</div>
                      <div className="flex flex-wrap gap-1">
                        {gs.materials.map(m => {
                          const sel = selectedMaterial === m.id
                          return (
                            <button key={m.id}
                              onClick={() => setSelectedMaterial(m.id)}
                              className="text-[11px] px-2 py-1 rounded transition capitalize"
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
              )
            )}

            {/* SKU composto + Pieza a medida — lado a lado a partir de md; sem o
                segundo bloco, o primeiro ocupa a largura toda (sem coluna vazia). */}
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <div className={`bg-surface-elevated rounded-lg px-3 py-2.5 ${!product.configurable ? 'md:col-span-2' : ''}`}>
                <div className="text-[10px] text-text-muted mb-0.5">SKU compuesto</div>
                <div className="font-mono text-sm font-medium text-text-primary tracking-tight">
                  {composedSKU}
                </div>
              </div>

              {/* la ficha lo dice explícitamente (ver Sheet §Peças configuráveis) */}
              {product.configurable && (
                <div className="bg-brand-accent/10 border border-brand-accent/50 rounded-lg px-3 py-2.5 text-[11px] text-text-secondary">
                  <span className="font-semibold text-brand-primary">Pieza a medida — </span>
                  confirmá el detalle con el vendedor antes de cotizar (ver preguntas frecuentes abajo).
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center border border-border-subtle rounded-lg overflow-hidden shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => setQty(q => Math.max(1, clampQty(q) - 1))}
                  className="w-8 h-11 sm:h-9 flex items-center justify-center text-text-muted hover:bg-surface-elevated transition text-lg leading-none"
                >−</button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qty}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '')
                    setQty(digits === '' ? '' : Number(digits))
                  }}
                  onBlur={() => setQty(q => clampQty(q))}
                  aria-label="Cantidad"
                  className="w-14 h-11 sm:h-9 text-center font-mono text-sm border-x border-border-subtle focus:outline-none"
                />
                <button
                  onClick={() => setQty(q => Math.min(9999, clampQty(q) + 1))}
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
                  <WhatsappIcon size={14} />
                  Consultar con un especialista
                </a>
              )}
            </div>

            {/* Unidade de venda (campo do Sheet, existe em 3 das 36 fichas) */}
            {product.unidadVenta && (
              <p className="text-[11px] text-text-muted mt-1.5">
                Unidad de venta: {product.unidadVenta}
              </p>
            )}

            {/* Peças complementares (campo `recommended` do Sheet) — só link, sem CTA próprio */}
            <div className="no-print">
              <RecommendedProducts products={recommended} />
            </div>

            {cartLine && (
              <Link
                href="/cotacao"
                className="no-print block text-center sm:text-left text-xs text-text-muted hover:text-brand-primary hover:underline transition mt-2"
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
                className="no-print flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-xs text-text-secondary hover:text-text-primary hover:underline transition"
              >
                <WhatsappIcon size={14} className="text-wa" />
                ¿Dudas técnicas? Consultá con un especialista
              </a>
            )}

          </div>
        </div>

        {/* Materiales, tratamientos y normas — conteúdo global da família (era
            duplicado em 3 abas, idêntico nas 36 fichas), não da peça. */}
        <div className="no-print border-t border-border-subtle px-5 py-3 text-xs text-text-muted">
          Materiales, tratamientos y normas — iguales para toda la línea ·{' '}
          <Link href="/materiales-y-tratamientos/" className="font-semibold text-brand-primary hover:underline">
            Ver detalle →
          </Link>
        </div>
      </div>
    </>
  )
}
