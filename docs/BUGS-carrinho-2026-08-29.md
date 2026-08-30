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
| 2 | Agregar só existe onde há configuração | feedback + qualidade do lead | ✅ feito 30/08 |
| 3 | Carrinho sem volta pro produto + configuração na URL | navegação + link compartilhável | ⬜ |
| 4 | `<select>` de variante fora do DS | estilo | ⬜ |
| 7 | Busca não acha SKU, nem sem acento | **produto** — ensina que o site não tem | ⬜ |
| 8 | Recomendados fora de hora + diagramas U/C com peso de botão | layout | ✅ feito 30/08 |
| 8c | Complemento colado no CTA | layout | ⬜ próximo |
| 9 | Abas da ficha são conteúdo global repetido 36× | conteúdo | ⬜ em aberto (design) |
| 10 | 404 sem identificação no GA4 + beco sem saída | medição | ⬜ baixa, útil na troca de domínio |
| 11 | Política de privacidade não existe neste projeto | **lançamento** | 🔴 antes de trocar o domínio |
| 12 | GA4 dispara em dev — localhost polui os dados do cliente | medição | ⬜ rápido |

**Ordem de execução: 1 → 5 → 2 → 3 → 4.** Os itens 7 e 8 nasceram do brainstorm
de 30/08 e são independentes da fila — o 7 é o de maior valor do que sobrou. Os dois primeiros são bugs de dado: o
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

## 2. Agregar só existe onde a configuração existe 🟡 depois do 1

Cresceu no brainstorm de 30/08 e virou uma regra, não um conserto de botão:
**a ação de agregar só deve existir onde dá para configurar a peça.**

**Sintoma original:** agrego na ficha e o botão volta pro estado original.
`ProductSheet.jsx:96-97` — `setAdded(true)` + `setTimeout(…, 2200)`. É flash com
timer, não estado. Passados 2,2 s a ficha não lembra mais de nada.

**O que o brainstorm acrescentou.** O botão da grade (`AddToCartButton`) agrega
sem configuração nenhuma. Fui contar: das **36 fichas ativas, 34 exigem ancho e
ala**, e nenhuma delas tem `dimensions` fixas; as outras 2
(`salida-horizontal-electroducto`, `salida-lateral-perfilado`) também não — e a
primeira tem 9 variantes de diâmetro. Ou seja: **em 36 de 36, agregar pela grade
produz uma linha sem spec nenhuma.** Não existe um caso em que o botão do card
gere pedido completo. Agora que a linha do carrinho mostra a configuração em
palavras (item 5), essas linhas aparecem visivelmente vazias — e é a Aida que
paga, ligando pra perguntar tudo.

O botão da grade não é atalho, é vazamento. Sai dos três lugares e o
`AddToCartButton.jsx` vira código morto.

**Cor — decidido.** A grade já fazia amarelo → azul escuro; quem estava fora do
padrão era a ficha, que nasce azul e só pisca. Unifica no que já existia:
`brand-accent` → `brand-primary` ao agregar. Com a grade sem amarelo nenhum, o
CTA da ficha vira a coisa mais alta da página, que é onde ele deve estar.

**O que não pode cair no chão.** Os 36 botões eram a principal superfície que
*ensinava* que existe carrinho de cotação. Some com eles e a descoberta some
junto — e hover não ensina nada no celular. A resposta não é manter 36 botões
repetindo mal a mesma coisa: é **dizer uma vez, bem**, numa frase abaixo do H1.
Ela entra no mesmo commit que tira os botões — não se abre um buraco prometendo
tapar depois.

**Ainda aberto, e é decisão sua:** o `CartBadge` também é `brand-accent`. Com o
CTA da ficha amarelo, ficam dois amarelos disputando a mesma tela. Um acento por
tela. Isso encosta na thread 1 do `ESTADO` (estado vazio do badge), que já está
desbloqueada — vale resolver as duas juntas, num commit à parte deste.

### Prompt pro Claude Code

```
Duas mudanças ligadas: o botão de cotização da ficha passa a refletir estado, e
a ação de agregar sai dos cards de produto.

Contexto: agregar pela grade produz uma linha de carrinho sem configuração
nenhuma — em 36 de 36 fichas do catálogo ativo, porque 34 exigem ancho e ala e
as outras 2 têm variantes. A ficha é o único lugar onde a peça pode ser
configurada, então é o único lugar onde "agregar" deve existir.

1. app/catalogo/[categoria]/[produto]/ProductSheet.jsx — botão como estado
   - Remover o state `added` e o setTimeout de 2200ms.
   - Ler do carrinho a linha cujo lineId bate com o composedSKU atual.
   - Fora do carrinho: "Agregar a cotización", bg-brand-accent /
     text-brand-primary (hoje é bg-brand-primary — é essa troca).
   - No carrinho: "✓ En tu cotización (N)", N = quantidade da linha,
     bg-brand-primary / text-white. Abaixo, link discreto "Ver cotización →"
     para /cotacao.
   - O botão segue clicável nesse estado: clicar de novo soma a quantidade atual
     do seletor à linha existente.
   - Trocar variante, ancho, material ou espesor muda o composedSKU e o lineId,
     então o botão volta sozinho para "Agregar a cotización". É o comportamento
     desejado, não regressão.

2. Tirar o AddToCartButton dos cards de produto, nos três lugares:
   app/catalogo/[categoria]/page.jsx, components/CatalogPageClient.jsx,
   components/RecommendedProducts.jsx e
   app/catalogo/[categoria]/[produto]/SubfamilyView.jsx.
   Depois disso components/AddToCartButton.jsx fica sem uso — deletar o arquivo.

3. O card inteiro vira um único link para a ficha
   (/catalogo/{categoryId}/{id}/), envolvendo imagem, SKU, nome e subtexto.
   - Um <a> só: nada de <Link> aninhado. Os <Link> separados de imagem e de
     título somem, absorvidos pelo link do card.
   - Hover: borda brand-accent + leve elevação (shadow-sm). O mesmo tratamento
     em :focus-visible — hover sozinho não existe no teclado nem no toque.
   - O título mantém peso e cor; perde o hover:underline próprio, que agora é
     do card.
   - Os cards ficam mais baixos sem o botão. Não compensar com padding: a grade
     mais densa é o ganho.

4. Uma frase abaixo do H1, em espanhol, explicando o mecanismo — nas duas
   páginas que tinham botão de agregar na grade (/catalogo e a página de
   família). Algo como: "Armá tu lista de productos y pedí cotización — te
   respondemos por WhatsApp." Uma linha, não um parágrafo. Ela substitui a
   descoberta que os botões faziam.

5. GA4: o evento agregar_cotizacion com origen: 'grilla' deixa de existir, e
   isso é esperado — toda adição passa a vir da ficha, com spec. Não criar
   evento substituto.

Não mexer no CartBadge (fica para outro commit). Copy em espanhol.
Rode `npm run build` no final.
```

**Como conferir:** na grade, o card inteiro clica e não há mais botão; na ficha,
agregar deixa o botão azul escuro com a contagem e ele **fica** assim; trocar o
ancho devolve o amarelo. E a frase abaixo do H1 aparece nas duas páginas.

---

## 3. Voltar do carrinho pro produto — com a configuração junto 🟡

**Sintoma:** no carrinho não dá pra voltar pro último produto que eu estava, nem
abrir o produto da lista.

**Causa:** o breadcrumb da `/cotacao` vai pra `/catalogo` (a grade inteira, não de
onde você veio) e os itens da lista são `<div>`, sem link. O objeto da linha tem
`product.categoryId` e `product.id` — a rota já está ali dentro, só não é usada.

São duas voltas diferentes e as duas faltam: **voltar de onde vim** (corrigir o
que acabei de agregar) e **abrir um item da lista** (revisar spec de qualquer
linha). A segunda é a que mais importa: revisar antes de mandar é a função da
página.

### A armadilha que o próprio item 1 criou (vista em 30/08)

Linkar a linha para a ficha "crua" não basta. A pessoa clica em "Tapa para Curva
Horizontal 45° · Ancho 500" e cai numa ficha com a configuração **padrão** —
nenhuma variante escolhida, ancho 50. E como o botão passou a refletir estado
**por configuração** (item 2), ele vai dizer "Agregar a cotización", como se
aquilo não estivesse no carrinho. A pessoa agrega de novo e ganha uma linha
duplicada.

É a mesma classe de bug da sessão inteira — estado que mente — e foi o nosso
`lineId` que a criou.

**Solução escolhida: a configuração viaja na URL.** O link do carrinho carrega
`?variante=…&ancho=…&ala=…&material=…&espesor=…`; a ficha lê no mount e se monta
igual. A volta fica sem perda, o botão diz a verdade sozinho.

**O ganho maior não é o carrinho.** Com a ficha também *escrevendo* a
configuração na URL enquanto a pessoa configura, qualquer configuração vira
**link compartilhável**: a Aida manda pro cliente a peça exata já montada, e o
cliente abre e agrega. Isso vale mais para a vendedora do que a volta do carrinho
vale para o comprador. É `history.replaceState`, não navegação — não polui o
histórico nem re-renderiza a rota.

**Nota de implementação:** ler `window.location.search` dentro de `useEffect`, não
`useSearchParams()`. Com `output: 'export'`, `useSearchParams` exige fronteira de
Suspense e quebra o build sem ela — e como a página é estática, o parâmetro só é
conhecido no cliente de qualquer forma.

### Prompt pro Claude Code

```
A configuração escolhida passa a viajar na URL da ficha, e o carrinho ganha
caminho de volta.

Contexto: hoje a linha do carrinho não é clicável, e se fosse levaria para uma
ficha com a configuração padrão — onde o botão diria "Agregar a cotización"
mesmo com aquela peça já no carrinho, porque o estado do botão é por
configuração (lineId). Resultado seria linha duplicada.

1. app/catalogo/[categoria]/[produto]/ProductSheet.jsx — ler configuração da URL
   - Num useEffect de mount, ler window.location.search (NÃO usar
     useSearchParams: com output 'export' ele exige fronteira de Suspense e
     quebra o build).
   - Parâmetros, em espanhol, batendo com os rótulos da interface:
     variante (sku da variante), material (id), espesor (gauge), e um por eixo
     usando o próprio id do eixo: ancho, ala.
   - Validar tudo contra os dados do produto: variante precisa existir em
     product.variants; valor de eixo precisa existir em ax.values; material em
     globalSpecs.materials; espesor em globalSpecs.thicknesses. Valor inválido
     ou ausente = mantém o default atual. Nunca confiar na URL.

2. Mesma ficha — escrever a configuração na URL
   - Sempre que variante, eixo, material ou espesor mudarem, atualizar a query
     com history.replaceState (não router.push: não queremos navegação nem
     entrada nova no histórico).
   - Só os parâmetros que têm valor. Sem variante escolhida, sem variante= na
     URL.
   - Isso faz de qualquer configuração um link compartilhável — é intencional.

3. components/CartProvider.jsx — a linha guarda a configuração estruturada
   - No meta do addItem, além de image/imageAlt/title/configLabel, guardar
     config: { variante, axes, material, espesor } com os valores crus.
   - ProductSheet.handleAddToCart passa esse config.

4. app/cotacao/page.jsx — linha clicável
   - O bloco de thumb + SKU + título + configLabel vira um <Link> para
     /catalogo/{product.categoryId}/{product.id}/ com a query montada a partir
     de item.config (quando existir; linha sem config linka sem query).
   - Os controles de quantidade, o input de observação e o botão de remover
     ficam FORA do link.
   - Estado de hover discreto no card e o mesmo tratamento em :focus-visible.

5. Voltar pro último produto visitado
   - Em ProductSheet, gravar em sessionStorage ('bga-last-product')
     { href, name } no mount da ficha — href já com a query da configuração.
   - Na /cotacao, se existir, o breadcrumb do topo vira "← Volver a {name}";
     se não existir, mantém "← Catálogo". Ler no useEffect, nunca na render.

6. Manter o "+ Agregar más productos" no fim da lista como está.

Copy em espanhol. Rode `npm run build` no final.
```

**Como conferir:** agregar uma tapa com ancho 500, ir ao carrinho, clicar na
linha. A ficha tem que abrir com a variante Tapa e o ancho 500 já selecionados, e
o botão tem que dizer "✓ En tu cotización (1)" — não "Agregar". Depois copiar a
URL da barra de endereço, abrir em aba anônima e confirmar que a mesma
configuração aparece.

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

---

## 7. A busca não encontra quase nada 🔴 alto valor

**Causa:** o filtro compara a query com `p.name` e mais nada
(`CatalogPageClient.jsx:16`). Rodei consultas reais contra o catálogo:

| busca | resultados |
| --- | --- |
| `bandeja perforada 200mm` — **o exemplo do próprio placeholder** | **0** |
| `CT3011` | **0** |
| `CT3211` | **0** |
| `reduccion` (sem acento) | **0** |
| `reducción` (com acento) | 3 |
| `curva 90` | **0** |
| `tapa` | **0** |
| `bandeja` | 1 |

O `ProductFinder` da home promete "bandeja perforada 200mm" no placeholder e essa
busca devolve zero. Os códigos não aparecem porque vivem em `variants[].sku`, e
os ids das páginas viraram slugs na reconstrução. E ninguém digita acento numa
caixa de busca.

Num distribuidor elétrico, onde o cliente do Akira pede por código, uma busca que
não acha `CT3011` é **pior que não ter busca** — ela ensina "esse site não tem".

**Duas metades, e a ordem importa:** primeiro *o que* a busca casa, depois *onde*
existe caixa. A caixa na página de família (que o repeat user precisa, porque
`/catalogo/bandejas` hoje é grid puro sem busca) só vale se o match funcionar.

### O índice enxuto — decidido em 30/08, e é o ponto que não pode ser adiado

O `catalog.json` (150KB, 87 entradas) **vai inteiro pro bundle do cliente**: está
no chunk `476-*.js`. Bandejas populada custa ~2,3KB por página. Com as outras
famílias entrando, a conta cresce linear — ~460KB a 200 páginas, perto de 1MB a
400. Baixado por quem abriu o site pra ver **uma** peça.

Escrever a busca em cima de `getAllProducts()` prende o catálogo inteiro no
bundle **para sempre** — a busca vira a razão pela qual tudo precisa estar lá.
Escrever contra um índice enxuto custa o mesmo hoje e é o que impede isso.
~150-250 bytes por página em vez de 2.300; 400 páginas ≈ 80KB.

### Prompt pro Claude Code

```
A busca do catálogo só compara a query com product.name, e por isso não acha
código de SKU, não acha sem acento e não acha frase com mais de uma palavra.
Hoje "CT3011", "reduccion", "curva 90", "tapa" e o próprio exemplo do
placeholder ("bandeja perforada 200mm") devolvem zero resultados.

1. Índice enxuto, gerado no build — não usar o catalog.json no cliente
   - scripts/build-search-index.mjs: lê lib/catalog.json e escreve
     lib/search-index.json com uma entrada por ficha (type 'producto', só
     famílias em displayMode 'catalog'):
     { id, name, categoryId, categoryName, haystack }
     onde haystack é uma string única, já normalizada, juntando: nome,
     subtitle, id com hífens virando espaço, sku da página, e de cada variante
     o sku/code e o label, mais os valores de cada dimensionAxis.
   - package.json: "prebuild": "node scripts/build-search-index.mjs".
     (Roda sozinho antes do build; evita índice velho por esquecimento.)
   - Sem dependência nova. É leitura de JSON e escrita de JSON.

2. lib/search.js — função pura, sem importar catalog.json
   - normalize(s): minúsculas + remover acentos (NFD + ̀-ͯ),
     e tokens numéricos perdem o sufixo "mm" ("200mm" → "200").
   - searchProducts(query, { categoryId } = {}): quebra a query em tokens por
     espaço; casa quem tiver TODOS os tokens no haystack; filtra por
     categoryId quando passado. Importa lib/search-index.json, nunca
     lib/catalog.json.

3. components/CatalogPageClient.jsx passa a usar searchProducts. Para renderizar
   o card do resultado, usar os campos do índice — não puxar o produto inteiro
   do catálogo, senão o bundle volta a carregar tudo. Se o card precisar da
   imagem, acrescentar images.primary ao índice no passo 1.

4. Caixa de busca na página de família (/catalogo/[categoria])
   - Extrair o grid para um client component, como já foi feito em
     CatalogPageClient.
   - Input acima do grid, escopado na família:
     searchProducts(q, { categoryId: categoria }).
   - Placeholder honesto: "Buscar en {família} — nombre o código".
   - Sem resultado: "No encontramos nada en {família}" + link
     "Buscar en todo el catálogo" para /catalogo?q={q}.
   - Estado vazio da query = grid completo, como hoje.

Casos de teste que precisam passar (todos devolvem 0 hoje):
  CT3011 → bandeja-portacables
  CT3211 → bandeja-portacables (é o SKU da variante Tapa)
  reduccion → as 3 páginas de redução, sem acento
  curva 90 → as curvas de 90°
  tapa → as páginas que têm variante de tapa
  bandeja perforada 200mm → bandeja-portacables
  200 → páginas cujo eixo ancho inclui 200

Rode `npm run build` no final e confirme que o chunk que hoje carrega o
catálogo não cresceu.
```

---

## 8. Dois ajustes na ficha (achados em 30/08)

### 8a. Recomendados estão no lugar errado da página

Hoje a ordem é: card → `longDescription` → `RecommendedProducts` → FAQ. O
complemento aparece depois da descrição longa de SEO.

Olhando o dado: em `bandeja-portacables`, `recommended` é `['kit-de-uniones']`.
Isso **não é "você também pode gostar"** — é *"você precisa disso pra instalar"*.
Complemento, não alternativa. E complemento tem hora: logo depois de agregar.

**Não vai para a coluna esquerda** (a Yuki perguntou e desconfiou sozinha, com
razão): a coluna tem 260px, o card viraria miniatura ilegível; e aquela coluna é
*esta peça* — outro produto ali mistura identidade. No mobile as colunas
empilham, então cairia logo abaixo da imagem principal, cortando a configuração
antes de a pessoa ter configurado nada.

O movimento é vertical: subir `RecommendedProducts` para logo abaixo do card,
antes da `longDescription`, e trocar o título "Productos recomendados" por algo
que diga a relação — "Para instalar esta pieza". `recommended` existe em 35 das
fichas, então é sistêmico.

### 8b. Os diagramas Tipo U / Tipo C parecem clicáveis e não são

Eles não são fotos do produto — são a **legenda do select acima deles**. Quem não
sabe o que é Tipo U precisa deles para escolher no dropdown. Por isso ficam onde
estão: mover para a coluna da imagem os desconecta da escolha que explicam e os
faz competir com o render da peça.

O que incomoda é o peso: dois cards grandes, com borda e fundo, parecendo o lugar
onde se clica — logo abaixo de um select que ainda diz "Seleccioná modelo y
tipo…". Parecem controle e são legenda.

Clicáveis seria pior: com 4 variantes de peça (Lisa U, Lisa C, Perforada U,
Perforada C), clicar em "Tipo U" é ambíguo.

`secciones` existe em **1 das 36 páginas** (`bandeja-portacables`). É caso
especial na página principal, não componente de sistema — não vale redesenhar o
controle de variante por causa dela.

**Correção do diagnóstico (30/08): não encolher os diagramas.** A primeira ideia
era reduzir para ~48px. Errada. Medindo os arquivos: são 1400×990 e **o desenho
ocupa 56% da largura e 27% da altura** — o resto é branco. No contêiner de 56px
com `object-contain`, o traço renderiza com **~15px**. Não é o contêiner que está
pequeno, é a moldura vazia que encolhe o traço. Recortando no traço (proporção
~3:1), o mesmo espaço rende ~50px de desenho — 3,3× maior, sem mexer no layout,
e o arquivo até diminui (4,2KB → 2,8KB). Nada de lupa: seria maquinário para um
desenho de linha de 4KB.

**E os dois diagramas hoje são indistinguíveis.** A diferença entre U e C é o
**retorno na ala** — a dobra para dentro no topo — e são 3,2% dos pixels,
concentrados na borda superior fina, a primeira coisa que some a 15px. A Yuki
confirmou que não via diferença. Por isso o rótulo passa a dizer também em
palavra: **"Tipo U — alas rectas"** e **"Tipo C — alas con retorno"**, que é o
que a `richDescription` da família já afirma. Desenho pequeno + palavra resolve;
desenho pequeno sozinho, não.

### Prompt pro Claude Code

```
Dois ajustes de layout na ficha de produto.

1. app/catalogo/[categoria]/[produto]/page.jsx
   - Mover <RecommendedProducts> para logo depois de <ProductSheet>, antes do
     bloco de longDescription.
2. components/RecommendedProducts.jsx
   - Título passa de "Productos recomendados" para "Para instalar esta pieza".
     O campo `recommended` do Sheet é complemento de instalação, não alternativa.
3. app/catalogo/[categoria]/[produto]/ProductSheet.jsx — bloco product.secciones
   - Mantém a posição (logo abaixo do select de variante): é legenda do select.
   - Tira o peso de card: sem borda, sem fundo. NÃO encolher o diagrama — os
     arquivos foram recortados na margem branca e agora têm proporção ~3:1;
     deixe-os ocupar a largura disponível de cada metade, com altura livre.
   - Rótulo em duas partes, porque o desenho sozinho não distingue os perfis:
     "Tipo U — alas rectas" e "Tipo C — alas con retorno", em text-text-muted.
   - Não tornar clicável.

Copy em espanhol. Rode `npm run build` no final.
```

---

## 8c. O complemento sobe para debaixo do botão (30/08, depois do 8)

O 8a subiu o `RecommendedProducts` para logo depois do card. Ainda é longe: as
abas ficam entre o botão e ele. A Yuki pediu o complemento **colado no CTA** — e
os dados dizem que ele nem devia ser uma seção.

**Contagem nas 36 fichas ativas:** 33 têm **exatamente 1** recomendado, 2 têm 2, e
1 não tem nenhum (`kit-de-uniones`, que é ele próprio o complemento dos outros).
Hoje isso ocupa seção de largura total, com `<h2>` e scroller horizontal —
mobília para um card só.

**Vira uma tira compacta dentro da coluna direita**, logo abaixo do CTA. É onde a
pergunta "e as uniões?" nasce: no segundo seguinte ao "agregar".

**Continua link para a ficha, nunca botão de agregar** — o `kit-de-uniones` tem
eixo de `ala` e imagem por ala, ou seja, também precisa de configuração. Mesma
regra do item 2: agregar só existe onde dá para configurar.

### Prompt pro Claude Code

```
O produto recomendado vira uma tira compacta logo abaixo do CTA da ficha, dentro
da coluna direita. Hoje é uma seção de largura total com h2 e scroller, e 33 das
36 fichas têm um único recomendado — mobília demais para um item.

1. app/catalogo/[categoria]/[produto]/page.jsx
   - Remover o <RecommendedProducts> que está entre <ProductSheet> e o bloco de
     longDescription.
   - Passar a lista para a ficha: <ProductSheet ... recommended={recommendedProducts} />

2. components/RecommendedProducts.jsx — vira tira compacta
   - Sem <section>, sem <h2>, sem scroller horizontal.
   - Rótulo pequeno "Para instalar esta pieza" (text-[11px], text-text-muted).
   - Uma linha por item, ocupando a largura disponível: thumb ~36px, nome do
     produto, seta → à direita. Dimensionar para 1 ou 2 itens, não para lista.
   - Cada linha é um <Link> para /catalogo/{categoryId}/{id}/, com hover de borda
     brand-accent e o mesmo tratamento em :focus-visible, igual aos cards.
   - Lista vazia continua não renderizando nada.

3. app/catalogo/[categoria]/[produto]/ProductSheet.jsx
   - Aceitar a prop `recommended` e renderizar a tira logo depois do bloco dos
     CTAs (quantidade + Agregar) e ANTES do link "¿Dudas técnicas?".
   - Não transformar em botão de agregar: a peça recomendada também precisa de
     configuração própria. Só link para a ficha dela.

Copy em espanhol. Rode `npm run build` no final.
```

---

## 9. As abas da ficha são conteúdo global repetido 36 vezes — em aberto

Levantamento de 30/08, ainda **sem decisão**:

- **Especificaciones:** 33 de 36 fichas têm **zero** linhas próprias
  (`dimensions`, `features`, `note`, `unidadVenta` vazios — as medidas dessas
  peças vivem nos eixos ancho/ala, no configurador). Sobram Familia, Proceso de
  unión e Tolerancia de espesor, e os dois últimos são globais.
- **Materiales y Tratamientos:** é `globalSpecs.surfaceTreatments` — idêntico nas 36.
- **Normas:** array escrito à mão dentro do JSX — idêntico nas 36.
- `gs.joiningProcess` aparece **duas vezes**, na aba Especificaciones e de novo
  na Materiales.

Três abas prometendo profundidade técnica e entregando texto que se repete em 36
páginas. Fechar por padrão (a ideia inicial da Yuki) esconderia o problema em vez
de resolvê-lo.

**Caminho proposto:** manter na ficha só o que é daquela peça — nas 3 páginas que
têm algo — e linkar para `/materiales-y-tratamientos`, que já existe e diz tudo
isso uma vez. Nas outras 33 a tira de abas não aparece, e o `joiningProcess`
duplicado some junto.

**Por que está parado:** as abas foram povoadas nos briefs pensando em conteúdo
indexável. Tirá-las remove texto do HTML de 36 páginas. A leitura do Claude é que
bloco repetido em 36 páginas quase não soma para SEO e que uma página forte
linkada por 36 é o padrão — mas isso **não foi verificado em fonte atual**. Se
SEO for a aposta principal do catálogo, olhar o Search Console antes.

---

## 11. Política de privacidade — some na troca de domínio (30/08)

**Contexto, corrigido:** `bga.com.py` serve o projeto **`bga-site`** (a landing
antiga). O `bga-catalogo` **nunca foi publicado** — não é deploy quebrado, é
decisão da Yuki de não colocar o catálogo no ar ainda. O GA4 dispara porque o
`bga-site` usa a mesma propriedade (`G-3PF2RG7WNG`), então os 404 que aparecem no
relatório vêm de lá, não daqui.

**O que isso revela:** `https://bga.com.py/politica-privacidad.html` existe e está
no ar — cobre coleta de dados pelo formulário de cotização, Google Analytics e
cookies. O `bga-catalogo` **não tem essa página**: nenhuma rota, nenhum link,
nenhuma menção a "privacidad" no projeto inteiro (verificado por grep).

Como este repo contém a LP (`app/page.jsx` → `LandingPage`), publicar o catálogo
significa apontar o domínio para cá e aposentar o `bga-site`. Nesse dia:

- `/politica-privacidad.html` vira **404** — é a primeira URL concreta do item 4
  dos briefs (redirects 301), que até agora era genérico
- o site novo fica **sem política de privacidade** coletando *mais* dados que o
  antigo: carrinho, formulário de lead, webhook para o Apps Script, GA4
- os anúncios planejados (Google, Instagram) costumam exigir política acessível
  no destino — **não verificado nas regras atuais de cada plataforma**, conferir
  na fonte antes de subir campanha

**O que fazer:** portar a página para uma rota do projeto
(`app/politica-privacidad/page.jsx`, texto vindo do que já está no ar), linkar no
rodapé, e registrar o 301 de `/politica-privacidad.html` para a rota nova no
console do Amplify — com `trailingSlash: true`, a URL nova é
`/politica-privacidad/`, então a antiga quebra mesmo com o mesmo nome.

**Antes de portar:** a política atual descreve o site antigo. O catálogo coleta
mais coisa (itens da cotação, observações, dados do projeto gravados na planilha
do cliente via Apps Script). O texto precisa de uma revisão de conteúdo, não só
de um copiar e colar. Isso é decisão da Yuki e possivelmente do cliente.

---

## 10. Instrumentar o 404 antes da troca de domínio (30/08)

**Correção do registro:** este item nasceu de um 404 que a Yuki tinha visto no
GA4 — e ela conferiu depois: **não era deste site**, era do site da Faro ou do
portfólio. Não há 404 observado aqui. O item continua valendo, mas por outro
motivo: é instrumentação para o dia da troca de domínio, não conserto de problema
observado. Prioridade baixa até lá.

**O que está frouxo:** `app/not-found.jsx` não exporta `metadata`, então herda o título padrão
do site (`config.meta.title`). No GA4 o 404 chega com o **mesmo `page_title` da
home** — dá para ver que houve 404, não em qual caminho.

**Segundo problema, na mesma tela:** o CTA do 404 é "Volver al catálogo" apontando
para `/catalogo`. Enquanto o deploy estiver parado no build antigo, `/catalogo`
também é 404 — o beco sem saída manda para outro beco sem saída.

**Por que ainda vale:** no dia em que o domínio apontar para cá, é esse evento que
responde com dado quais URLs do `bga-site` continuam sendo acessadas e merecem
redirect 301 (item 4 dos briefs). Antes disso, não há o que medir.

### Prompt pro Claude Code

```
O 404 precisa ser identificável no GA4 e não pode terminar em beco sem saída.

Em app/not-found.jsx:

1. Disparar evento próprio usando o componente que já existe, components/TrackView:
   <TrackView event="pagina_no_encontrada" params={{ ruta: <caminho atual> }} />
   O caminho vem de window.location.pathname — TrackView já é client component,
   então ler no efeito, nunca na render (o build é export estático).
2. Segundo CTA além de "Volver al catálogo": um link para a home. Se o catálogo
   estiver indisponível, o usuário ainda tem para onde ir.

Não mexer em mais nada. Rode `npm run build` no final.
```

**Depois do deploy:** olhar `pagina_no_encontrada` no GA4 por `ruta`. Caminhos
antigos com volume real = candidatos a redirect 301 no console do Amplify. Sem
volume = o item 4 dos briefs pode ser fechado sem trabalho.

---

## 12. O GA4 dispara em desenvolvimento (30/08)

**Como apareceu:** no relatório de Página de destino do GA4 havia
`/catalogo/bandejas/` — uma rota que **não está publicada**. É tráfego do
`localhost` da Yuki.

**Causa:** `components/Analytics.jsx` injeta o GA4 sempre que existe
`gaMeasurementId`, sem olhar o ambiente. `npm run dev` reporta para a propriedade
de produção do cliente (`G-3PF2RG7WNG`), a mesma que o `bga-site` usa.

**Consequência:** toda a sessão de testes de hoje entrou nos dados do cliente. E
como a medição do catálogo é o que deve virar case, o baseline precisa estar
limpo antes do lançamento.

### Prompt pro Claude Code

```
O GA4 está sendo carregado também em desenvolvimento, e o localhost reporta para
a propriedade de produção do cliente.

Em components/Analytics.jsx: não renderizar nada quando
process.env.NODE_ENV !== 'production'.

Manter a guarda que já existe do gaMeasurementId ausente, e o comentário do topo
do arquivo atualizado para dizer as duas condições.

Não mexer em mais nada.
```

**Ressalva:** `next build` roda com `NODE_ENV=production`, então servir o `out/`
localmente ainda reportaria. Se isso virar hábito, acrescentar também uma checagem
de `window.location.hostname` (pular `localhost` e `127.0.0.1`). Para o fluxo de
hoje, que é `npm run dev`, a guarda de ambiente resolve.

**Decidido (30/08):** a Yuki vai configurar **filtro de tráfego interno** no GA4 e
pedir o IP do Akira. Vale pegar também o da funcionária dele (mexe na planilha e
abre o site) e o da Aida, quando ela começar a receber cotações.

Três armadilhas conhecidas desse caminho:

- **São duas etapas.** Definir o tráfego interno no stream só marca as sessões
  com `traffic_type=internal`; o filtro de dados correspondente nasce em modo de
  teste e, enquanto estiver assim, marca mas não exclui. Os nomes dos menus do
  GA4 mudam com frequência — a lógica de dois passos, não.
- **Não é retroativo.** Vale só para dados novos; o GA4 não guarda IP para
  reprocessar. O histórico com os testes de hoje continua lá, então o baseline do
  case ainda precisa de recorte por data.
- **IP de escritório costuma ser dinâmico.** Se mudar, o filtro para de funcionar
  em silêncio. Se o provedor der faixa, filtrar por CIDR. E para a máquina da
  Yuki a guarda de ambiente no código é mais confiável que IP, porque não depende
  de onde ela está trabalhando.

**Fora do alcance:** o `/?` visto no mesmo relatório não vem deste repo — o form
da LP daqui chama `preventDefault()` na primeira linha. O que está no ar é o
`bga-site`, outro repositório. Um `<form>` sem `preventDefault` submetendo por GET
produz exatamente `/?`; é por aí que se procura, se alguém for investigar lá.
