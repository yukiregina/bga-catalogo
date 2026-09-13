/**
 * analytics.js — contrato do dataLayer. O GTM (components/Analytics.jsx) lê
 * daqui e mapeia pro GA4 e, no futuro, pra qualquer outra tag (Ads, Meta) sem
 * precisar de deploy. Se o container estiver ausente ou bloqueado, os pushes
 * só se acumulam num array — nada quebra.
 *
 * Eventos do catálogo (spec faro-catalogo-cotizacion, seção 6, + medição de
 * 2026-09-13): ver_familia · ver_producto · agregar_cotizacion ·
 * cotizacion_enviada · click_whatsapp · buscar_catalogo · iniciar_cotizacion ·
 * click_linea_nueva
 */

export function track(event, params = {}) {
  if (typeof window === 'undefined') return
  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...params })
  } catch {
    // medição nunca derruba a página
  }
}
