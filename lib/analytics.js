/**
 * analytics.js — camada fina sobre o gtag do GA4.
 *
 * Se o GA4 não estiver configurado (gaMeasurementId nulo, bloqueador de anúncio,
 * SSR), track() vira no-op. O site nunca quebra por causa de medição.
 *
 * Eventos do catálogo (spec faro-catalogo-cotizacion, seção 6):
 *   ver_familia · ver_producto · agregar_cotizacion · cotizacion_enviada · click_whatsapp
 */

export function track(event, params = {}) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  try {
    window.gtag('event', event, params)
  } catch {
    // medição nunca derruba a página
  }
}
