# Bugs do carrinho — 29/08/2026

Ordem de ataque depois dos 3 briefs (ainda **não commitados** no momento em que
isto foi escrito). Um bug por commit — se quebrar, dá pra saber qual mudança foi.

**Passo 0, antes de tudo:** commitar o trabalho dos briefs. Os arquivos abaixo
(`app/cotacao/page.jsx`, `ProductSheet.jsx`) já estão modificados; misturar as
correções do carrinho no mesmo commit apaga a fronteira entre "reconstrução do
catálogo" e "conserto do carrinho".

---

## A ordem, e por quê

A ordem não é por incômodo, é por dependência: **1 é a causa dos outros dois.**
O 2 e o 3 são consertos de interface que só fazem sentido depois que a linha do
carrinho tiver identidade própria. O 4 não depende de ninguém — vai por último
por ser o único que não muda comportamento.

| # | Bug | Tipo | Bloqueia |
| --- | --- | --- | --- |
| 1 | Variantes colapsam numa linha só | **dado** — o lead sai errado | 2 e 3 |
| 2 | Botão "Agregar" volta ao estado original | feedback | — |
| 3 | Carrinho sem volta pro produto | navegação | — |
| 4 | `<select>` de variante fora do DS | estilo | — |

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

## 5. Threads já desbloqueadas (não são bugs)

Estavam travadas pelos briefs 1 e 2 no `ESTADO-2026-08-29.md`, thread 1. **Os
briefs saíram — estão livres**, e mexem nos mesmos arquivos dos bugs 1–3:

- `CartBadge` invisível com carrinho vazio + `aria-hidden` / `tabIndex={-1}` —
  já tem decisão sua ("carrinho sempre aparece") e uma pergunta em aberto (vazio
  apagado ou só sem contador)
- estado vazio da `/cotacao`, que diz "vazio" duas vezes e não explica o
  mecanismo

Entram nesta rodada ou na seguinte — em commit separado, de qualquer forma.
