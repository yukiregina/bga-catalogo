/**
 * client.config.js — configuração por cliente
 *
 * Para criar um novo catálogo:
 * 1. Copiar o projeto
 * 2. Trocar os valores abaixo
 * 3. Trocar o logo em /public/logo.svg
 * 4. Preencher o Google Sheet e colocar o ID em data.googleSheetId
 *
 * Tudo que muda de cliente pra cliente mora aqui.
 */

module.exports = {

  // ─── Marca ────────────────────────────────────────────────────────────────
  brand: {
    name:    'BGA Electric',
    tagline: 'Soluciones prácticas, seguras y eficientes para canalizaciones eléctricas.',
    logo:    '/logo-bga.png',
    colors: {
      primary: '#131E29',
      accent:  '#FFC600',
    },
    address: 'Minga Guazú, Ruta PY02 km14, Alto Paraná – Paraguay',
  },

  // ─── Contato ──────────────────────────────────────────────────────────────
  contact: {
    whatsapp: '+595974733100',
    phone:    '+595 974 733 100',
    email:    'ventas@bga.com.py',
    // Mensagem padrão enviada no WhatsApp ao cotar
    whatsappMessage: 'Hola, me interesa hacer una cotización de los siguientes productos:',
  },

  // ─── Catálogo ─────────────────────────────────────────────────────────────
  catalog: {
    title:   'Catálogo de Productos',
    ctaText: 'Cotización',
  },

  // ─── Dados ────────────────────────────────────────────────────────────────
  data: {
    // ID da planilha Google Sheets — null = usa catalog.json local (placeholder)
    googleSheetId: null,
    // Webhook (Google Apps Script) que recebe os leads do formulário de cotação.
    // O site estático original (reference-lp) tinha uma URL + secret ativos aqui —
    // não foram portados automaticamente (decisão de segurança). Para reativar,
    // preencha os dois abaixo com os valores do Apps Script do cliente.
    leadWebhookUrl: null,
    leadWebhookSecret: null,
  },

  // ─── Meta ─────────────────────────────────────────────────────────────────
  meta: {
    title:       'BGA Electric — Catálogo',
    description: 'Catálogo digital de productos BGA Electric S.A.',
    lang:        'es',
  },

}
