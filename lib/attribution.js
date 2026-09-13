/**
 * attribution.js — captura de origem (UTM, gclid/fbclid/gbraid/wbraid,
 * referrer) pra que todo pedido de cotização carregue de onde veio.
 *
 * Regra: último toque PAGO vence.
 * - Se a URL atual traz algum utm_* ou click id → sobrescreve o que estava
 *   guardado. É a campanha nova ganhando da antiga.
 * - Se não há nada guardado (ou o que há passou de 90 dias) → guarda a visita
 *   atual, com o referrer que tiver — é o caso orgânico/direto.
 * - Senão → mantém o que já estava. Um visitante que volta direto (sem UTM)
 *   não pode apagar a campanha que originalmente trouxe ele.
 *
 * localStorage pode falhar (navegação privada, cota cheia) — toda leitura e
 * escrita está em try/catch. Uma falha aqui nunca pode custar o lead: sem
 * atribuição guardada, o pedido grava mesmo assim, só sem a origem.
 */

const STORAGE_KEY = 'bga_attr'
const TTL_MS = 90 * 24 * 60 * 60 * 1000
const CLICK_ID_FIELDS = ['gclid', 'fbclid', 'gbraid', 'wbraid']
const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

function truncate(value, max = 200) {
  return String(value ?? '').slice(0, max)
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.ts) return null
    if (Date.now() - Date.parse(parsed.ts) > TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeStored(record) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // medição nunca derruba a página
  }
}

export function captureAttribution() {
  if (typeof window === 'undefined') return

  try {
    const params = new URLSearchParams(location.search)
    const hasUtm = UTM_FIELDS.some(f => params.get(f))
    const hasClickId = CLICK_ID_FIELDS.some(f => params.get(f))
    const stored = readStored()

    if (!hasUtm && !hasClickId && stored) return

    const record = { ts: new Date().toISOString() }
    UTM_FIELDS.forEach(f => { record[f] = params.get(f) || '' })
    CLICK_ID_FIELDS.forEach(f => { record[f] = params.get(f) || '' })
    record.referrer = document.referrer ? new URL(document.referrer).hostname : ''
    record.landing_page = location.pathname

    writeStored(record)
  } catch {
    // medição nunca derruba a página
  }
}

export function getAttribution() {
  try {
    const stored = readStored()
    if (!stored) return {}

    const clickIdField = CLICK_ID_FIELDS.find(f => stored[f])
    const clickId = clickIdField ? `${clickIdField}:${stored[clickIdField]}` : ''

    return {
      fuente: truncate(stored.utm_source),
      medio: truncate(stored.utm_medium),
      campana: truncate(stored.utm_campaign),
      contenido: truncate(stored.utm_content),
      termino: truncate(stored.utm_term),
      click_id: truncate(clickId),
      pagina_entrada: truncate(stored.landing_page),
      referrer: truncate(stored.referrer),
    }
  } catch {
    return {}
  }
}
