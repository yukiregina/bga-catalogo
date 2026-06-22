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
  },

  // ─── Contato ──────────────────────────────────────────────────────────────
  contact: {
    whatsapp: '+595974733100',
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
  },

  // ─── Meta ─────────────────────────────────────────────────────────────────
  meta: {
    title:       'BGA Electric — Catálogo',
    description: 'Catálogo digital de productos BGA Electric S.A.',
    lang:        'es',
  },

}
