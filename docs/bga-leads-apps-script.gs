// BGA Lead Tracker — Google Apps Script  ·  v3 (2026-09-01)
// Cole em: script.google.com → seu projeto → Code.gs
// Implantar → Gerenciar implantações → Editar (lápis) → Nova versão → Implantar
//
// MUDANÇA DA v3: campo "Ciudad" novo em doGet e doPost — opcional em ambos,
// nunca entra na guarda de bad_request. Isso deslocou em uma coluna tudo que
// vinha depois dele: Estado (Cotizaciones) agora é a 12ª coluna, não a 11ª.
//
// DUAS ENTRADAS, UMA PLANILHA:
//   doGet  → formulário de contato da landing page  → primeira aba (como antes)
//   doPost → carrinho de cotação do catálogo        → aba "Cotizaciones"
//
// SEGURANÇA:
// 1. Configurações do projeto → Propriedades do script → adicionar:
//      Propriedade: LEAD_FORM_SECRET   Valor: (string longa aleatória)
// 2. O mesmo valor vai em client.config.js (leadWebhookSecret) e no index.html
//    da LP estática. Enquanto LEAD_FORM_SECRET estiver vazio, requisições
//    passam sem ?key= (compatibilidade). Isso não é segredo de verdade — ele
//    fica visível no navegador. É trava contra robô, não contra pessoa.
//
// MUDANÇA IMPORTANTE EM RELAÇÃO À v1:
//   doGet usava getActiveSheet(). Ao criar a aba "Cotizaciones", "ativa" podia
//   passar a ser a aba errada e os leads da home cairiam no lugar errado.
//   Agora doGet grava explicitamente em getSheets()[0] e "Cotizaciones" é
//   sempre inserida no fim.

var LIMITS = { nombre: 120, empresa: 120, sector: 80, mensaje: 4000 };

var TAB_COTIZACIONES = 'Cotizaciones';

var HEADERS_COTIZACIONES = [
  'Fecha', 'Nombre', 'RUC / Empresa', 'Ciudad', 'Rubro',
  'Ítems', 'Cant. total', 'SKUs', 'Obra', 'Plazo', 'Origen',
  'Estado', 'Contactado el', 'Propuesta el', 'Notas'
];

var ESTADOS = ['nuevo', 'contactado', 'propuesta', 'cerrado', 'perdido'];

// ── Landing page (inalterado, exceto a aba explícita) ────────────────────────

function doGet(e) {
  if (!autorizado_(e.parameter.key)) return jsonOut({ status: 'forbidden' });

  var nombre  = clampField(e.parameter.nombre, LIMITS.nombre);
  var empresa = clampField(e.parameter.empresa, LIMITS.empresa);
  var ciudad  = clampField(e.parameter.ciudad, LIMITS.empresa);
  var sector  = clampField(e.parameter.sector, LIMITS.sector);
  var mensaje = clampField(e.parameter.mensaje, LIMITS.mensaje);

  // Ciudad é opcional: não entra na guarda. Rejeitar o que o formulário aceita
  // seria falha silenciosa — o dado que existe se perderia sem aviso.
  if (!nombre || !empresa || !sector || !mensaje) {
    return jsonOut({ status: 'bad_request' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Fecha', 'Nombre', 'Empresa', 'Ciudad', 'Rubro', 'Mensaje']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([new Date(), nombre, empresa, ciudad, sector, mensaje]);
  return jsonOut({ status: 'ok' });
}

// ── Catálogo: carrinho de cotação ────────────────────────────────────────────

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ status: 'bad_json' });
  }

  if (!autorizado_(data.key)) return jsonOut({ status: 'forbidden' });

  var items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) return jsonOut({ status: 'bad_request' });

  var sheet = abaCotizaciones_();

  var linhas = items.map(function (it) {
    var obs = it.observacion ? ' (' + it.observacion + ')' : '';
    return '• ' + it.sku + ' — ' + it.nombre + ' · ' + it.cantidad + ' un' + obs;
  }).join('\n');

  var total = items.reduce(function (soma, it) {
    return soma + (Number(it.cantidad) || 0);
  }, 0);

  var skus = items.map(function (it) { return it.sku; }).join(', ');

  sheet.appendRow([
    new Date(),
    clampField(data.nombre, LIMITS.nombre),
    clampField(data.empresa, LIMITS.empresa),
    clampField(data.ciudad, LIMITS.empresa),
    clampField(data.rubro, LIMITS.sector),
    clampField(linhas, LIMITS.mensaje),
    total,
    clampField(skus, LIMITS.mensaje),
    clampField(data.proyecto, LIMITS.empresa),
    clampField(data.plazo, LIMITS.sector),
    clampField(data.origen || 'catalogo', 40),
    'nuevo',
    '', '', ''
  ]);

  return jsonOut({ status: 'ok' });
}

// ── Auxiliares ───────────────────────────────────────────────────────────────

function abaCotizaciones_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB_COTIZACIONES);

  if (!sheet) {
    sheet = ss.insertSheet(TAB_COTIZACIONES, ss.getNumSheets());
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS_COTIZACIONES);
    sheet.getRange(1, 1, 1, HEADERS_COTIZACIONES.length).setFontWeight('bold');
    sheet.setFrozenRows(1);

    // Coluna Estado (12ª, desde que "Ciudad" entrou na 4ª) com lista suspensa
    // — é o que faz a métrica de processo existir: pedidos completos,
    // completados pela vendedora, perdidos.
    var regra = SpreadsheetApp.newDataValidation()
      .requireValueInList(ESTADOS, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 12, 2000, 1).setDataValidation(regra);

    sheet.setColumnWidth(6, 320);  // Ítems
    sheet.setColumnWidth(8, 200);  // SKUs
  }

  return sheet;
}

function autorizado_(chave) {
  var secret = PropertiesService.getScriptProperties().getProperty('LEAD_FORM_SECRET');
  if (!secret) return true;          // ainda não configurado: modo legado
  return chave === secret;
}

function clampField(raw, maxLen) {
  var s = String(raw == null ? '' : raw).trim();
  if (s.length > maxLen) s = s.substring(0, maxLen);
  return s;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
