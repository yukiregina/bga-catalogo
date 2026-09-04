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
    ruc:     '80097677-0',
  },

  // ─── Contato ──────────────────────────────────────────────────────────────
  contact: {
    whatsapp: '+595974733100',
    phone:    '+595 974 733 100',
    email:    'ventas@bga.com.py',
    // Contato de dados pessoais na política de privacidade — não é o
    // comercial. Definido pelo cliente em 03/09/2026.
    privacyEmail: 'financiero@bga.com.py',
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
    // Mesma implantação usada pela landing page estática: doGet grava o
    // formulário da home na primeira aba, doPost grava as cotações do catálogo
    // na aba "Cotizaciones".
    leadWebhookUrl: 'https://script.google.com/macros/s/AKfycbxy68QuMRE9JbJ--B9QucS2VScqwu8Ex4mCFyxd5dBUvURDkgpRV9FXXGrXaQ1tB5CDng/exec',
    // Não é segredo de verdade: qualquer visitante lê isto no bundle. Serve só
    // para impedir que um robô encontre a URL do Apps Script e encha a planilha.
    // Se começar a entrar lixo, troque aqui e na propriedade LEAD_FORM_SECRET
    // do script.
    leadWebhookSecret: 'c1e7ac2ebfb800939f8224d87f275ec9727b33fb3551f85b',
    // GA4 do cliente. Null = catálogo sobe sem medição.
    gaMeasurementId: 'G-3PF2RG7WNG',
  },

  // ─── Meta ─────────────────────────────────────────────────────────────────
  meta: {
    title:       'BGA Electric — Catálogo',
    description: 'Catálogo digital de productos BGA Electric S.A.',
    lang:        'es',
  },

}
