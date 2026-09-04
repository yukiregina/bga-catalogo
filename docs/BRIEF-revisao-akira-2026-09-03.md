# BRIEF — Revisão do Akira, 03/09/2026

Quatro alterações vindas da passada do Akira pelo catálogo, mais um bug
diagnosticado. **Rodar cada bloco separado e commitar separado** — se algo
quebrar, tem que dar pra saber qual mudança causou.

Os arquivos de imagem da seção 0 **já estão no disco**. O que falta ali é
código: ligar as quatro miniaturas.

---

## 0. Bandeja — imagem principal perfurada + uma miniatura por variante

### 0.1 Os arquivos — já feitos, não regerar

Os quatro renders saíram dos originais do cliente em
`~/Desktop/BGA-catalogo/F. Catálogo Sitioweb/3. BANDEJAS JPG/`, com **um
recorte e uma escala únicos pros quatro** — a bandeja ocupa a mesma posição
nas quatro miniaturas, que é o que faz a troca ler como variante e não como
foto diferente. Canvas 1400×834, WebP q78, mesma moldura dos outros renders
da família.

| SKU | Variante | Arquivo em `public/images/productos/` |
| --- | --- | --- |
| CT3011 | Lisa Tipo U | `bandeja-portacables-lisa-ct3011.webp` |
| CT3012 | Lisa Tipo C | `bandeja-portacables-lisa-ct3012.webp` |
| CT3111 | Perforada Tipo U | `bandeja-portacables.webp` ← **principal** |
| CT3112 | Perforada Tipo C | `bandeja-portacables-perforada-ct3112.webp` |
| CT3211 | Tapa | `bandeja-portacables-tapa.webp` (já existia) |

A principal virou a **perfurada**, substituindo o binário no mesmo caminho.
Foi de propósito: aquele caminho aparece em `lib/catalog.json` **e** em
`lib/search-index.json` (gerado pelo `prebuild`), e trocar o arquivo resolve
os dois sem tocar em JSON nem regerar índice. O card da grade, que lê
`images.primary`, também passa a mostrar a perfurada — desejado.

### 0.2 `lib/catalog.json` — produto `bandeja-portacables`

Adicionar `bySku` ao objeto `images`, sem mexer em `primary` nem em `tapa`:

```json
"images": {
  "primary": "/images/productos/bandeja-portacables.webp",
  "tapa": "/images/productos/bandeja-portacables-tapa.webp",
  "bySku": {
    "CT3011": "/images/productos/bandeja-portacables-lisa-ct3011.webp",
    "CT3012": "/images/productos/bandeja-portacables-lisa-ct3012.webp",
    "CT3111": "/images/productos/bandeja-portacables.webp",
    "CT3112": "/images/productos/bandeja-portacables-perforada-ct3112.webp",
    "CT3211": "/images/productos/bandeja-portacables-tapa.webp"
  }
}
```

CT3111 aponta pro mesmo arquivo de `primary` de propósito — não duplicar o
binário. `secciones` fica como está.

O nome `bySku` acompanha o `byAla` que o `kit-de-uniones` já usa. Mesma
ideia: um mapa de imagem por escolha do configurador.

### 0.3 `ProductSheet.jsx` — a fileira de miniaturas

Hoje a fileira só existe quando há `images.tapa`, e é fixa em duas:
`Pieza | Tapa`, controlada pelo estado `galleryTab`.

**Quando o produto tiver `images.bySku`**, a fileira passa a ser uma
miniatura por variante que exista no mapa, na ordem do array `variants` —
`Lisa U · Lisa C · Perforada U · Perforada C · Tapa`.

Regras:

- **Clicar na miniatura seleciona a variante** no configurador
  (`setSelectedVariant`), não só troca a imagem. E escolher no select
  `Modelo / variante` acende a miniatura correspondente. É um estado só,
  nos dois sentidos — nada de `galleryTab` paralelo pra este caminho.
- **Sem variante escolhida** (estado inicial, deliberado: ver o comentário
  do `baseSku`, "o pedido sai sem punir"), a imagem grande é a `primary` e
  nenhuma miniatura fica acesa. Clicar numa miniatura é a primeira escolha,
  não uma correção.
- **`mainImageSrc`** vira `images.bySku[selectedVariant.sku] ?? images.primary`.
  Os caminhos `kitAla` e `tapaImageMissing` que já existem continuam
  intactos e vêm antes na cadeia.
- **Rótulo da miniatura:** `v.label.replace('Tipo ', '')` → `Lisa U`,
  `Lisa C`, `Perforada U`, `Perforada C`, `Tapa`. Cabe nos ~76px que cinco
  miniaturas deixam na coluna; `Perforada Tipo U` inteiro não cabe.
- **Produto sem `bySku` não muda nada.** Todos os outros 71 continuam no
  caminho `galleryTab` de hoje. Não refatorar os dois num só.

### 0.4 `lib/product-helpers.js` — alt das miniaturas

`getProductImageAlt` já aceita `'tapa'` e `{ ala }`. Aceitar também
`{ variantLabel }`, devolvendo `${base} — ${variantLabel}` — ex.:
*"Bandeja Portacables BGA — tramo recto de 3000 mm, lisa o perforada —
Perforada Tipo C"*. Sem isso as cinco miniaturas saem com alt idêntico, que
é pior que não ter alt.

### 0.5 `public/images/productos/_manifest.csv`

Três linhas novas, no formato das existentes
(`pagina_slug,rol,sku,origen,src,bytes`), com `origen` apontando pro JPG de
origem em `3. BANDEJAS JPG/`. A linha da CT3011 já existe com `rol=primaria`
— corrigir pra `variante` e apontar pro arquivo novo, já que a primária
agora é a CT3111.

### 0.6 Carrinho e impressão — sai de graça, mas confira

`handleAddToCart` já passa `image: mainImageSrc` no meta da linha. Assim que
a 0.3 fizer o `mainImageSrc` passar pelo `bySku`, a linha do carrinho e a
`Lista de especificación` impressa saem com o render da variante escolhida,
sem código novo. Não "consertar" nada aí.

Três consequências:

- **A imagem congela no momento do clique.** É meta da linha, gravada no
  localStorage — não é lida do catálogo depois. É o comportamento certo: a
  linha guarda a variante que a pessoa escolheu, imagem, rótulo e SKU juntos.
- **Carrinho antigo mantém a imagem antiga.** Quem já tinha bandeja no
  carrinho antes do deploy segue vendo a lisa naquela linha — coerente, já
  que o SKU dela também é o antigo. Some quando a linha sai. **Na hora de
  testar, limpe o localStorage antes** ou você vai ver a lisa e achar que
  quebrou.
- **Linha vinda da grade ou dos recomendados** não passa pela ficha: cai no
  `image ?? product.images?.primary` da `/cotacao`, ou seja, na CT3111. Fica
  a perfurada representando "variante a confirmar". É o mesmo que o card da
  família já mostra — deixar assim.

### 0.7 Conferir

`npm run dev` → `/catalogo/bandejas/bandeja-portacables/`:

- abre na perfurada, sem miniatura acesa
- clicar em `Lisa C` troca a imagem grande **e** o select passa a mostrar
  "Lisa Tipo C" — e o SKU composto vira `CT3012-…`
- escolher pelo select acende a miniatura certa
- a bandeja não "pula" entre as trocas — se pular, o recorte único da 0.1
  se perdeu
- `/catalogo/bandejas/kit-de-uniones/` e uma peça com tapa
  (`curva-horizontal-90`) continuam iguais
- com o localStorage limpo: agregar `Lisa C` e `Perforada C` e abrir
  `/cotacao` — duas linhas, duas imagens diferentes; imprimir e conferir que
  as duas aparecem na `Lista de especificación`

---

## 1. PREGALVANIZADO antes de SAE 1006/1010

### 1.1 `lib/catalog.json` — `globalSpecs.materials[0].name`

```
"name": "Acero SAE 1006/1010"
```
vira
```
"name": "Acero pregalvanizado SAE 1006/1010"
```

Só esse campo. **Não mexer** no `description` do mesmo objeto (já explica o PZ),
nem nas `richDescription` / `longDescription` dos produtos (já dizem
"pregalvanizado" na frase certa), nem no `materialTable` — ver 1.3.

Esse campo alimenta dois lugares de uma vez: a tag de Material na ficha e o
bloco "Materia prima" de `/materiales-y-tratamientos/`. Alimenta também o
rótulo da linha no carrinho, via `buildConfigLabel` — que passa a ler
"Acero pregalvanizado SAE 1006/1010", que é o desejado.

**Não afeta o SKU composto.** `buildComposedSKU` usa a tabela fixa
`{ sae1006: 'SAE1006', … }` em `lib/product-helpers.js`, não o `name`. Nenhum
SKU muda.

### 1.2 `app/catalogo/[categoria]/[produto]/ProductSheet.jsx` — a tag

A tag renderiza `m.name.replace('Acero ', '')`, o que passaria a mostrar
`pregalvanizado SAE 1006/1010`, em minúscula. Adicionar `capitalize` na
className do botão:

```jsx
className="text-[11px] px-2 py-1 rounded transition capitalize"
```

Resultado das três tags: `Pregalvanizado SAE 1006/1010` ·
`Inoxidable AISI 304` · `Inoxidable AISI 316`. Como `text-transform: capitalize`
não rebaixa letra que já é maiúscula, `SAE` e `AISI` ficam intactos — e as duas
tags de inox, que hoje aparecem em minúscula, também melhoram.

### 1.3 O que NÃO muda, e por quê — confirmar com o Akira

O `materialTable` da família bandejas (`lib/catalog.json`, dentro de
`categories.bandejas`) tem três linhas de aço carbono:

| linha | material | tratamiento |
| --- | --- | --- |
| 1 | Acero SAE 1006/1010 **pregalvanizado (PZ)** | Sin tratamiento adicional |
| 2 | Acero SAE 1006/1010 | Galvanizado por inmersión en caliente |
| 3 | Acero SAE 1006/1010 | Pintura electrostática |

A linha 1 **já diz pregalvanizado**. As linhas 2 e 3 descrevem a chapa que
recebe outro tratamento — escrever "pregalvanizado" nelas deixaria a tabela
contraditória. **Deixar 2 e 3 como estão nesta seção.**

→ **RESPONDIDO pelo Akira em 04/09.** A base é diferente em cada uma, e não é
a mesma dos dois lados. Correção na **seção 5**, que só pode rodar depois desta.

---

## 2. Política de privacidade — RUC, correo e prazo

Hoje a página tem dois placeholders `[CONFIRMAR…]` no ar. Akira fechou os três
dados.

### 2.1 `client.config.js`

O correo da política é **diferente** do correo comercial do site. `ventas@` segue
sendo o contato de venda em todo o resto; a política passa a apontar pro
financeiro. Então é campo novo, não troca do que existe:

```js
  contact: {
    whatsapp: '+595974733100',
    phone:    '+595 974 733 100',
    email:    'ventas@bga.com.py',
    // Contato de dados pessoais na política de privacidade — não é o
    // comercial. Definido pelo cliente em 03/09/2026.
    privacyEmail: 'financiero@bga.com.py',
    whatsappMessage: '…',
  },
```

E o RUC, que é dado legal da empresa, não contato:

```js
  brand: {
    …
    address: 'Minga Guazú, Ruta PY02 km14, Alto Paraná – Paraguay',
    ruc:     '80097677-0',
  },
```

### 2.2 `app/politica-de-privacidad/page.jsx`

Quatro trocas:

1. **Data do cabeçalho** → `Última actualización: 3 de septiembre de 2026`

2. **Seção 1** — trocar o placeholder do RUC pelo valor do config e o mailto
   pelo `privacyEmail`:
   ```jsx
   {config.brand.name} S.A. — RUC {config.brand.ruc} —, con domicilio en {config.brand.address}.
   Para cualquier tema de datos personales: <a href={`mailto:${config.contact.privacyEmail}`} …>{config.contact.privacyEmail}</a> o
   WhatsApp {config.contact.phone}.
   ```

3. **Seção 5** — tirar o `[CONFIRMAR: 5 años]`:
   > Los pedidos de cotización quedan registrados mientras dure la relación
   > comercial y por **5 años** más, por razones contables y de historial de
   > obra. Podés pedirnos que los borremos antes.

4. **Seção 6** (Tus derechos) — o mailto também vai pro `privacyEmail`. É o
   endereço pra onde a pessoa escreve pedindo acesso ou exclusão; tem que ser o
   mesmo da seção 1.

Depois: `grep -n "CONFIRMAR" app/politica-de-privacidad/page.jsx` tem que voltar
vazio.

---

## 3. Bug do anexo no WhatsApp — o que é e o que fazer

### O diagnóstico

**Não é bug de código. É limite do `wa.me`.** Um link `wa.me?text=…` só carrega
texto — não existe parâmetro de arquivo, em nenhuma versão da API pública. O
código já sabe disso: o comentário em `components/LandingPage.jsx:71` diz
exatamente isso, e `handleContactSubmit` nunca chega a ler o conteúdo do
arquivo. O `<input type="file">` só guarda o **nome** em `attachedFileName`, que
entra no texto como `📎 Adjunto: plano.pdf`.

Ou seja: o arquivo nunca sai do computador de quem preenche. Nem pro WhatsApp,
nem pra planilha.

O problema real é de expectativa. O campo se chama "Adjuntar plano o foto" e
tem cara de upload; o aviso de que a pessoa precisa anexar à mão está numa
linha cinza de 12px **embaixo** do campo, depois que ela já anexou. O Akira fez
o que qualquer visitante faria.

### A decisão (Yuki, 03/09): tirar o campo

Não conserta o campo — **remove**. Um campo que parece upload e não sobe nada
não vale as três telas de aviso que precisaria pra ser honesto. Quem tem
planta manda no chat, que é onde já manda hoje.

Ganha coerência de brinde: a `/cotacao` já diz isso no estado vazio —
*"¿Ya tenés tu lista? Mandanos la foto o el Excel por WhatsApp y te
cotizamos."* Com o campo fora, os dois lugares passam a dizer a mesma coisa.

#### O que sai de `components/LandingPage.jsx`

- o `formField` inteiro do `archivo` (input, label `fileDrop`, `fileHint`)
- o estado `attachedFileName` e a função `handleFileChange`
- a linha `const adjunto = …` e o `${adjunto}` dentro do template do `texto`

#### O que entra no lugar

Uma linha, onde o campo estava — último item antes do botão. **Convite, não
aviso.** O texto de hoje explica uma limitação técnica pra um cliente que não
perguntou; se sobrar só isso, tiramos o campo e ficamos com a desculpa dele.

> ¿Tenés plano o una foto de tu lista? Mandalos en el chat de WhatsApp que se
> abre — desde ahí te cotizamos.

Mesma classe do `fileHint` serve, ou o estilo do `formNote`. Não usar
`fileHint` se ela for removida no passo seguinte.

#### Limpeza

`app/landing.module.css` linhas 262–273: `.fileInput`, `.fileDrop`,
`.fileDrop:hover`, `.fileInput:focus-visible + .fileDrop` e `.fileHint` ficam
órfãs. Tirar junto, no mesmo commit — CSS morto some do radar em uma semana.

Se a linha nova reusar `.fileHint`, manter só essa e apagar as outras quatro.

### O que a gente perde, e por onde recupera

Sem campo não dá pra medir quanta gente **queria** anexar — o
`track('adjunto_seleccionado')` que estava previsto não existe mais.

Recupera por fora, e melhor: a Aida recebe todas as conversas. Perguntar a ela
com que frequência chega foto ou planta vale mais que um mês de evento no GA4,
e não custa deploy.

### Fase 2, se um dia voltar — não construir agora

Fazer o arquivo chegar sozinho na BGA: POST em base64 pro Apps Script que já
roda na conta deles, grava no Drive e escreve o link na linha da planilha.

Duas coisas a saber antes de tentar:

- **O link não volta pro navegador.** O `fetch` de hoje é `mode: 'no-cors'` e
  a resposta é opaca. Se o desenho depender de ler o link de volta pra pôr na
  mensagem do WhatsApp, não fecha. Se o link mora só na planilha, o problema
  some — a vendedora abre a linha e acha.
- **Upload e `window.open` brigam.** O submit não espera o `fetch` de
  propósito (ver o comentário no código): esperar faz o navegador bloquear o
  popup. Com upload, o `window.open` automático tem que virar botão pós-envio.

Mais: base64 infla ~33%, foto de celular vira POST de 4–11 MB, e iPhone manda
HEIC que nem todo navegador desenha no canvas. Limite de payload do Apps
Script: **conferir na doc de quotas do Google, não chutar.**

---

## 4. Produtos relacionados — o que preparar antes do Akira mandar

Ele avisou que vai acrescentar mais relacionados na planilha. Hoje isso não tem
caminho: `recommended` é um array de ids de produto dentro de cada produto no
`lib/catalog.json` (hoje só `bandeja-portacables` tem, apontando pra
`kit-de-uniones`), preenchido à mão. Não existe importador da planilha —
CLAUDE.md 5.6.

Antes de pedir pra ele, definir na planilha do Drive da BGA uma coluna
`RELACIONADOS` na aba de produtos, com **ids separados por `;`** — e já deixá-la
preenchida com o que existe. Vale o princípio da seção 5.5 do CLAUDE.md:
mandar rascunho pra revisão, nunca planilha em branco.

Sem isso, o que ele mandar vira transcrição manual de novo.

### 4.1 Quantos — respondido (Akira, 04/09)

Ele falou em **seis**, e depois da explicação disse que **pode ser quatro**.
Trabalhar com quatro.

**Com quatro não tem código nenhum.** O `RecommendedProducts` de hoje já é uma
lista empilhada na coluna, abaixo do CTA. Quatro itens custam ~190px, cabem
sem empurrar o CTA pra fora da dobra. O que ele mandar entra por dados.

O limite está em torno de **cinco**. Em seis, os complementos passam a ser o
bloco mais alto da coluna — ~320px, mais que o bloco inteiro de material y
terminación — e aí duas coisas mudam juntas: a barra fixa da 7.1 deixa de ser
preventiva e vira necessária, e o formato provavelmente migra pra faixa de
cards abaixo da ficha, mantendo o rótulo "Para instalar esta pieza".

Se um dia passar de cinco, essa é a nota pra saber que não é ajuste de CSS.

### 4.2 O bloco vira "Productos Relacionados" (Akira, 04/09)

Duas coisas juntas, e a segunda é a que importa:

1. O título passa a ser **"Productos Relacionados"**.
2. **O escopo do bloco muda.** Ele não quer só complementos — quer pôr outros
   itens ali. Perguntado se cabia um subtítulo "lo que necesitás para instalar
   esta pieza", a resposta foi que às vezes não vai ser o caso.

Então: **só o título, sem subtítulo.** Um subtítulo dizendo "para instalar"
passaria a mentir sobre metade da lista.

**E atualizar o comentário do `components/RecommendedProducts.jsx`.** Ele hoje
diz:

> *"Não é alternativa ao produto — é o que falta pra instalar essa peça, por
> isso mora dentro da coluna direita, logo abaixo do CTA."*

Essa decisão deixou de valer: o cliente decidiu que o bloco é mais largo que
isso. Se o comentário ficar, uma sessão futura lê aquilo, acha que o rótulo
genérico foi descuido e "conserta" de volta. Trocar por algo como: *bloco de
produtos relacionados definido pelo cliente — complementos de instalação e
outros itens que ele queira sugerir; a ordem vem do campo `recommended`.*

**A ordem passa a carregar significado.** Com a lista podendo misturar "você
precisa disto" com "isto também pode servir", a sequência é o que separa os
dois — e ela vem da ordem dos ids no `recommended`. Vale dizer isso ao Akira
quando ele preencher a coluna `RELACIONADOS`: o primeiro da lista aparece
primeiro.

---

## 5. Tratamentos — a base de cada um, e as cores (Akira, 04/09/2026)

O Akira respondeu por escrito. Rodar **depois** da seção 1, que já está
commitada.

### 5.1 O que ele disse, textual

- **Galvanizado a fogo é feito sobre chapa negra.** Tecnicamente dá pra fazer
  sobre a galvanizada, mas a BGA não faz.
- **Pintura eletrostática é feita sobre chapa galvanizada.** Dá pra fazer sobre
  chapa negra, mas não recomendam — fizeram "uma ou duas vezes porque um
  cliente insistiu".
- **Pintura líquida a BGA não faz.** Só a pó.
- **Cores padrão da pintura:** BEIGE Texturizado RAL 7032 · NEGRO
  Microtexturizado · GRIS Texturizado RAL 7035 · NARANJA RAL 2009. Outra cor,
  o cliente fala com a vendedora — ele mesmo sugeriu pôr essa observação.

Isto **derruba a suposição** de que os dois tratamentos saíam por cima da
pregalvanizada. A base é diferente em cada um.

### 5.2 `lib/catalog.json` — `materialTable` da família bandejas

Uma linha ganha a palavra, a outra não pode ganhar:

| linha | `material` fica | por quê |
| --- | --- | --- |
| 2 — galvanizado a fogo | `Acero SAE 1006/1010` **(chapa negra)** | a base é negra; escrever "pregalvanizado" aqui descreve um produto que a BGA não fabrica |
| 3 — pintura eletrostática | `Acero SAE 1006/1010 **pregalvanizado**` | a base é a galvanizada |

Linha 1 fica como está. Linhas 4 e 5 (inox) não têm tratamento posterior.

**Não uniformizar.** A tentação de deixar as três iguais é exatamente o erro —
as duas bases são diferentes e é essa diferença que o cliente pergunta.

### 5.3 `lib/catalog.json` — `globalSpecs.surfaceTreatments`

Hoje os dois objetos só têm `name`, `norm` e `useCase`. Acrescentar em cada um
o campo `base`, com a chapa de origem:

```json
{
  "id": "gf",
  "name": "Galvanizado por Inmersión en Caliente",
  "norm": "NBR 6323 / ASTM 123",
  "base": "Sobre chapa negra",
  "useCase": "exteriores, ambientes húmedos"
},
{
  "id": "elec",
  "name": "Pintura Electrostática en Polvo",
  "base": "Sobre chapa pregalvanizada",
  "colores": ["BEIGE Texturizado RAL 7032", "NEGRO Microtexturizado",
              "GRIS Texturizado RAL 7035", "NARANJA RAL 2009"],
  "useCase": "interiores y exteriores, con color y acabado estético"
}
```

**Nota do Akira:** ele escreveu "GRIZ" — é GRIS. Corrigido de propósito.

### 5.4 `app/materiales-y-tratamientos/page.jsx`

A tabela de tratamentos ganha a coluna **Base** e, embaixo dela, as cores
padrão da pintura com a observação que o próprio Akira pediu:

> Colores estándar: BEIGE texturizado RAL 7032, NEGRO microtexturizado, GRIS
> texturizado RAL 7035 y NARANJA RAL 2009. Para otro color, consultá con la
> vendedora antes de cotizar.

### 5.5 FAQ da família bandejas — a pergunta que falta

O FAQ tem quatro perguntas e **nenhuma sobre pintura** — que é justamente o
que os clientes mais perguntam, segundo o Akira. Acrescentar uma quinta:

**P:** ¿Cuál es la diferencia entre galvanizado por inmersión en caliente y
pintura electrostática?

**R:** El galvanizado por inmersión en caliente se aplica sobre chapa negra:
la pieza se sumerge en zinc fundido y queda protegida para exterior, ambiente
húmedo o con agentes corrosivos. La pintura electrostática en polvo se aplica
sobre chapa pregalvanizada y suma color y terminación, para interior o
exterior donde además importa el acabado. Los colores estándar son BEIGE
texturizado RAL 7032, NEGRO microtexturizado, GRIS texturizado RAL 7035 y
NARANJA RAL 2009; para otro color, consultá con la vendedora. BGA no hace
pintura líquida.

### 5.6 Limpeza: o código `LIQ`

`buildComposedSKU` em `lib/product-helpers.js` mapeia
`{ pz, gf, elec, liq }`. O Akira confirmou que **pintura líquida não existe**
na BGA. Tirar `liq` do mapa — código morto que descreve um produto inexistente
é pior que código morto comum, porque um dia alguém constrói UI em cima dele.

### 5.7 Conferir

- `/catalogo/bandejas/` → a tabela mostra bases diferentes nas linhas 2 e 3
- `/materiales-y-tratamientos/` → coluna Base preenchida e as quatro cores
- FAQ da família com a quinta pergunta, e o schema de FAQ do `page.jsx`
  incluindo ela

---

## 6. Configurador: material y terminación como eixo único

Desenho fechado com o Akira em 04/09, validado em mockup navegável.

**Escopo cortado de propósito.** O mockup explorou muito mais que isto —
barra fixa de CTA, complementos com herança de configuração e botão de
agregar inline. Tudo isso foi pra seção 7 e **não entra agora**. O problema
que o Akira relatou é uma frase — o tratamento não é escolhível, então toda
cotação chega sem ele e a vendedora pergunta — e o que resolve essa frase é
o seletor. O resto era escopo crescendo sozinho.

### 6.1 `lib/catalog.json` — `globalSpecs.finishes` (novo, aditivo)

Material e tratamento deixam de ser dois eixos e viram um. Mas **não apagar**
`materials` nem `surfaceTreatments`: os dois seguem alimentando a
`/materiales-y-tratamientos/` e o `materialTable`. O novo array só nomeia as
cinco combinações vendáveis, apontando pros ids que já existem:

```json
"finishes": [
  { "id":"pz",      "label":"Pregalvanizado (PZ)",
    "material":"sae1006", "treatment":"pz",
    "ambiente":"Interior seco · sobre chapa pregalvanizada" },
  { "id":"gf",      "label":"Galvanizado por inmersión en caliente",
    "material":"sae1006", "treatment":"gf",
    "ambiente":"Exterior, húmedo o con agentes corrosivos · sobre chapa negra" },
  { "id":"elec",    "label":"Pintura electrostática en polvo",
    "material":"sae1006", "treatment":"elec", "needsColor":true,
    "ambiente":"A la vista, cuando se busca color o terminación · sobre chapa pregalvanizada" },
  { "id":"aisi304", "label":"INOX AISI 304",  "material":"aisi304", "treatment":null,
    "ambiente":"Higiene exigente — alimenticia, farmacéutica, hospitalaria" },
  { "id":"aisi316", "label":"INOX AISI 316",  "material":"aisi316", "treatment":null,
    "ambiente":"Química, marina o salina" }
]
```

### 6.1b O sinal por produto — quem entra no configurador novo

`globalSpecs.finishes` é **global**: checar `gs.finishes?.length > 0` daria
true pros ~36 produtos da família e o bloco novo vazaria pra todos. Falta um
sinal **por produto**, do jeito que `images.bySku` escopou a seção 0.

No produto, um array de ids apontando pro global — mesma forma do
`recommended`:

```json
"finishes": ["pz", "gf", "elec", "aisi304", "aisi316"]
```

Presença = configurador novo. Ausência = caminho de hoje. **Só
`bandeja-portacables` recebe o campo agora.**

Array e não boolean por dois motivos: é a forma que o projeto já usa pra
apontar ids num array global, e deixa um produto futuro oferecer um
subconjunto sem inventar outro campo.

O bloco resolve com
`product.finishes.map(id => gs.finishes.find(f => f.id === id))`, descartando
id que não resolve.

**Isto é "vai primeiro", não "só ela precisa".** A cotação sai sem tratamento
nos 36. Com o campo por produto, ampliar depois é uma linha em cada um — e dá
pra olhar uma ficha no ar antes de decidir.

O `ambiente` sai da mesma fonte que a correspondência confirmada pelo Akira —
uma fonte só, não um segundo mapa hardcoded no componente. **Não criar um
seletor separado de "¿Dónde va instalada?":** os rótulos e essa linha já fazem
o trabalho, e a pergunta extra foi descartada no mockup por peso.

### 6.2 `ProductSheet.jsx` — ordem e forma dos blocos

Ordem nova na coluna direita: variante → ancho → ala → **Espesor** →
**Material y terminación** → complementos → barra fixa.

- **Ancho e ala não mudam.** Continuam no grid de 88px com linhas
  equilibradas e o "Seleccionado: N". Não transformar em chips, não aumentar.
- **Espesor** ganha moldura e título (`ESPESOR`, uppercase, 12px, tracking
  .05em) e mostra a bitola mais o milímetro de `globalSpecs.thicknesses`
  (`#18` / `1,2 mm`). O chip fica no mesmo peso dos de ancho — moldura de
  62px, mono 13,5px. **Já exagerei isso uma vez:** não subir pra 82px/17px, o
  bloco de material tem que continuar sendo o mais pesado da coluna.
- **Material y terminación** substitui as tags de Material: cinco linhas
  cheias, radio à esquerda, `label` em 14,5px semibold e `ambiente` em 11,5px
  logo abaixo. Verde do estado selecionado é o que já existe
  (`#E1F5EE` / `#085041` / `#A7DFC9`).
- A regra de espesor mínimo vira linha embaixo do bloco de espesor, e fica
  **âmbar quando a bitola escolhida está abaixo do mínimo** do ancho atual.
  Hoje ela só informa; passa a notar a divergência.

### 6.3 A cor

Só quando `needsColor`. **Campo de texto aberto**, `maxlength=40`, rótulo
`¿Qué color?`, placeholder `Escribí el color`. Sem seletor, sem lista de
apoio, sem amostra de cor.

Decidido assim depois de eu propor o contrário: a BGA tem um beige só, então
"beige" já identifica, e quem sabe o código escreve o código. Quem lê é a
vendedora, não um sistema de estoque. **Amostra de cor em hex está proibida** —
promete um tom que o pó não entrega e o monitor não reproduz.

### 6.4 SKU, rótulo e URL — onde mora o risco

- `buildComposedSKU(base, axes, materialId, gauge, treatmentId)` passa a
  receber os dois últimos **derivados do finish**, não de estados separados. O
  quinto argumento deixa de ser `null`.
- **A cor entra no SKU como slug:** uppercase, sem acento, não-alfanumérico
  vira `-`, cortado em 22 caracteres → `· BEIGE-TEXTURIZADO-RAL`. Sem isso
  duas linhas iguais em cores diferentes colidem, porque o `lineId` **é** o
  SKU composto.
- Sem finish escolhido: `(terminación a confirmar)`. Com `elec` e sem cor:
  `(color a confirmar)`. Mesmo padrão do `(variante a confirmar)` que já existe.
- `buildConfigQuery` / `buildConfigLabel` ganham `finish` e `color`.
- **Compatibilidade pra trás, obrigatória:** o `useEffect` que lê a URL
  **continua aceitando `?material=`**. Carrinhos gravados no localStorage antes
  desta mudança guardam links com esse parâmetro; se ele parar de ser lido, as
  linhas antigas perdem o "voltar pra ficha configurada". Ler `finish` primeiro
  e, na ausência dele, cair no `material` antigo.

### 6.5 O que NÃO pode mudar

- **Os outros 71 produtos**, e em especial os outros 35 da família bandejas.
  Produto sem o campo `finishes` **no próprio produto** (ver 6.1b) segue no
  caminho de hoje: tags de `gs.materials` + `gs.thicknesses`. **Não unificar
  os dois caminhos**, e não guardar por `globalSpecs.finishes`, que é global e
  daria true pra todo mundo.
- `materials` e `surfaceTreatments` continuam existindo e alimentando
  `/materiales-y-tratamientos/`.
- Ancho e ala, exatamente como estão.
- O `materialTable` — quem mexe nele é a seção 5.

### 6.6 Riscos, e como saber que aconteceram

As falhas prováveis aqui **não dão erro de build**. Procurar cada uma:

| risco | sintoma | como conferir |
| --- | --- | --- |
| `?material=` deixa de ser lido | linha antiga do carrinho volta pra ficha em branco | carrinho antigo → clicar na linha |
| finish vaza pros outros produtos | `curva-horizontal-90` muda de cara | abrir uma curva e um kit |
| cor fora do SKU | duas cores viram uma linha só | agregar beige e negro, ver o carrinho |

E o de sempre: **o formato do SKU muda**, então linhas antigas no localStorage
não casam com as novas. Não é bug. `localStorage.removeItem('bga-cart-v2')`
antes de testar.

### 6.7 Pendências do Akira — não travam o código

- **Quantos complementos — RESPONDIDO.** Quatro. Ver a seção 4.1: nesse
  número o componente de hoje já serve e nada disto precisa existir.
- **Ancho 75 — RESOLVIDO.** O Akira respondeu tirando o problema pela raiz:
  o ancho 75 sai do catálogo. Ver a **seção 8**. Sem ele, todo ancho de
  bandeja existe também nos suportes, e o caso de degradação some.

---

## 7. Explorado no mockup, adiado de propósito

**Não construir junto com a 6.** Está escrito aqui porque foi desenhado e
testado, não porque está na fila. Cada um volta quando doer de verdade.

### 7.0 Por que não agora

A seção 6 já resolve o que o Akira trouxe. Estes dois resolvem problemas que
ainda não temos medida de que existem: o CTA sair da dobra depende de quanto
o bloco de acabamento realmente empurra a coluna — dá pra olhar depois da 6
no ar, em vez de prevenir no escuro. E o Agregar inline nos complementos é
uma feature própria, que nasceu de uma pergunta sobre onde os recomendados
aparecem, não do problema das pinturas.

Ordem sugerida se voltarem: 7.1 é barato e isolado; 7.2 é o maior item de
todo o brief e merece sessão própria.

### 7.1 A barra fixa do CTA

`SKU + CTA + link de dúvidas` viram um bloco com `position: sticky; bottom: 0`,
fundo próprio, borda em cima e sombra fina. O CTA para de depender da dobra.

**A pegadinha:** `.ficha` (ou o container equivalente) tem `overflow: hidden`
pro border-radius. `hidden` cria contexto de rolagem e **mata o sticky sem
erro nenhum** — não gruda e não avisa. Trocar por `overflow: clip`, que corta
igual e não cria o contexto.

### 7.2 Complementos — herança e Agregar inline

O `RecommendedProducts` deixa de ser lista estática e passa a receber a
configuração atual.

- **Herda `ancho`, `ala` e `espesor` da peça principal.** São os mesmos eixos
  (`dimensionAxes`), e os complementos compartilham o mesmo
  `minThicknessRule` — por isso herdar é definido, não chute. A linha mostra o
  herdado: `KIT3062 · Kit · ala 50 · #18`.
- **Cabe ou não cabe**, calculado dos dados:
  ```js
  const cabe = (comp) =>
    (comp.dimensionAxes ?? []).every(a => a.values.includes(configAtual[a.id]))
  ```
  Cabe → stepper de quantidade + botão `Agregar`, sem sair da ficha.
  Não cabe → `Ver opciones →` e a linha diz o porquê
  (`no disponible en ala 200`).
- **É o mesmo link nos dois casos.** O `useEffect` da ficha só aplica um
  parâmetro se ele bater com um valor real do produto — está comentado lá.
  Então mandar `ala=200` pro kit, que vai até 100, não quebra: ele ignora e
  fica no default. Um link só, com a config herdada sempre.
- **A linha deixa de ser um `<a>`.** Com botões dentro, link aninhado é HTML
  inválido e quebra o teclado. O link passa a ser a imagem + o nome; stepper e
  Agregar são botões de verdade.
- O stepper é o **mesmo** da ficha — mesma moldura, mesmo mono, mesma altura
  de toque. Não inventar um segundo padrão.
- `unidadVenta` aparece quando existe (hoje só no kit). Ausente, some — não
  inventar rótulo.

---

## 8. Ancho 75 sai do catálogo (Akira, 04/09/2026)

> "Esse de 75 mm de ancho pode remover. A gente deve ter feito uma vez só.
> Normalmente o cliente já vai pra de 100."

Mudança só de dados. Nenhum componente muda.

### 8.1 O que muda

Remover o valor `75` do eixo **`ancho`** em `lib/catalog.json`. São **26
produtos** — todos os que hoje têm 14 valores de ancho: a bandeja, as oito
curvas, os cinco tes, as duas cruzetas, o desnível, os dois desvios, as três
reduções, os dois finais de tramo e as duas uniões.

Ficam 13 valores:
`50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800`

### 8.2 O que NÃO muda — cuidado aqui

**O `ala` 75 fica.** É outro eixo, existe em 32 produtos, e o
`kit-de-uniones` tem inclusive render próprio pra ele
(`kit-de-uniones-ala75.webp`, no mapa `images.byAla`). Um find-and-replace de
`75` no arquivo destrói isso.

A única menção a "75 mm" em texto corrido também é de **ala**, na descrição do
kit — *"50 mm (2 chapas y 8 tornillos), 75 mm (12 tornillos) y 100 mm"*. Fica.

As quatro frases "de 50 a 800 mm" seguem verdadeiras.

### 8.3 O que sai de graça

- **O índice de busca se corrige sozinho** — `build-search-index.mjs` roda no
  prebuild e monta o haystack a partir dos valores.
- **O buraco do suporte fecha.** Os seis suportes seguem passo de 50 mm
  (`50, 100 … 800`). Com o 75 fora, todo ancho de bandeja passa a existir
  também no suporte — some o único caso em que a herança de configuração da
  seção 7.2 degradaria por ancho.
- **As linhas do grid continuam equilibradas:** 13 valores → `rows = 2`,
  `cols = 7` → 7 + 6. Nada a ajustar.

### 8.4 Efeito em carrinho e links antigos

Linha antiga com `-75x50` no SKU mantém o rótulo dela; clicar pra voltar à
ficha cai no default de ancho, porque o `useEffect` só aplica parâmetro que
bate com valor real do produto. É o comportamento correto e se resolve
sozinho quando a linha sai. Não tentar migrar.

### 8.5 Conferir

- `grep -c '"ancho"' lib/catalog.json` antes e depois: mesma contagem de eixos
- nenhum eixo `ancho` com 75; **todos** os eixos `ala` com 75 intactos
- `kit-de-uniones` ainda mostra as três imagens por ala
- `npm run build` regenera o `search-index.json` sem 75 nos haystacks de ancho

---

## 9. Bugs encontrados em uso — e o padrão por trás deles

Os dois bugs desta sessão saíram do **mesmo lugar**, e nenhum dos dois dá erro
de build. Anotados aqui porque o próximo catálogo vai ter a mesma estrutura e
pode repetir os dois.

### 9.1 O padrão

**A identidade da linha do carrinho é derivada da configuração** — `lineId` é
o SKU composto. Isso é bom: duas configurações diferentes viram duas linhas,
sem inventar id.

O preço é que qualquer descompasso entre *o que a pessoa vê* e *o que compõe
o SKU* vira defeito silencioso. Duas formas de errar:

- **A tela muda e o SKU não** → a linha sai com informação que contradiz o que
  foi cotado.
- **O SKU muda e a intenção não** → a pessoa quis corrigir e ganhou duplicata.

Um de cada aconteceu.

### 9.2 Bug 1 — a miniatura de tapa (achado pelo Akira, corrigido em `7d64d69`)

Na galeria pieza/tapa, clicar na miniatura chamava só `setGalleryTab` — a
variante não mudava. A imagem grande virava a tapa, e como o
`handleAddToCart` manda `image: mainImageSrc`, a linha saía **com foto de tapa
e SKU de curva**, marcada `(variante a confirmar)`.

Afetava 9 produtos. A bandeja era imune porque o `bySku` já fazia a miniatura
selecionar a variante — o caminho certo desde o início, que os outros não
tinham herdado.

**A tela mudou e o SKU não.**

### 9.3 Bug 2 — editar pelo carrinho duplica (pendente)

A linha da cotação linka de volta pra ficha já configurada, mas o link não diz
que é edição. A pessoa troca a cor, clica em Agregar, e ganha uma linha nova
com a errada ainda lá.

Conserto: o `productHref` carrega `editar=<lineId>`, o `CartProvider` ganha um
`replaceItem` que troca **na mesma posição**, e o CTA vira "Actualizar
cotización". Adicionar duas vezes direto da ficha continua criando duas linhas
— é caso legítimo, 100 em beige e 50 em laranja.

**Cuidado no diff:** o `editar` não pode entrar no `buildConfigQuery`. É
parâmetro de navegação, não de configuração — se entrar, gruda na URL e vaza
pros links de Productos Relacionados, mandando "edite a linha X" pra ficha de
outro produto.

**O SKU mudou e a intenção não.**

### 9.4 O que conferir no próximo catálogo

- Todo controle que troca a imagem também troca a variante? Ou existe algum
  que só troca a foto?
- Tudo que entra no SKU composto está visível na tela, e o contrário também?
- A linha do carrinho volta pra ficha sabendo que é edição, ou só configurada?
- Trocar de eixo deixa estado velho pra trás que ainda entra no SKU? (A cor
  foi verificada nesta sessão e está certa — é lida com
  `activeFinish?.needsColor` no momento do uso, não do preenchimento.)
- O rótulo da linha (`buildConfigLabel`) mostra tudo que o SKU mostra?
