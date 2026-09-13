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

## 3. Configuração do GTM (a fazer na interface do Tag Manager)

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

- [ ] Tags, triggers e variáveis do GTM criados na interface (seção 3 acima)
- [ ] 7 dimensões personalizadas criadas no GA4
- [ ] 3 eventos-chave marcados (depende de tráfego real pós-deploy)
- [ ] Filtro de tráfego interno Ativo, com o IP do Akira
- [ ] Retenção 14 meses configurada
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
