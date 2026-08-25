# BGA — Catálogo digital

Catálogo B2B navegável com carrinho de cotação. Cliente: **BGA Electric S.A.**
(Minga Guazú, Paraguai) — indústria metalúrgica: bandejas porta-cabos, escadas,
perfilados, caixas e gabinetes elétricos.

Next.js 14 (App Router) · Tailwind · React Context + localStorage · interface em
espanhol. Arquitetura multi-tenant: catálogo novo = copiar projeto + trocar
`client.config.js`.

> Estado deste documento: **2026-08-25**. Escrito como handoff — quem abre este
> projeto sem contexto anterior deve conseguir continuar só com o que está aqui.

---

## 1. As regras que não se negociam

Vêm da spec `faro-catalogo-cotizacion` e do posicionamento da Faro. Se um pedido
contradisser qualquer uma, aponte o conflito antes de implementar.

1. **Persist-first.** O pedido de cotação grava na planilha **antes** de abrir o
   WhatsApp. O `wa.me` abre o WhatsApp do visitante — se ele não apertar enviar,
   o pedido não existe em lugar nenhum. Gravar primeiro é o que transforma o
   artefato em prova.
2. **Todo nível tem caminho até a cotação.** Grade, página de família e ficha
   técnica: todas têm "Agregar a cotización". Produto sem botão de cotação é o
   erro nº 1 da régua de teardown da própria Faro.
3. **Se roda 24/7, não entra.** Sem WordPress, CMS, painel de administração,
   banco de dados, n8n, WhatsApp Cloud API, bot, checkout. A Faro vende trabalho
   pontual; a stack não pode mentir sobre isso. Pedido desse tipo = "Fase 2",
   nomeada, nunca item de menu.
4. **Nada na conta da Faro.** Domínio, hospedagem, conta Google do Sheets e do
   GA4, e os arquivos-fonte são do cliente. Sempre.
5. **Não é carrinho de compra.** É carrinho de cotação: monta a lista e entrega
   pro vendedor. Não processa pagamento e não deve parecer que processa.
6. **O formulário nunca pune quem não sabe.** Quem cota costuma ser comprador ou
   administrativo de obra, não quem especificou. Campo de spec é sempre opcional.

---

## 2. Decisão de lançamento

**Só a família Bandejas entra no ar. As outras cinco continuam em PDF.**

É coerente: Bandejas é a única família com `richDescription`, intent cards,
tabela de material e 4 FAQ com Schema JSON-LD. As outras usam fallback.

---

## 3. Estado real dos dados (medido em 2026-08-24)

`lib/catalog.json` — 72 produtos em 6 famílias:

| Família | Produtos | SEO completo |
| --- | --- | --- |
| bandejas | 26 | ✅ rich + 4 FAQ + 4 intent cards |
| perfilados | 30 | ❌ fallback |
| escaleras | 14 | ❌ fallback |
| tableros (Cajas) | 1 | ❌ fallback |
| gabinetes | 1 | ❌ fallback |
| aramados | 0 | ❌ vazia |

Dentro de Bandejas (os 26 que vão subir):

- **13 têm algum dado de spec** (eixos, variantes)
- **13 estão completamente vazios** — só nome e página do PDF:
  `CT3012 · CT3111 · CT3112 · CT3062 · CT3063 · CT3064 · CT3065 · CT3066 ·
  CT3067 · CT3069 · CT3070 · CT3071 · KIT3062`
- **0 têm `shortDescription` ou `subtitle`**
- **Todos os 72 produtos estão com `image: null`** — ver seção 5

---

## 4. O que foi feito em 2026-08-24 (e o que falta validar)

Antes desta data o catálogo **não gravava lead nenhum e não media nada**. O
`handleSend` abria o `wa.me` e acabava; não havia `gtag` no projeto.

### Arquivos novos

| Arquivo | O quê |
| --- | --- |
| `lib/leads.js` | `registrarCotizacion()` — POST pro Apps Script |
| `lib/analytics.js` | `track()` — wrapper no-op-safe do gtag |
| `components/Analytics.jsx` | injeta o GA4 (nada se `gaMeasurementId` for null) |
| `components/TrackView.jsx` | dispara evento de view a partir de página server-side |
| `docs/bga-leads-apps-script.gs` | Apps Script v2, com `doPost` |
| `docs/RUNBOOK-planilha-na-conta-do-cliente.md` | migração da planilha (ver seção 6) |

### Arquivos modificados

`app/cotacao/page.jsx` · `app/layout.jsx` · `app/catalogo/[categoria]/page.jsx` ·
`app/catalogo/[categoria]/[produto]/ProductSheet.jsx` ·
`components/AddToCartButton.jsx` · `client.config.js`

### Detalhe que parece bug e não é

Em `handleSend`, `registrarCotizacion()` é chamado **sem `await`**. Proposital:
esperar quebraria o vínculo com o clique do usuário e o navegador bloquearia o
`window.open` como popup. O que garante o envio é `keepalive: true`. **Não
"conserte" isso adicionando await.**

### Eventos GA4 instrumentados

`ver_familia` · `ver_producto` · `agregar_cotizacion` (com `origen: grilla|ficha`) ·
`cotizacion_enviada` · `click_whatsapp`

### ⚠️ Não verificado

**O `npm run build` não foi rodado.** A sintaxe dos 11 arquivos passou em
checagem, mas o build completo não. **Rodar antes de qualquer deploy.**

---

## 5. Pendências, na ordem

### 5.1 Planilha e Apps Script na conta da BGA ✅ CONCLUÍDO EM 2026-08-24

Antes disso, os leads do cliente caíam no Drive pessoal da Yuki — nos dois
frontends. Violava a regra 4 e era o estado real, não hipótese: verificado no
HTML servido por `www.bga.com.py`.

**O que foi feito:**

1. Planilha + Apps Script v2 criados na conta da BGA, implantados como app da
   web com "Executar como: Eu (BGA)" e "Quem pode acessar: Qualquer pessoa"
2. `LEAD_FORM_SECRET` configurado com **o mesmo valor de antes** — por isso só a
   URL mudou nos dois arquivos, e o `SHEET_SECRET`/`leadWebhookSecret` ficou
   intacto
3. `client.config.js` deste projeto → URL nova
4. `~/Desktop/Projects/bga-site/index.html` linha 981 → URL nova, commitado e
   publicado pelo Amplify

**Valores atuais:**

| | |
| --- | --- |
| Apps Script | `…/macros/s/AKfycbxy68QuMRE9JbJ--B9QucS2VScqwu8Ex4mCFyxd5dBUvURDkgpRV9FXXGrXaQ1tB5CDng/exec` |
| Segredo | `c1e7ac2ebfb800939f8224d87f275ec9727b33fb3551f85b` (inalterado) |
| GA4 | `G-3PF2RG7WNG` — propriedade já era da conta da BGA |

**Verificações feitas:**

- A implantação nova responde `forbidden` sem chave, `bad_request` com a chave e
  sem campos, e `ok` com um lead completo — ou seja, está pública, o segredo bate
  e grava de verdade *(ficou uma linha `TESTE FARO` na primeira aba; apagar)*
- `www.bga.com.py` serve o HTML novo desde `25 Aug 2026 01:07 GMT`: contém
  `AKfycbxy…`, não contém mais `AKfycbz22…`
- O carrinho do catálogo gravou na aba `Cotizaciones` em ambiente local

⚠️ **Ainda falta:** mandar um lead real pelo formulário do site publicado e
confirmar a linha na planilha da BGA. E **não apagar a planilha nem o script
antigos** até ver lead real chegando no lugar novo por alguns dias — o `no-cors`
esconde falha de gravação, e o único sintoma seria silêncio.

### Onde a landing page mora (resolvido)

`~/Desktop/Projects/bga-site`, versionada em `github.com/yukiregina/bga-site.git`,
branch `main`. **O Amplify do cliente puxa do git** — commit é deploy. Produção
responde `server: AmazonS3` via CloudFront, consistente com Amplify. A Vercel não
serve nada (o deploy não funcionou com o domínio `.com.py`).

Duas cópias antigas da LP existem no disco e **não** são a fonte editável:

| Arquivo | Situação |
| --- | --- |
| `bga-catalogo/reference-lp:/index.html` | cópia byte-idêntica ao que estava publicado até 24/08 — serve como referência do `<head>`, não se edita |
| `…/Faro comercial/…/lp-site-antiga-vercel/` | versão divergente e mais antiga. Descartável, exceto como histórico. O `DEPLOY.md` dela está desatualizado (fala de Vercel e zip) |

Se o catálogo unificado substituir a LP (ver 5.1c), o `bga-site` se aposenta e a
edição passa a ser só no `client.config.js` deste projeto.

### 5.1b Publicar o catálogo no Amplify — não dá como está 🔴

Decisão da Yuki (24/08): o catálogo vai pro Amplify, junto com a LP. Correto
pela regra 4 — é a nuvem que o cliente já usa. Mas **hoje este projeto não
exporta estático**, e sem isso o deploy vira hospedagem SSR: um servidor
rodando 24/7 na conta AWS da BGA, com custo por requisição e versão de Node pra
manter. Isso contraria a regra 3 e a receita-mestre da Faro ("Next.js exportado
estático · não tem o que atualizar · sem servidor").

Três bloqueios concretos, todos no código:

| Onde | O quê | Por que impede |
| --- | --- | --- |
| `next.config.mjs` | vazio, sem `output: 'export'` | o build gera app de servidor |
| `app/catalogo/[categoria]/page.jsx:6` e `[produto]/page.jsx:1` | `export const dynamic = 'force-dynamic'` | força render por requisição |
| `app/catalogo/page.jsx:8-10` e `[categoria]/page.jsx:20-22` | `searchParams` (`?q=`, `?page=`) | `searchParams` não existe em página exportada |

Também não há `generateStaticParams` em nenhuma rota dinâmica — obrigatório pra
exportar `[categoria]` e `[categoria]/[produto]`.

**O conserto é pequeno e vale a pena:**

1. Tirar os dois `force-dynamic`
2. Adicionar `generateStaticParams` nas duas rotas dinâmicas — os dados são
   locais (`lib/catalog.json`), então é enumerar 6 famílias e 72 produtos
3. Trocar `searchParams` por estado no cliente: a busca já tem componente
   client (`ProductFinder.jsx`); a paginação (18/página) pode simplesmente sair
   do v1 — Bandejas tem 26 SKUs e é a única família que sobe
4. `output: 'export'` no `next.config.mjs`

Resultado: arquivos estáticos, mesmo modelo da LP que já roda em S3 +
CloudFront. Zero servidor, zero mensalidade, nada com babá.

### 5.1c Onde o catálogo vai morar — JÁ DECIDIDO: subpasta, não subdomínio

Decisão registrada em **2026-06-22**, em
`~/claude cowork/Faro comercial/clientes/BGA/04-catalogo/NOTA_Arquitetura_LP_Catalogo.md`
— seção "Por que unificar (e não subdomínio)":

- **SEO:** catálogo em subpasta (`/catalogo`) no domínio principal concentra a
  autoridade. Subdomínio fragmenta.
- **PDF → HTML é o ganho maior:** PDF quase não ranqueia nem é citado por IA.
  Cada produto vira página indexável (long-tail local, ex.: "bandeja
  portacables galvanizada Paraguay").
- **Deploy simplifica:** um repo, um app no Amplify, um domínio.

O plano da nota: o `bga-catalogo` vira o **site inteiro**. A LP vira a home
(`app/page.jsx` → `components/LandingPage.jsx`, feito em 05/07/2026), o catálogo
fica em `/catalogo`, e os botões de "baixar catálogo" viram links internos.
O deploy do `bga-site` se aposenta.

**Consequência prática: sem `basePath` e sem `assetPrefix`.** O app serve a raiz
do domínio.

**Como fazer em etapas sem subdomínio:** o Amplify dá uma URL própria a cada app
(`*.amplifyapp.com`). Publicar lá, conferir tudo — home, catálogo, carrinho,
gravação na planilha, eventos GA4 — e só então apontar `bga.com.py` para o app
novo. Assim o lançamento é escalonado sem criar um subdomínio que depois teria
que ser desfeito com redirect.

> A nota fala em "SSR/SSG em cada página" como requisito de SEO. **SSG (export
> estático) atende inteiramente** — as páginas saem em HTML completo, crawláveis.
> A pendência da nota "confirmar compatibilidade do Next com o SSR do Amplify"
> deixa de existir com export estático.

### 5.2 Testar a gravação de ponta a ponta 🟡 quase lá

Com `mode: 'no-cors'` o navegador **não vê erro nenhum**. Tudo parece funcionar
mesmo quando nada grava. O único teste válido é olhar a planilha.

- ✅ Carrinho do catálogo → aba `Cotizaciones`, em ambiente local
- ✅ Implantação nova respondendo e gravando (testada direto pela URL)
- ⬜ **Lead real pelo formulário do site publicado** → primeira aba da planilha
  da BGA. É o único que ainda falta, e é o que fecha a migração

Se algo não aparecer, checar nesta ordem: implantação está em "Quem pode
acessar: Qualquer pessoa"? foi criada **nova versão** depois da última edição do
código (editar o `Code.gs` não publica — ver runbook, Parte 5)? o
`LEAD_FORM_SECRET` bate com o `leadWebhookSecret`? E o log de **Execuções**, na
barra lateral do editor do Apps Script, diz se o pedido chegou: sem linha ali, o
problema é URL ou permissão, não código.

### 5.3 Imagens dos produtos 🟡

Todos os 72 produtos estão com `image: null`.

**As imagens já existem.** No Drive da BGA:
`Compartilhados comigo › BGA - YUKISAN › 36. Catálogo`
(`https://drive.google.com/drive/u/0/folders/1SoTNVzWVuwHUZHmELEqGNSaciiywCano`)

17 subpastas: `BGA_productos_pt1`…`pt13`, `BGA_productos_revision1`,
`BGA_Encina`, `Bandejas_frontal`, `2024 con laser`.

Não são fotos: são **renders técnicos 3D com cotas, fundo branco, um produto por
arquivo**. Para bandeja e perfilado isso é melhor que foto. **Não extrair
desenho do PDF — já está pronto e é o arquivo original do cliente.**

O que falta é o **mapeamento SKU → arquivo**. Os arquivos se chamam
`BGA_productos_pt1_page-0001.jpg` — nomeados por página, não por SKU. O
`catalog.json` tem um campo `page` por produto, mas **não está confirmado** que
as duas numerações batem (uma é página do PDF inteiro, a outra é página dentro
de cada parte). Precisa olhar.

Arquivos soltos na raiz da pasta do Drive são duplicata ("Mano Francesa" em cinco
formatos, imagens de WhatsApp). O conteúdo bom está nas subpastas.

Começar por Bandejas: 26 SKUs, não 72.

### 5.4 As 13 fichas de Bandejas sem spec 🟡

Lista na seção 3. Fonte provável: o PDF em
`public/docs/catalogo-bga-bandejas-portacables-paraguay-2025-2026.pdf`.

### 5.5 Pedido pro Akira 🟢

Só depois de 5.3 e 5.4. O princípio das duas vezes que isso apareceu:
**inverter o pedido.** Nunca "preencha a planilha" / "mande as fotos" — sempre
"confere o que eu já preenchi e me manda só o que é novo". Planilha vazia com
campo obrigatório é lição de casa; rascunho preenchido é revisão.

O catálogo está parado desde julho esperando a planilha de SKUs. A causa
provável não é desinteresse: é que o pedido chegou como um template de 6 abas
× 100 linhas em branco.

---

## 6. Fase 2 — nomear, nunca construir

Fora do v1, citar como "Fase 2 com mensalidade" se o cliente pedir: login de
cliente, integração com ERP, nutrição automática, wizard "¿no sabe qué
necesita?", bot qualificador, multi-idioma (cada idioma é um projeto).

Resposta padrão pra qualquer um: **"ainda não fazemos isso."**

---

## 7. Briefs prontos para executar

Duas tarefas já escritas em `docs/`, **para rodar separadas** — se algo quebrar,
precisa dar pra saber qual mudança causou:

| Brief | O quê |
| --- | --- |
| `docs/BRIEF-export-estatico.md` | destravar o `output: 'export'` (ver 5.1b) |
| `docs/BRIEF-home-e-navegacao.md` | header unificado + paridade de SEO da home nova |

Uma correção pendente no segundo brief: ele manda deixar o `CartBadge` sempre
visível na home, junto do botão "Solicitar cotización". São **dois CTAs
concorrendo** — dois botões que dizem a mesma coisa e vão pra lugares
diferentes. A regra melhor: **o carrinho é estado, não CTA** — vazio não
renderiza; com item, aparece e passa na frente, porque aí é intenção quente e
não competição. Confirmar com a Yuki antes de mandar o Code executar.

---

## 8. Referências

- Skill `faro-catalogo-cotizacion` — a spec completa do artefato (modelo de
  dados, carrinho, formulário, persist-first, medição, Fase 2)
- Skill `faro-posicionamento` — o porquê: o que a Faro vende e pra quem
- `~/claude cowork/Faro comercial/CLAUDE OUTPUTS/faro-estrategia-producao-sites.md`
  — stack, hospedagem, propriedade, garantia
- `~/claude cowork/Faro comercial/clientes/BGA/04-catalogo/CONTEXTO-BGA-catalogo.md`
  — histórico do projeto até 28/05
- Figma DS: https://www.figma.com/design/zBYIfeFd62zRkXhhHhe0uU/DS-BGA

**Contatos BGA:** Marcos Akira Hattori (decisor) · Aida (vendedora que recebe os
leads) · WhatsApp +595 974 733 100 · ventas@bga.com.py
