# Medição — GTM, GA4 e atribuição de campanha

Registrado em 13/09/2026, depois de implementar os sete blocos do
`PROMPT-medicao-gtm-2026-09-13.md`. Mesmo formato do doc de medição da Triple
R — pensado pra uma sessão futura auditar contra o histórico de versão do GTM
e o change log do GA4, não pra confiar num resumo.

---

## 1. Identificadores

| | |
| --- | --- |
| Container GTM | `GTM-M9CWZQV8` — criado em 13/09/2026 na conta Google da BGA |
| Propriedade GA4 | `G-3PF2RG7WNG` — confirmado na conta da BGA em 24/08/2026 (ver CLAUDE.md, seção 5.1) |
| Domínio medido | `bga.com.py` e `www.bga.com.py` — mesma lista nos dois guardas de hostname (GTM e, antes, GA4 direto) |

O GA4 deixou de ser lido pelo código (`config.data.gaMeasurementId` fica só
como registro de qual propriedade é); a tag Google Tag que aponta pra ele
mora dentro do container GTM — ver seção 3.

---

## 2. Contrato do dataLayer

`lib/analytics.js` empurra `{ event, ...params }` pro `window.dataLayer`. Se o
container GTM não carregar (bloqueador de anúncio, preview do Amplify sem
`gtm_debug`), os pushes só se acumulam num array — nada quebra.

| Evento | Onde dispara | Parâmetros |
| --- | --- | --- |
| `ver_familia` | `app/catalogo/[categoria]/page.jsx` via `<TrackView>` | `familia`, `nombre`, `modo` |
| `ver_producto` | `ProductSheet.jsx`, no mount da ficha | `sku`, `producto`, `familia` |
| `agregar_cotizacion` | `ProductSheet.jsx`, ao confirmar quantidade/config | `sku`, `sku_compuesto`, `producto`, `familia`, `cantidad`, `origen` (hoje sempre `"ficha"` — ver nota abaixo) |
| `cotizacion_enviada` | `app/cotacao/page.jsx`, em `handleSend`, antes do `wa.me` abrir | `items`, `unidades`, `rubro` |
| `click_whatsapp` | `ProductSheet.jsx` (consulta direta) e `app/cotacao/page.jsx` (lista vazia) | `sku`, `producto`, `familia`, `origen` — ou só `origen: 'cotizacion_vacia'` no segundo caso |
| `buscar_catalogo` **novo** | `components/ProductFinder.jsx`, 800ms depois da última tecla, busca ≥ 3 caracteres, uma vez por termo distinto | `termino` (minúsculo), `resultados` (contagem real via `lib/search.js`) |
| `iniciar_cotizacion` **novo** | `app/cotacao/page.jsx`, na primeira interação com qualquer campo do formulário, uma vez por carregamento de página | `items`, `unidades` |
| `click_linea_nueva` **novo** | `components/ProductFinder.jsx`, no clique do card de categoria com `badge` definido | `familia` (id da categoria), `badge` (texto do selo) |

> **Nota sobre `origen` em `agregar_cotizacion`:** a spec original (seção 6 do
> handoff) previa `origen: grilla|ficha` — um quick-add na grade do catálogo e
> outro na ficha. Hoje só existe o caminho pela ficha (`ProductSheet.jsx`); não
> há `addItem()` chamado em nenhum componente de grade. Não mexi nisso agora —
> fora do escopo desta tarefa de medição — mas registro aqui pra não passar
> como se os dois caminhos existissem.

---

## 3. Configuração do GTM — FEITA em 13/09/2026

Montada na interface por uma sessão do Claude (Cowork), com a Yuki logada como
`mkt@bga.com.py`. **Tudo em rascunho no Default Workspace — nada publicado.**
A publicação só faz sentido depois que o catálogo estiver no ar e o Preview
confirmar os eventos. Para auditar: Versões ▸ histórico do container, e
Administrador ▸ Atividade do contêiner.

O que existe hoje no workspace:

| Item | Nome no GTM |
| --- | --- |
| Tag de configuração | `Tag do Google — GA4 BGA` → `G-3PF2RG7WNG`, trigger *Initialization – All Pages* |
| Tag de evento (uma só) | `GA4 — eventos del catálogo` → nome do evento `{{Event}}`, 14 parâmetros, trigger abaixo |
| Trigger | `CE - eventos del catálogo` — Evento personalizado, correspondência de regex ligada |
| Variáveis de camada de dados | 14: `familia`, `nombre`, `modo`, `sku`, `sku_compuesto`, `producto`, `origen`, `cantidad`, `items`, `unidades`, `rubro`, `termino`, `resultados`, `badge` — todas nomeadas `DLV - <parâmetro>` |
| Variáveis embutidas | `Event`, `Page Path`, `Page Hostname` (além das que já vinham por padrão) |

Nota registrada durante a configuração: ao informar o ID de métrica, o GTM
avisou que **já existe uma tag do Google no ecossistema da propriedade chamada
`BGA - Site Institucional`** — é a da landing antiga, e a tag de evento herda a
configuração dela. Não foi alterada.

### 3.1 Especificação original (referência)

1. **Tag "Google Tag" (GA4 config)** — destino `G-3PF2RG7WNG`, trigger
   *Initialization – All Pages*.
2. **Uma única tag "GA4 Event"** (não uma por evento):
   - Nome do evento: `{{Event}}` (variável embutida)
   - Parâmetros do evento: cada um mapeado de uma Data Layer Variable (ver
     lista abaixo)
   - Trigger: *Custom Event*, com regex cobrindo os 8 nomes:
     ```
     ^(ver_familia|ver_producto|agregar_cotizacion|cotizacion_enviada|click_whatsapp|buscar_catalogo|iniciar_cotizacion|click_linea_nueva)$
     ```
3. **Variáveis de camada de dados** a criar (uma por parâmetro que aparece em
   algum evento): `familia`, `nombre`, `modo`, `sku`, `producto`,
   `sku_compuesto`, `cantidad`, `origen`, `items`, `unidades`, `rubro`,
   `termino`, `resultados`, `badge`.

---

## 4. Configuração do GA4 (a fazer na interface do Analytics)

- **Dimensões personalizadas** (escopo de evento) — mínimo pra não perder o
  que já chega: `familia`, `sku`, `producto`, `origen`, `rubro`, `termino`,
  `sku_compuesto`. Sem isso os parâmetros são coletados mas não aparecem em
  nenhum relatório.
- **Eventos-chave**: `agregar_cotizacion`, `cotizacion_enviada`,
  `click_whatsapp`. Só marcam depois que o evento tiver tráfego real —
  Preview do GTM não conta pro GA4.
- **Filtro de tráfego interno**: IP do Akira + da Yuki + do escritório da
  BGA, estado **Ativo** (não "Testando"). IP do Akira ainda pendente de
  coletar.
- **Retenção de dados**: 14 meses.
- **Fluxo de dados**: nomear como o domínio (`bga.com.py`), cobrindo
  eventual subdomínio futuro.

---

## 5. Checklist de fechamento

Código (feito nesta sessão — commits `daf6187`…`6014e4a`)

- [x] `client.config.js` com `gtmContainerId`
- [x] `Analytics.jsx` carrega GTM em vez de gtag, com escape `gtm_debug`
- [x] `lib/analytics.js` empurra pro `dataLayer`
- [x] `lib/attribution.js` captura UTM/gclid/fbclid/gbraid/wbraid, TTL 90 dias,
      última campanha paga vence
- [x] Atribuição chega nos dois formulários (`/cotacao` e home)
- [x] 5 colunas novas no fim de `HEADERS_COTIZACIONES` e no cabeçalho da aba
      de contato (`docs/bga-leads-apps-script.gs`)
- [x] Política de privacidade (seção 7) cobre GTM e etiquetas de publicidade
- [x] `npm run build` gera as 202 páginas sem erro
- [x] Verificado localmente: `buscar_catalogo` dispara com `resultados` real,
      `iniciar_cotizacion` dispara na primeira tecla do formulário, e o
      payload do webhook carrega `fuente`/`campana` a partir de
      `?utm_source=test&utm_campaign=verificacion`

Contas (pendente — fora do que dá pra fazer por código)

- [x] Tags, triggers e variáveis do GTM criados na interface (seção 3) — 13/09/2026, em rascunho, sem publicar
- [ ] Publicar a versão do container (só depois do Preview validar em produção)
- [x] 7 dimensões personalizadas criadas no GA4 — 13/09/2026, escopo Evento,
      nome = parâmetro: `familia`, `sku`, `sku_compuesto`, `producto`,
      `origen`, `rubro`, `termino` (feitas por sessão do Claude logada como
      `mkt@bga.com.py`; conferir em Admin ▸ Histórico de alterações)
- [ ] 3 eventos-chave marcados (depende de tráfego real pós-deploy)
- [ ] Filtro de tráfego interno Ativo, com o IP do Akira
- [x] Retenção 14 meses — **já estava assim** (conferido em 13/09/2026: dados do evento e dados do usuário ambos em 14 meses, botão Salvar inativo). Não foi preciso mudar nada
- [ ] Preview do GTM + DebugView do GA4 percorridos no fluxo inteiro em
      produção (home → família → ficha → agregar → enviar)
- [ ] Cotização de teste real, pós-deploy, com origem gravada na planilha da
      BGA (**atenção**: se a aba já existir de antes desta mudança, as 5
      colunas novas precisam ser adicionadas à mão primeiro — ver comentário
      no topo do `.gs`)

Manual, fora do código

- [ ] Adicionar as 5 colunas (`Fuente`, `Medio`, `Campaña`, `Click ID`,
      `Página de entrada`) na aba `Cotizaciones` e na primeira aba da
      planilha existente da BGA, se a implantação nova do Apps Script for
      publicada sobre a planilha atual
- [ ] Publicar nova versão do Apps Script (editar `Code.gs` sozinho não
      implanta — Gerenciar implantações → Editar → Nova versão)

---

## 6. Search Console — criado em 13/09/2026

Não existia nenhuma propriedade. Criadas duas, as duas **verificadas
automaticamente pelo método Google Analytics** (a conta `mkt@bga.com.py` é
proprietária da propriedade GA4, e o gtag.js está no site):

| Propriedade | Tipo |
| --- | --- |
| `https://bga.com.py/` | Prefixo de URL — **vinculada ao GA4** (fluxo "BGA - Site Institucional", stream 14909947289) |
| `https://www.bga.com.py/` | Prefixo de URL |

Duas porque o site responde nos dois endereços — ver o achado abaixo.

### 6.1 Risco: a verificação depende do gtag.js que este deploy remove

O Search Console avisa explicitamente: *"para continuar verificado, não remova o
código de acompanhamento gtag.js"*. O bloco 2 desta mesma leva de mudanças
troca o gtag pelo GTM. O container injeta a tag do Google por JavaScript, e não
há garantia de que o rastreador de verificação execute JS — ou seja, **a
verificação pode cair em silêncio depois do deploy**.

Correção, antes de subir: a metatag de verificação no `<head>`, que é HTML
estático e sobrevive a qualquer troca de tag. **Um único token serve para as
duas propriedades:**

```
xRgwoXvqZ4F2kniFvppJgwjxaClSzsNkz_WiAtQSO50
```

### 6.2 Achado: o site redireciona para `www`, mas se declara sem `www`

Verificado no navegador em 13/09/2026:

- `https://bga.com.py` → redireciona para `https://www.bga.com.py/`
- a própria página declara `<link rel="canonical" href="https://bga.com.py/">`
- o fluxo de dados do GA4 está cadastrado como `https://www.bga.com.py`
- o `app/layout.jsx` do catálogo usa `SITE_URL = 'https://bga.com.py'`

O servidor manda para um lado e o HTML aponta para o outro. O Google costuma
seguir o canônico, mas é sinal contraditório e não há motivo para mantê-lo.

**Decisão para o dia do deploy:** escolher um dos dois e fazer redirect e
canônico concordarem. O caminho de menor atrito é **sem `www`**, porque é o que
o código do catálogo já declara — bastaria configurar no Amplify o redirect de
`www` para a raiz, em vez do contrário. A alternativa (padronizar em `www`) exige
mudar o `SITE_URL` e a lista de hostname do `Analytics.jsx`.

Enquanto isso não se decide, as duas propriedades do Search Console existem e
nenhum dado de busca se perde.

### 6.3 Redirects — estado em 13/09/2026 e o que refazer no deploy

A caixinha "Setup redirect from bga.com.py to www" foi **desmarcada** no app do
`bga-site` (o antigo, que serve o domínio hoje). Verificado no navegador com
parâmetro anti-cache: `bga.com.py` já não redireciona para `www`, e `www` ainda
não redireciona para a raiz — ou seja, os dois hostnames servem o mesmo conteúdo
direto. Estado temporário, resolvido pela regra abaixo.

Regras do app antigo (`Hosting ▸ Rewrites and redirects`), nesta ordem:

```json
[
  { "source": "https://www.bga.com.py/<*>", "target": "https://bga.com.py/<*>", "status": "301", "condition": null },
  { "source": "/<*>", "status": "404-200", "target": "/index.html" }
]
```

A segunda é a que já existia e fica como está **enquanto o domínio servir o
bga-site** — é a regra de SPA, e o site antigo depende dela.

**No dia do deploy, ao apontar o domínio para o app do catálogo:** as regras não
migram entre apps. Recriar as duas no app novo, com uma diferença — a segunda
passa a ser:

```json
{ "source": "/<*>", "status": "404", "target": "/404.html" }
```

O catálogo é export estático com ~200 páginas HTML reais, não SPA. Manter
`404-200 → /index.html` ali produziria soft 404 (qualquer URL inexistente
devolvendo a home com status 200), esconderia o `app/not-found.jsx` e
inviabilizaria o item 10 da fila de bugs (404 identificável no GA4). O build já
gera `out/404.html`.
