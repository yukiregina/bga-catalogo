---
name: faro-catalogo-cotizacion
description: Spec completa do catálogo navegável Faro com carrinho de cotação (RFQ) embutido. Use SEMPRE que a tarefa envolver construir, revisar ou estender um catálogo de cliente Faro — hoje o catálogo BGA — incluindo estrutura de dados (xlsx de SKUs), navegação por família, botão/fluxo "Solicitar cotización", carrinho, formulário de lead, captura persist-first, eventos GA4 ou integração com a vendedora via WhatsApp. Também use quando Yuki mencionar "catálogo", "cotización", "carrinho de cotação", "RFQ", "orçamento no site" ou o build BGA, mesmo sem pedir a skill. Complementa faro-posicionamento (o porquê); esta skill é o como.
---

# Faro — Catálogo navegável com cotação embutida

Fonte: sessão de 2026-07-19. Se conflitar com `faro-posicionamento`, o
posicionamento vence. Se a Yuki contradisser qualquer parte, ela vence.

## A tese (por que a cotação não é opcional)

O produto da Faro é o caminho do produto até o pedido de orçamento. Catálogo
navegável sem caminho de cotação é o PDF bonito de novo — decoração. Por isso o
RFQ (*Request for Quotation*, pedido de cotação) **é a segunda metade do
artefato catálogo**, dentro do escopo, nunca um upsell. Todo build de catálogo
inclui: navegação → carrinho → captura → vendedora → medição.

Princípio de design que resolve o problema central deste público: **o form
captura o que a pessoa sabe e nunca pune o que ela não sabe.** Quem cota muitas
vezes é comprador ou administrativo de obra, não quem especificou. Form que
exige medida perde o lead que hoje pelo menos mandava um WhatsApp vago.

## 1. Modelo de dados (a planilha real — BGA_Catalog_Template_vF)

A planilha que o cliente popula (Google Sheets, `BGA_Catalog_Template_vF`) é a
fonte de verdade e **não deve ser reestruturada** — o Akira já está populando.
Estrutura verificada (2026-07-19):

- **Uma aba por família:** `01_Bandejas`, `02_Escaleras`, `03_Perfilados`,
  `04_Bandejas_Aramadas`, `05_Cajas`, `06_Gabinetes` (+ `00_INSTRUCCIONES`).
- **Colunas comuns:** `SKU*`, `Orden` (múltiplos de 10, define ordem de
  exibição), `Activo` (Sí/No — só "Sí" entra no catálogo), `Destaque`,
  `Código` (ex.: CT3111), `Subfamilia*`, `Nombre ES*`.
- **Colunas de spec variam por família** — e isso é o ouro: em Bandejas,
  `Modelo (Lisa/Perforada)`, `Tipo (U/C)`, `Ancho [A] disponibles (mm)*`,
  `Ala [B] disponibles (mm)`, `Longitud std (mm)`, `Materiales disponibles`,
  `Espesores disponibles`, `Tratamientos disponibles`; em Gabinetes,
  `Alto/Ancho/Profundidad (mm)`, `Puerta simple/doble`, `IP/Norma`,
  `Acabado/Color`, `Características especiales`.

**As colunas "disponibles" são as variantes do carrinho.** Cada lista
(ex.: `50,75,100,...`) vira um dropdown opcional no item cotado. Não pedir
campos novos por SKU ao cliente — o carrinho deriva tudo do que já existe.
Linha 4 de cada aba é exemplo (pode ser apagada); amarelo = obrigatório.

**O que falta é config, não dado** — resolver numa aba nova (ex.:
`07_CONFIG_COTIZACION`), preenchida pela Yuki, uma linha por família:

| Coluna | Uso | Exemplo |
|---|---|---|
| `aba` | qual família | 01_Bandejas |
| `unidad_venta` | o que "cantidad" significa no carrinho | tramo 3m, barra, pieza |
| `modo_cotizacion` | `carrito` \| `consultar` | Gabinetes → consultar? |

Somar aí a **legenda das siglas** (PZ, CN, IN304, IN316, GF, PNG, PNA, PBL,
PBG, PES...) se não estiver em `00_INSTRUCCIONES` — o carrinho mostra rótulo
humano, nunca sigla crua.

`modo_cotizacion = consultar` é pra família configurável/sob medida: em vez de
entrar no carrinho, o CTA vira "Consultar con un especialista" direto. Cotável
e configurável são coisas diferentes; forçar o segundo no carrinho gera pedido
incompleto. Quais famílias caem em cada modo é decisão da Yuki com o cliente.

## 2. Navegação e CTAs

- Estrutura: família → produto → SKU. Cada família tem página própria e
  indexável (SEO/GEO: schema.org `Product`, títulos descritivos — o catálogo
  também existe pra ser encontrado).
- **Todo card de SKU tem o botão "Agregar a cotización".** Todo nível tem
  caminho visível pra cotação — a régua de teardown da própria Faro aponta
  "produto sem botão de cotação" como erro nº 1; não cometer no próprio build.
- O carrinho é persistente na sessão e sempre visível (contador de itens).

## 3. O carrinho e o formulário

No carrinho, por item: quantidade (aceitar aproximada) + campos de `variantes`
**sempre opcionais**. No envio, um form curto:

Obrigatórios: nombre, empresa, contacto (email o teléfono).
Opcionais: os specs por item, plazo, e três mecanismos pra quem não sabe:

1. **"Necesito ayuda técnica"** (checkbox) — resposta válida, não falha. Marca
   o pedido pra vendedora ligar e especificar junto. O form não substitui a
   vendedora; entrega o lead pré-organizado pra ela.
2. **"Adjuntá tu lista o plano"** (upload) — quem cota em nome de outro
   geralmente tem a info em planilha, foto ou print. Anexo no lugar de
   digitação.
3. **"¿Para qué es?"** (obra / instalación / mantenimiento + campo livre) —
   contexto compensa spec faltante: pedido sem medida mas com contexto fecha.

Nunca formulário longo em branco: os itens já vêm do catálogo preenchidos —
essa é a vantagem sobre o "fale conosco".

## 4. Envio: persist-first, sempre

Ordem inegociável no submit:

1. **(a) Grava** o lead (planilha Google via serverless function) **e dispara
   e-mail** pra vendedora com a lista de itens e as flags (ayuda técnica,
   anexo, contexto).
2. **(b) Só depois** abre `wa.me` da vendedora com mensagem pré-preenchida:
   `"Hola, solicité cotización de: 3× Perfil C 38×38, 10× Bandeja X (obra)"`.

A gravação nunca depende do WhatsApp abrir. O `wa.me` é o "falar agora"; a
planilha é o lead. Não confundir os dois. (Lição TripleR: o link abre o
WhatsApp do visitante — só se vê o número dele se ele mandar a mensagem.)

Payload de referência (colunas da planilha ≈ campos que um CRM/ERP espera —
porta aberta pra integração futura, sem retrabalho):

```json
{
  "timestamp": "", "nombre": "", "empresa": "", "email": "", "telefono": "",
  "items": [{ "sku": "", "nombre": "", "cantidad": "", "specs": {} }],
  "ayuda_tecnica": false, "adjunto_url": "", "contexto": "",
  "origen": "catalogo", "estado": "nuevo"
}
```

## 5. Stack: zero-infra, nada com babá

Vercel (conta do cliente) + serverless function + planilha Google + `wa.me` +
GA4. **Sem n8n, sem servidor, sem banco, sem API de WhatsApp, sem bot.**
Regra Faro: robô = API = infra = mensalidade. Tudo que roda 24/7 precisa de
operação; este artefato promete independência, então a stack não pode mentir.
Se o cliente um dia pedir bot/nutrição, isso é Fase 2 com mensalidade — e o
bot certo qualifica e entrega pro vendedor com contexto, nunca atende sozinho
(este público compra de gente; a tese é "a vendedora dentro do site").

## 6. Medição (o que vira case)

Eventos GA4: `ver_familia`, `ver_producto`, `agregar_cotizacion`,
`cotizacion_enviada`, `click_whatsapp`.

Métricas de processo (as do case fundacional Faro — processo, não promessa de
conversão): **pedidos completos direto vs. completados pela vendedora vs.
perdidos**, e **tempo do pedido à proposta**. A planilha precisa de colunas de
estado pra vendedora marcar (`nuevo / contactado / propuesta / cerrado`) —
sem isso a métrica de tempo não existe.

## 7. Fase 2 — nomear, não construir

Ficam explicitamente fora do build v1 (citar como "Fase 2" se o cliente pedir,
nunca como menu de preço): login de cliente recorrente, integração ERP,
nutrição automática (réguas), wizard/seletor "¿no sabe qué necesita?", bot
qualificador.

## 8. Específicos BGA (primeiro cliente deste template)

- Idioma da interface: **espanhol** (Paraguai). Tom neutro-profissional;
  voseo/tuteo é decisão da Yuki, manter consistente.
- Vendedora que recebe os leads: **Aida** (e-mail + WhatsApp dela no fluxo).
- Famílias na planilha: Bandejas, Escaleras, Perfilados, Bandejas Aramadas,
  Cajas, Gabinetes. Candidatos naturais a `modo_cotizacion = consultar`:
  Gabinetes modulares (e tableros, se entrarem) — confirmar com Yuki/Akira.
- Estado da população (jul/2026): Bandejas avançada; Gabinetes quase vazia.
  O build pode começar pelas abas populadas.
- Fotos: seguir o briefing fotográfico já entregue (nomenclatura por SKU,
  entrega via Drive). Placeholders são aceitáveis enquanto o conteúdo chega.
- O catálogo BGA é o case fundacional: instrumentar a medição desde o dia 1,
  mesmo com conteúdo parcial.

## 9. Decisões que são da Yuki (a skill não decide)

- Quais famílias entram no carrinho vs. "consultar especialista".
- Tom do espanhol e microcopy final (voz: `write-with-yuki` / `anti-slop-yuki`).
- Se e quando o wizard/seletor de Fase 2 entra no roadmap.

Se um pedido do cliente contradisser esta spec (ex.: "tira o formulário, deixa
só o WhatsApp"), apontar o conflito citando a seção — a captura persist-first
e a medição são o que tornam o artefato defensável. A Yuki decide.
