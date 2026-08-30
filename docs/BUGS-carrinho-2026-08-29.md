# Bugs do carrinho — 29/08/2026

Ordem de ataque depois dos 3 briefs (ainda **não commitados** no momento em que
isto foi escrito). Um bug por commit — se quebrar, dá pra saber qual mudança foi.

**Passo 0, antes de tudo:** commitar o trabalho dos briefs. Os arquivos abaixo
(`app/cotacao/page.jsx`, `ProductSheet.jsx`) já estão modificados; misturar as
correções do carrinho no mesmo commit apaga a fronteira entre "reconstrução do
catálogo" e "conserto do carrinho".

---

## A ordem, e por quê

A ordem não é por incômodo, é por consequência: **primeiro o que corrompe o
pedido, depois o que incomoda.** O 1 é pré-requisito do 5 — sem linha com
identidade própria não há onde guardar a variante escolhida.
O 2 e o 3 são consertos de interface que só fazem sentido depois que a linha do
carrinho tiver identidade própria. O 4 não depende de ninguém — vai por último
por ser o único que não muda comportamento nem dado.

| # | Bug | Tipo | Estado |
| --- | --- | --- | --- |
| 1 | Variantes colapsam numa linha só | **dado** — o lead sai errado | ✅ feito 29/08 |
| 5 | Imagem e nome não seguem a variante | **dado** — o lead sai errado | ✅ feito 29/08 |
| 2 | Botão "Agregar" volta ao estado original | feedback | ⬜ próximo |
| 3 | Carrinho sem volta pro produto | navegação | ⬜ |
| 4 | `<select>` de variante fora do DS | estilo | ⬜ |

**Ordem de execução: 1 → 5 → 2 → 3 → 4.** Os dois primeiros são bugs de dado: o
pedido que chega na Aida sai errado. O resto é interface.

**1 e 5 saíram em 29/08**, num commit só (`fix: carrinho identifica a
configuração escolhida`) — estavam entrelaçados nos mesmos arquivos e separar
depois não valia o `git add -p`. Inclui a correção do vazio da tapa
(retângulo vazio em vez de foto legendada, ver seção 5).

---

## 1. Identidade da linha do carrinho 🔴 primeiro

**Sintoma (suas palavras):** seleciono outro variante ou ancho, agrego, e no
carrinho só aumenta a quantidade — não entra como produto novo.

**Causa:** `components/CartProvider.jsx:29` — o carrinho deduplica por
`product.id`, que é o id da **página**, não da configuração escolhida. O
`composedSKU` (variante · ancho · material · espesor), montado em
`ProductSheet.jsx:88`, entra só como campo do objeto e não participa da
identidade.

**Consequência real, que é pior que o sintoma:** na hora do merge, o
`CartProvider` mantém o objeto da **primeira** adição (`{ ...i, quantity: +1 }`).
Então a segunda configuração não só não vira linha nova — ela **desaparece**. O
carrinho, o preview do WhatsApp e a linha gravada na planilha da BGA mostram o
SKU da primeira escolha com quantidade 2. A Aida recebe um pedido de 2 unidades
de uma coisa que o cliente pediu uma. É bug de dado, não de UI.

**Junto, o mesmo defeito:** `ProductSheet.jsx:95` faz
`if (qty > 1) updateQuantity(product.id, qty)` — `updateQuantity` **atribui**, não
soma. Agregar 3 e depois mais 3 dá 3, não 6.

**Ponto de decisão (é escolha sua, não bug):** a ficha já vem com material e
espesor pré-selecionados, então adicionar da ficha sempre gera um `composedSKU`
com spec, enquanto adicionar da grade gera o SKU pelado. Com a correção, os dois
viram **linhas separadas** — o que está certo (uma tem spec, a outra é "a
confirmar"), desde que o carrinho mostre a configuração de cada linha. É o que o
prompt abaixo assume.

### Prompt pro Claude Code

```
No carrinho, a identidade da linha é o SKU composto, não o id da página.

Contexto do bug: CartProvider.addItem deduplica por product.id
(components/CartProvider.jsx:29). Quando o usuário escolhe outra variante ou
outro ancho na ficha e agrega, a linha existente só incrementa a quantidade e
mantém o objeto da PRIMEIRA adição — a segunda configuração some do carrinho, do
preview de WhatsApp e do payload que vai pra planilha. É bug de dado: o lead que
chega na vendedora fica errado.

Faça:

1. components/CartProvider.jsx
   - Cada item passa a ser { lineId, product, composedSKU, quantity, observation }.
   - lineId = composedSKU quando existir, senão product.id.
   - addItem(product, quantity = 1): dedupe por lineId; se já existe, SOMA a
     quantidade (não atribui); se não existe, cria linha nova.
   - removeItem / updateQuantity / updateObservation passam a receber lineId no
     lugar de productId.
   - updateQuantity continua ignorando qty < 1.
   - localStorage: trocar a chave 'bga-cart' por 'bga-cart-v2' e ignorar a
     antiga. Os ids de produto mudaram na reconstrução do catálogo — carrinho
     salvo antes disso apontaria pra página que não existe mais.

2. app/catalogo/[categoria]/[produto]/ProductSheet.jsx
   - handleAddToCart: addItem({ ...product, composedSKU }, qty) numa chamada só.
     Remover o updateQuantity de dentro do handler e o updateQuantity do
     useCart() se ficar sem uso.

3. components/AddToCartButton.jsx (grade, recomendados, subfamília)
   - O check `inCart` compara lineId. Sem composedSKU, lineId é product.id —
     comportamento atual preservado.

4. app/cotacao/page.jsx
   - key={lineId} no map; removeItem/updateQuantity/updateObservation recebem
     lineId.
   - Cada linha mostra a configuração escolhida: hoje o composedSKU aparece como
     texto mono; mantenha, mas garanta que duas linhas do mesmo produto com
     configs diferentes sejam visualmente distinguíveis.
   - buildMessage e o payload de registrarCotizacion já usam
     product.composedSKU ?? product.id — conferir que continuam pegando o SKU
     certo por linha.

5. components/CartBadge.jsx — count continua items.length (linhas distintas).

Não mexa em mais nada. Rode `npm run build` no final.
```

---

## 2. O "✓ Agregado" que volta ao normal 🟡 depois do 1

**Sintoma:** agrego e o botão volta pro estado original.

**Causa:** `ProductSheet.jsx:96-97` — `setAdded(true)` + `setTimeout(…, 2200)`.
É um flash de confirmação com timer, não estado. Passados 2,2 s a ficha não
lembra mais de nada.

**Por que isso só se resolve depois do 1:** hoje o botão não *tem* como saber se
o item está no carrinho — a única identidade disponível é `product.id`, e por
`product.id` a resposta seria "sim" mesmo depois de você trocar o ancho. Com
`lineId`, a pergunta certa passa a ter resposta: *esta configuração* está no
carrinho?

Isso muda o que a interface diz: quando você troca a variante, o botão **deve**
voltar a "Agregar a cotización" — porque agora é outra peça. Não é o bug; é o
comportamento correto que hoje acontece pelo motivo errado.

### Prompt pro Claude Code

```
Ficha de produto: o botão de cotização passa a refletir estado, não um timer.

Em app/catalogo/[categoria]/[produto]/ProductSheet.jsx:

- Remover o setTimeout de 2200ms e o state `added`.
- Ler do carrinho a linha cujo lineId bate com o composedSKU atual.
- Se NÃO estiver no carrinho: "Agregar a cotización" (como hoje).
- Se estiver: rótulo "✓ En tu cotización (N)" com N = quantidade da linha, e
  logo abaixo um link discreto "Ver cotización →" pra /cotacao.
- O botão continua clicável nesse estado: clicar de novo soma a quantidade atual
  do seletor à linha existente.
- Trocar variante, ancho, material ou espesor muda o composedSKU e portanto o
  lineId — o botão volta sozinho pra "Agregar a cotización". É o comportamento
  desejado, não regressão.

Copy em espanhol. Rode `npm run build` no final.
```

---

## 3. Voltar do carrinho pro produto 🟡

**Sintoma:** no carrinho não consigo voltar pro último produto que eu estava,
nem abrir o produto da lista.

**Causa:** `app/cotacao/page.jsx` — o breadcrumb da linha 89 vai pra
`/catalogo` (a grade inteira, não de onde você veio) e os itens da lista
(linha 115 em diante) são `<div>`, sem link. O objeto do carrinho tem
`product.categoryId` e `product.id`, ou seja, a rota
`/catalogo/{categoryId}/{id}/` já está inteira ali dentro — só não é usada.

São duas voltas diferentes e as duas faltam: **voltar de onde vim** (corrigir o
que acabei de agregar) e **abrir um item da lista** (revisar spec de qualquer
linha). A segunda é a que mais importa: revisar antes de mandar é a função da
página.

### Prompt pro Claude Code

```
Página de cotização: dar caminho de volta pro produto.

Em app/cotacao/page.jsx:

1. Cada item da lista vira link pra ficha: envolver o thumb + nome + SKU num
   <Link href={`/catalogo/${product.categoryId}/${product.id}/`}>. Os controles
   de quantidade, o input de observação e o botão de remover ficam FORA do link.
   Estado de hover discreto no card.

2. Voltar pro último produto visitado: em ProductSheet.jsx, gravar em
   sessionStorage ('bga-last-product') { href, name } no mount da ficha. Na
   página de cotização, se existir, o breadcrumb do topo vira
   "← Volver a {name}"; se não existir, mantém "← Catálogo".
   Ler no useEffect, nunca na render — o build é export estático.

3. Manter o "+ Agregar más productos" no fim da lista como está.

Copy em espanhol. Rode `npm run build` no final.
```

---

## 4. O `<select>` de variante fora do DS 🟢 independente

**Sintoma:** o seletor de "Modelo / variante" está grudado na direita e o
selecionado usa o azul do sistema, não o azul escuro do DS.

**Causa:** `ProductSheet.jsx:228` é o único `<select>` do projeto sem tratamento
— nativo puro. Os outros três já seguem o padrão do DS:

| Onde | Tratamento |
| --- | --- |
| `LandingPage.jsx:322` (rubro do form da LP) | `appearance: none` + chevron Phosphor em wrapper · foco `--bolt` |
| `ProductFinder.jsx:81` (¿No sabés por dónde empezar?) | mesmo padrão, via `landing.module.css` |
| `cotacao/page.jsx:226` (rubro) | mesmo padrão em Tailwind · foco `brand-primary` |
| **`ProductSheet.jsx:228` (variante)** | **nenhum** — chevron e foco do navegador |

Por isso o chevron cola na borda (é o do sistema, com a métrica dele) e a borda
fica azul no foco (é o `:focus` do UA). Não é bug de CSS solto: é o único lugar
onde o padrão não foi aplicado.

**Divergência do DS — resolvida em 29/08, não é bug:** o foco na LP é **amarelo**
(`--bolt`, `border-color` + halo `rgba(255,198,0,.1)`); no catálogo é **azul
escuro** (`brand-primary`). A Yuki confirmou: o amarelo da LP foi escolha
deliberada da época, pra chamar atenção no formulário. **A LP fica como está.**
A regra do DS passa a ser: foco amarelo em formulário de captação (LP), azul
escuro nos controles de configuração do catálogo. Registrar no DS do Figma.

**O que dá pra controlar e o que não dá — importante antes de prometer:**

- **Controle fechado** (borda, chevron, altura, foco): 100% estilizável. É o que
  o prompt abaixo faz, e resolve os dois sintomas que você apontou.
- **Lista aberta** (o realce da opção enquanto o menu está aberto): renderizada
  pelo SO, não pelo CSS da página. `accent-color` influencia no Chromium em
  Windows/Linux; no macOS o popup é nativo e tende a ignorar. **Não confirmei
  isso nesta versão do Chrome** — vale testar antes de dar como resolvido. Se o
  realce da lista aberta precisar ser da marca sem exceção, o caminho é um
  listbox custom (div + teclado + ARIA), que é bem mais trabalho que um fix de
  CSS. Não recomendo agora.

**Onde entra na ordem:** independente dos bugs 1–3, e o bloco do `<select>` não é
tocado por nenhum deles. Deixe por último, como `fix:` isolado — ou pegue
primeiro se quiser um commit de aquecimento antes do refactor do carrinho.

**Decisão de escopo, uma linha:** hoje são 4 selects e 3 implementações. Ou você
copia o padrão pela quarta vez (prompt abaixo, commit pequeno), ou extrai um
`components/SelectField.jsx` e converte os dois de Tailwind (ficha + cotização),
deixando os dois de CSS module quietos. A segunda opção evita a quinta
divergência. O prompt faz a primeira; peça a segunda se preferir.

### Prompt pro Claude Code

```
O <select> de variante da ficha é o único do projeto fora do padrão de DS.
Aplicar nele o mesmo tratamento que app/cotacao/page.jsx:226 já usa.

Em app/catalogo/[categoria]/[produto]/ProductSheet.jsx, no bloco do
"Modelo / variante" (~linha 228):

1. Envolver o <select> numa div `relative`.
2. No select: `appearance-none pr-9 focus:outline-none focus:border-brand-primary
   transition-colors cursor-pointer`, mantendo o resto das classes atuais.
3. Chevron próprio, idêntico ao da /cotacao — SVG Phosphor 14x14 dentro de
   `<div className="pointer-events-none absolute inset-y-0 right-2.5 flex
   items-center">` com `className="text-text-muted"` no svg.
4. Acessibilidade, no mesmo commit: hoje o <label> não está associado ao select.
   Dar id="variante" ao select e htmlFor="variante" ao label.

Em app/globals.css, no :root: `accent-color: #131E29;` (ocean-900) — tentativa de
levar o realce da lista aberta pro azul do DS. Comentar na linha que o efeito
depende do SO/navegador e não vale no popup nativo do macOS.

Não mexer nos outros três selects do projeto (LandingPage.jsx, ProductFinder.jsx,
cotacao/page.jsx). Rode `npm run build` no final.
```

**Como conferir:** lado a lado com o select de "Rubro" da `/cotacao` — fechados,
os dois têm que ficar idênticos. A lista aberta pode continuar com o realce do
sistema; se ficar, é o limite descrito acima, não o fix falhando.

---

## 5. Imagem e nome não seguem a variante (achado em 29/08, depois do fix 1)

**Sintoma:** escolho a tapa, parece que mudou, mas a imagem continua a da
bandeja — e no carrinho fica confuso.

**É maior que a imagem.** No carrinho da captura há duas linhas `CT3211`, que são
**tapas**, e as duas aparecem como:

- foto da bandeja (`cotacao/page.jsx` renderiza sempre `product.images.primary`)
- título "Bandeja Portacables" (`product.name`, que é o nome da *página*)
- a palavra "Tapa" não aparece em lugar nenhum — só codificada no `CT3211`

E vaza pro lead: `buildMessage()` monta `• {SKU} — {product.name} · {qtd} un`, e
o `bga-leads-apps-script.gs:80` monta a linha da planilha com o mesmo `it.nombre`.
**A Aida recebe "CT3211-500 — Bandeja Portacables · 2 un" para uma tapa.** Mesma
classe do bug 1: dado errado no pedido, não enfeite.

**Causa na ficha:** `ProductSheet.jsx:60-62` — a imagem principal depende de
`galleryTab`, um estado manual de miniatura, e nunca de `selectedVariant`. Há
dois controles para a mesma coisa (o seletor de variante e as miniaturas
Pieza/Tapa) e eles não conversam. O `isTapa` já existe na linha 38, só não é
usado para escolher a imagem.

**Restrição de conteúdo — verificada no `catalog.json`, não é palpite:** 22
páginas têm variante de tapa; **só 10 têm render de tapa**. Faltam 12:

`curva-horizontal-recta-90` · `curva-vertical-externa-45` ·
`curva-vertical-interna-45` · `curva-horizontal-45` · `te-horizontal-recto` ·
`te-vertical-ascendente` · `union-cruzeta-recta` · `desnivel-simple` ·
`desvio-horizontal-derecho` · `desvio-horizontal-izquierdo` ·
`reduccion-lateral-derecha` · `reduccion-lateral-izquierda`

Nessas 12, mostrar a foto da peça quando a tapa está escolhida é exatamente o que
confundiu a Yuki.

**Decisão (revisada em 29/08, com a Yuki): retângulo vazio, não foto legendada.**
A primeira proposta era manter a foto da peça com legenda. Está errada, e o
motivo é o próprio bug: o que confundiu não foi a foto errada, foi a foto **não
mudar** ao trocar de variante — a interface disse "não aconteceu nada". Legenda
é o elemento menos lido da tela e não corrige isso; um placeholder corrige,
porque ele muda e o que ele afirma é verdade. No carrinho a legenda nem cabe:
a miniatura tem 56 px, e a foto da bandeja ali é o erro original de novo.

Duas condições para o vazio ler como estado e não como falha:

- **Texto específico.** O genérico que já existe na ficha ("Imagen disponible
  próximamente") diz que o produto não tem foto — falso, tem. Tem que dizer o
  que falta: `Tapa — imagen en preparación`.
- **Mesmo bloco de vazio já usado na ficha** (glifo `⬡` a 10% + texto), para ler
  como estado do sistema, não como imagem que falhou ao carregar.

Efeito colateral desejável: 12 tapas sem render viram 12 buracos visíveis, e
buraco visível vira pedido para o Akira — junto com as 3 imagens de texto
queimado já listadas no `ESTADO`.

**Quem carrega o peso:** com 12 páginas sem render, é a **palavra** que
desambigua, não a foto. Por isso o prompt trata o rótulo como obrigatório e a
imagem como melhoria.

**Zero mudança no Apps Script:** ele monta a linha da planilha a partir do
`it.nombre` que o site manda. Enriquecendo o `nombre` no cliente, a planilha da
BGA já sai certa — sem redeploy do script.

### Alcance — auditei as 36 fichas ativas, não é só a tapa

Hoje só `bandejas` está em modo `catalog`: **36 fichas**, 23 com variantes, 34
com eixos, todas com `images.primary`. A perda de informação no carrinho tem
**três formas**, e a tapa é só a mais visível:

**a) Tapa (22 páginas).** Nome e imagem erradas. Render de tapa existe em 10.
É o caso que você viu.

**b) Variantes de peça (mesmas 22 páginas, 4 variantes cada).** Lisa Tipo U,
Lisa Tipo C, Perforada Tipo U, Perforada Tipo C — **as quatro compartilham o
mesmo e único render da página**. Duas linhas no carrinho com a mesma foto, o
mesmo título e diferença só no código (`CT3011` vs `CT3111`). Aqui **imagem
nenhuma resolve**: teria que existir render por variante, 4 por página × 22
páginas. Não vale. **Só o rótulo resolve** — e é por isso que o fix trata a
palavra como obrigatória e a imagem como melhoria.

(Exceção parcial: `bandeja-portacables` tem os diagramas de corte U e C em
`product.secciones`. Dava pra usar como miniatura de variante, mas cobre U vs C,
não lisa vs perforada. Fica de melhoria opcional, não entra agora.)

**c) Eixos, material e espesor (34 páginas).** O ancho e o ala escolhidos só
existem dentro do SKU composto — o carrinho não os mostra em palavra nenhuma. O
material e o espesor aparecem abreviados (`AISI304 · #14`). Quem confere o
pedido antes de enviar lê código, não lê spec.

**Landmine, ainda não ativa — vale saber:** `ST2239` (perfilados) e `KIT5262`
(escaleras) usam **outro schema de variante** — `{ code, attributes }` em vez de
`{ sku, label, role }`. O `ProductSheet` lê `v.sku` e `v.label`, então nessas
páginas o dropdown renderiza opções em branco e nunca seleciona nada. **Não
quebra nada hoje**, porque `perfilados` e `escaleras` estão em `displayMode:
'pdf'` e não têm rota de ficha. Quebra silenciosamente no dia em que uma dessas
famílias virar `catalog`. Está no prompt como normalização defensiva.

### Prompt pro Claude Code

```
A configuração escolhida tem que aparecer no carrinho em palavras — hoje ela só
existe dentro do SKU composto, e a variante some por completo.

Contexto: a página se chama "Bandeja Portacables" e tem 5 variantes (4 peças +
Tapa). Quem escolhe a tapa vê no carrinho a foto da bandeja, o título "Bandeja
Portacables" e nenhuma menção a tapa; quem escolhe Lisa Tipo C vê exatamente a
mesma linha que Perforada Tipo U. A mesma perda vai pro WhatsApp e pra planilha
do cliente, porque buildMessage e o payload usam product.name.

1. lib/products.js — duas funções puras, para o carrinho e a ficha usarem o
   mesmo texto:
   - buildLineTitle(product, variant): variant.role === 'tapa'
     → `Tapa para ${product.name}`; senão product.name.
   - buildConfigLabel({ variant, axes, material, gauge, globalSpecs }): string
     legível em espanhol, partes separadas por " · ", omitindo o que não existe.
     Ex: "Lisa Tipo C · Ancho 500 mm · Ala 150 mm · Acero inoxidable AISI 304 ·
     Espesor #14". Usar os `name` de globalSpecs.materials e o `label`/`unit` de
     dimensionAxes — nada de abreviação nova.
   - Mover buildComposedSKU do ProductSheet pra cá também, para os três textos
     (SKU, título, config) saírem do mesmo lugar.
   - normalizeVariant(v): aceita { sku, label, role } e o schema antigo
     { code, attributes } → { sku: v.sku ?? v.code, label: v.label ?? (valores
     de attributes juntados por " · "), role: v.role ?? 'pieza' }. Aplicar na
     leitura das variantes. ST2239 e KIT5262 usam o schema antigo e hoje
     renderizariam opções em branco — não estão roteados, mas não deixe a bomba
     armada.

2. app/catalogo/[categoria]/[produto]/ProductSheet.jsx
   - Imagem principal derivada da seleção: kit byAla (atual) > variante com
     role 'tapa' e images.tapa existente > images.primary.
   - Escolher variante role 'tapa' faz setGalleryTab('tapa'); voltar pra 'pieza'
     faz setGalleryTab('primary'). Miniaturas continuam clicáveis pra comparar.
   - Variante tapa sem images.tapa: NÃO mostrar images.primary. Renderizar o
     mesmo bloco de estado vazio que a ficha já usa quando não há imagem (glifo
     ⬡ a 10% + texto), trocando o texto por "Tapa — imagen en preparación".
     A imagem tem que MUDAR ao trocar de variante: é a mudança que comunica.
     São 12 páginas nessa situação.
   - Nesse caso, meta.image vai como null (ver item 3).
   - handleAddToCart passa meta:
     { image: mainImageSrc, imageAlt: mainImageAlt,
       title: buildLineTitle(product, selectedVariant),
       configLabel: buildConfigLabel({...}) }

3. components/CartProvider.jsx
   - addItem(product, quantity = 1, meta = {}) — a linha guarda também
     { image, imageAlt, title, configLabel }. Sem meta, tudo undefined e o
     comportamento atual continua (grade, recomendados, subfamília).

4. app/cotacao/page.jsx — cada linha passa a mostrar, nesta ordem:
   - SKU composto (mono, como hoje)
   - título: item.title ?? product.name
   - configLabel numa linha abaixo, no estilo hoje usado por product.dimensions
     (mesmo tamanho e cor). Quando não houver configLabel, cai no
     product.dimensions atual.
   - thumb: quando a linha tem meta, usar EXATAMENTE item.image — se for null,
     mostrar o bloco "sin imagen" que já existe, nunca cair em
     product.images.primary (foto da bandeja numa linha de tapa é o bug
     original). O fallback para product.images?.primary vale só para linhas
     antigas/sem meta, vindas da grade.
   - buildMessage: a linha do WhatsApp usa item.title, não product.name. O
     configLabel NÃO entra na mensagem — o SKU composto já carrega a spec e a
     mensagem precisa ficar curta.
   - registrarCotizacion: o campo `nombre` de cada item usa item.title.
     NÃO mexer em docs/bga-leads-apps-script.gs — ele monta a linha da planilha
     a partir de it.nombre, então isso já resolve do lado do site.

Copy em espanhol. Rode `npm run build` no final.
```

**Como conferir, nesta ordem:**

1. `bandeja-portacables`: agregar Lisa Tipo C e Perforada Tipo U, mesmo ancho.
   Duas linhas com títulos iguais mas `configLabel` diferente — é o caso (b), o
   que a imagem não resolve.
2. Mesma página: agregar a Tapa. Título "Tapa para Bandeja Portacables" e a foto
   da tapa (essa página tem render).
3. `curva-horizontal-45`: agregar a Tapa. Ao selecionar a tapa a imagem tem que
   **trocar** para o vazio "Tapa — imagen en preparación" — é uma das 12 sem
   render. No carrinho, essa linha fica com a miniatura vazia e o título
   "Tapa para Curva Horizontal 45°".
4. Vista previa WhatsApp: a linha da tapa precisa dizer "Tapa para …".

---

## 6. Threads já desbloqueadas (não são bugs)

Estavam travadas pelos briefs 1 e 2 no `ESTADO-2026-08-29.md`, thread 1. **Os
briefs saíram — estão livres**, e mexem nos mesmos arquivos dos bugs 1–3:

- `CartBadge` invisível com carrinho vazio + `aria-hidden` / `tabIndex={-1}` —
  já tem decisão sua ("carrinho sempre aparece") e uma pergunta em aberto (vazio
  apagado ou só sem contador)
- estado vazio da `/cotacao`, que diz "vazio" duas vezes e não explica o
  mecanismo

Entram nesta rodada ou na seguinte — em commit separado, de qualquer forma.
