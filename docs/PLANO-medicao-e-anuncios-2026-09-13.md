# Plano de medição e anúncios — catálogo BGA

Data: 13/09/2026 · antes do deploy em bga.com.py

Decisões tomadas nesta sessão: GTM entra agora (antes do deploy), contas ficam
na conta Google da BGA, Meta é o canal mais provável mas nada está fechado, e a
vendedora só preenche o `Estado` que já existe — sem valor fechado.

---

## 1. O que já existe no código (auditado, não suposto)

| Item | Estado |
|---|---|
| GA4 via gtag direto em `components/Analytics.jsx` | ✅ funciona, `G-3PF2RG7WNG` |
| Guarda por hostname (`bga.com.py`, `www.`) + `NODE_ENV` | ✅ evita medir preview do Amplify |
| `lib/analytics.js` — `track()` no-op seguro | ✅ medição nunca derruba a página |
| Eventos instrumentados | ✅ `ver_familia`, `ver_producto`, `agregar_cotizacion`, `cotizacion_enviada`, `click_whatsapp` |
| Gravação persist-first do lead (Apps Script → Sheets) | ✅ `lib/leads.js`, grava antes de abrir o WhatsApp |
| Aba `Cotizaciones` com `Estado / Contactado el / Propuesta el / Notas` | ✅ métricas de processo já possíveis |
| GTM | ❌ não existe |
| UTM / gclid / fbclid chegando no lead | ❌ o lead grava sem nenhuma origem |
| Parâmetros como dimensão no GA4 (`familia`, `sku`, `origen`…) | ❌ são enviados, mas não aparecem em relatório |
| Filtro de tráfego interno | ❌ pendente (falta IP do Akira) |
| Evento de busca e de início de cotização | ❌ não existem |

**O buraco que importa:** hoje, se a BGA anunciar amanhã, o pedido cai na
planilha sem nenhuma marca de onde veio. Dá pra ver no GA4 que houve uma
cotização vinda do Google — mas não dá pra apontar *qual linha da planilha* é
aquela cotização. Sem isso, "qual anúncio deu mais retorno" não tem resposta,
por mais bem configurado que o GA4 esteja.

---

## 2. Fase 0 — código, antes do deploy (1 prompt pro Code)

Está tudo em `PROMPT-medicao-gtm-2026-09-13.md`, em inglês, pronto pra colar.
Sete blocos, um commit cada:

1. **`Analytics.jsx` vira loader do GTM.** Mantém as duas guardas atuais e
   ganha uma terceira saída: se a URL tiver `gtm_debug`, o container carrega
   mesmo fora do domínio — é o que permite testar no preview do Amplify.
   O `G-3PF2RG7WNG` passa a ser configurado dentro do GTM.
2. **`lib/analytics.js` empurra pro `dataLayer`** em vez de chamar `gtag`.
   Assinatura igual, nomes de evento iguais — nenhum call site muda.
3. **`lib/attribution.js` (novo).** Captura `utm_*`, `gclid`, `fbclid`,
   `gbraid/wbraid`, referrer e página de entrada no `localStorage`, validade de
   90 dias. Regra: *último toque pago vence* — se chegar campanha nova,
   sobrescreve; se a pessoa voltar direto, mantém a anterior.
4. **Atribuição entra no lead** — no carrinho (`/cotacao`) e no formulário da
   home. Cinco campos: fonte, meio, campanha, click id, página de entrada.
5. **Apps Script ganha 5 colunas no fim** de `HEADERS_COTIZACIONES`.
   No fim de propósito: `Estado` é a 12ª coluna e já quebrou uma vez quando
   alguém inseriu campo no meio.
6. **Três eventos novos, e só três:** `buscar_catalogo` (o que o comprador
   digita que o catálogo não tem é a pauta de produto do Akira),
   `iniciar_cotizacion` (separa quem abriu o carrinho de quem enviou — é a
   taxa de abandono do formulário) e `click_linea_nueva` (o selo "Nueva
   línea" da home funcionou ou não).
7. **Seção 7 da política de privacidade atualizada** — já cita cookies, passa
   a citar GTM e, genericamente, etiquetas de publicidade. Escrito agora pra
   que ligar o pixel da Meta depois não exija um deploy de texto legal.

> Não sou advogada e não verifiquei a legislação paraguaia de proteção de
> dados. O texto cobre o que a prática comum pede; se a BGA quiser afirmar
> conformidade com lei específica, isso precisa passar por quem responde por
> isso lá.

---

## 3. Fase 1 — contas e configuração (sem deploy)

**Passo 0 — resolvido (13/09):** o `G-3PF2RG7WNG` é da conta da BGA e o fluxo de
dados é o próprio `bga.com.py`. Não há migração a fazer e não se cria
propriedade nova: o catálogo assume o mesmo domínio, então herda a propriedade,
o histórico da landing antiga e a guarda de hostname que já está no código. O
container do GTM nasce nessa mesma conta Google.

Dois efeitos, os dois bons. Existe **linha de base**: o tráfego da landing antiga
vira termo de comparação pro catálogo, coisa que projeto novo quase nunca tem. E
o dia da troca de domínio precisa ficar **anotado** — data do deploy no doc de
medição e uma anotação dentro do GA4, se a propriedade tiver o recurso (acho que
sim, confirmar na tela). Sem isso, daqui a três meses ninguém entende por que as
métricas de página mudaram de patamar de um dia pro outro.

**GTM** — container `GTM-M9CWZQV8`, criado em 13/09 na conta da BGA:

- 1 tag Google Tag (GA4) → `G-3PF2RG7WNG`, trigger Initialization – All Pages.
- 1 tag GA4 Event só, não uma por evento: nome do evento = `{{Event}}`,
  parâmetros vindos de Data Layer Variables. Trigger Custom Event com regex
  cobrindo os 8 nomes. Uma tag pra manter em vez de oito.
- Variáveis de camada de dados: `familia`, `sku`, `sku_compuesto`, `producto`,
  `origen`, `cantidad`, `items`, `unidades`, `rubro`, `termino`, `resultados`.

**GA4:**

- Dimensões personalizadas com escopo de evento: `familia`, `sku`, `producto`,
  `origen`, `rubro`, `termino`, `sku_compuesto`. Sem isso os parâmetros são
  coletados mas não aparecem em nenhum relatório — é o erro clássico.
  (Existe teto de dimensões por propriedade; acredito que sejam 50 de escopo de
  evento no plano gratuito, mas confirmar na tela — usamos 7, folga grande de
  qualquer jeito.)
- Eventos-chave: `agregar_cotizacion`, `cotizacion_enviada`, `click_whatsapp`.
  Só dá pra marcar depois que o evento aparece com tráfego **real** — Preview
  não conta. Se não der pra marcar no dia da configuração, é dependência
  bloqueada, não item esquecido.
- Filtro de tráfego interno: IP do Akira + o teu + o escritório da BGA, estado
  **Ativo** (não "Testando").
- Retenção de dados: 14 meses.
- Fluxo de dados nomeado como o domínio, cobrindo subdomínio futuro.

**Validação antes de considerar pronto:** Preview do GTM + DebugView do GA4,
percorrendo o fluxo inteiro — home → família → ficha → agregar → enviar — e
conferindo que cada evento chega com os parâmetros preenchidos. Depois, uma
cotização de teste real e a conferência de que a linha na planilha traz as
colunas de origem preenchidas.

---

## 4. Fase 2 — preparar campanha (ainda sem gastar)

**Convenção de UTM** (a decisão mais barata e a mais fácil de estragar depois):

```
utm_source   = google | meta | instagram | linkedin
utm_medium   = cpc | paid_social | organic_social
utm_campaign = bga_{linha}_{objetivo}_{aaaamm}
utm_content  = {criativo}          ej. video_malla_a, carrusel_medidas_b
utm_term     = {palabra}           (Google Ads preenche sozinho)
```

Exemplos: `bga_alambre_lanzamiento_202610`, `bga_bandejas_catalogo_202610`.
A linha entra no nome da campanha porque é o que separa o retorno da linha nova
do resto sem depender de mais nada.

**Google Ads:** auto-tagging ligado (é o `gclid`, que o passo 3 já captura) e
importação de conversão via GA4 — não precisa de tag nova no site.

**Meta:** quando decidir, o pixel entra pelo GTM, sem deploy. O `fbclid` já vai
estar sendo capturado desde o dia 1, mesmo sem pixel instalado.

**Destinos:** `/catalogo/bandejas-de-alambre` pra campanha da linha nova,
`/catalogo/bandejas` pro carro-chefe do Akira, home pra marca. A LP em português
de exportação, quando existir, vira o quarto destino com campanha própria.

---

## 5. Fase 3 — ler o retorno (rotina mensal, ~20 min)

Duas fontes, cruzadas pela campanha:

1. **GA4** responde *tráfego e comportamento*: quantas sessões cada campanha
   trouxe, quantas chegaram na ficha, quantas adicionaram ao carrinho, quantas
   enviaram. É aí que se vê o anúncio que traz clique e não traz pedido.
2. **Planilha** responde *o que aconteceu com o pedido*: tabela dinâmica
   `Campaña` × `Estado`. Pedidos, contactados, propostas, fechados.

Conferência de saúde: o número de `cotizacion_enviada` no GA4 e o número de
linhas novas na aba devem andar juntos. Se o GA4 marcar mais, tem lead se
perdendo no webhook ou bloqueador de anúncio comendo o evento — vale investigar
antes de tirar qualquer conclusão de campanha.

**O limite honesto desta configuração:** sem valor fechado na planilha, o
ranking que dá pra montar é *qual campanha trouxe mais pedidos e fechou mais
deles* — não retorno em guaraníes. Pra ir além, bastaria uma coluna `Valor` que
a Aida preenche no fechamento; fica registrado aqui como a próxima peça, não
como pendência desta entrega. Enquanto isso, se ela escrever `Valor: X` na
coluna `Notas`, dá pra extrair depois sem mudar nada.

---

## 6. A linha nova (bandeja de alambre)

Não precisa de instrumentação separada. Todo evento do catálogo já carrega
`familia`, e `bandejas-de-alambre` é o id. No momento em que `familia` virar
dimensão personalizada (Fase 1), o funil inteiro passa a se abrir por linha de
graça: quantos viram, quantos entraram na ficha, quantos cotaram.

O que é específico da linha:

- `click_linea_nueva` no selo da home — responde se o selo puxa gente.
- Campanha com a linha no nome, isolando o resultado.
- O que a busca interna revelar: se comprador paraguaio digitar "malla" ou
  "rejilla" e não "alambre", isso muda o SEO e o texto do anúncio. É o tipo de
  dado que só aparece depois do tráfego real — e é barato de olhar.

---

## 7. Checklist de fechamento

Código (Fase 0)

- [ ] GTM carregando em produção, gtag removido, sem contagem dupla
- [ ] `dataLayer` recebendo os 8 eventos com parâmetros
- [ ] Atribuição capturada e chegando nos dois formulários
- [ ] 5 colunas novas no fim da aba `Cotizaciones`
- [ ] Política de privacidade atualizada

Contas (Fase 1)

- [ ] Container GTM criado na conta Google da BGA (a propriedade GA4 já está lá)
- [ ] Data do deploy registrada no doc + anotação no GA4
- [ ] 7 dimensões personalizadas criadas
- [ ] 3 eventos-chave marcados (ou registrado que falta tráfego real)
- [ ] Filtro de tráfego interno Ativo, com o IP do Akira
- [ ] Retenção 14 meses
- [ ] Preview + DebugView percorridos no fluxo inteiro
- [ ] Cotização de teste com origem gravada na planilha

Campanha (Fase 2)

- [ ] Convenção de UTM escrita e combinada
- [ ] Conta de Google Ads da BGA criada e vinculada ao GA4
- [ ] Decisão sobre Meta e, se sim, pixel no GTM
