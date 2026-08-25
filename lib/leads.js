/**
 * leads.js — gravação persist-first do pedido de cotação.
 *
 * Regra da spec (seção 4): grava o pedido ANTES de abrir o WhatsApp.
 * O `wa.me` abre o WhatsApp do visitante; se ele não apertar enviar, o pedido
 * não existe em lugar nenhum. Esta função é o que faz o pedido existir.
 *
 * Detalhes que importam:
 * - `keepalive: true` faz a requisição sobreviver mesmo se a aba mudar de
 *   contexto logo depois. Por isso quem chama NÃO precisa (e não deve) dar
 *   await antes de abrir o WhatsApp — await quebraria o gesto do usuário e o
 *   navegador bloquearia o popup.
 * - `mode: 'no-cors'` é imposto pelo Apps Script: a resposta vem opaca, então
 *   não dá para confirmar sucesso no cliente. A conferência é na planilha.
 * - Content-Type text/plain evita o preflight OPTIONS, que o Apps Script não
 *   responde.
 */

import config from '@/client.config.js'

export function registrarCotizacion(payload) {
  const url = config.data.leadWebhookUrl
  if (!url) return false

  try {
    const body = JSON.stringify({
      ...payload,
      key: config.data.leadWebhookSecret || undefined,
    })

    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    }).catch(() => {})

    return true
  } catch {
    return false
  }
}
