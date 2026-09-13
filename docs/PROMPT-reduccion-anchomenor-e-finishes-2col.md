# Prompt pro Claude Code — 2026-09-09

Duas mudanças independentes. **Fazer e commitar separadas**, nessa ordem.

---

## Parte 1 — Segundo ancho nas Reducciones (só dados, sem código)

As três reducciones de bandejas mudam o ancho da bandeja, mas a ficha só tem um
eixo `ancho`. A própria FAQ delas já diz "Ancho de entrada, ancho de salida y
ala" — o campo do ancho de saída nunca existiu na UI.

**Só estes 3 produtos, em `lib/catalog.json`:**

- `reduccion-lateral-derecha`
- `reduccion-lateral-izquierda`
- `reduccion-central`

⚠️ `"label": "Ancho [A]"` aparece **50 vezes** no arquivo. Nada de
find/replace global — localizar cada produto pelo `id` e editar só o
`dimensionAxes` dele.

### O que fazer em cada um dos 3

1. No eixo `ancho` existente, trocar **só o label**: `"Ancho [A]"` →
   `"Ancho mayor [A]"`. **O `id` continua `ancho`** — `minThicknessRule`,
   leitura de URL e o composedSKU dependem dele.

2. Inserir um eixo novo **entre `ancho` e `ala`** (a ordem do array define a
   ordem do SKU composto):

```json
{
  "id": "anchoMenor",
  "label": "Ancho menor [A']",
  "values": [50, 100, 150, 200, 250, 300, 350, 400, 450, 500],
  "unit": "mm"
}
```

Valores em ordem crescente, igual ao eixo `ancho` — os dois grids de pills
ficam um embaixo do outro e precisam ler na mesma direção.

### Não fazer

- **Nada de validação `A' < A`.** Combinação incoerente vai pro carrinho e a
  Aida corrige no orçamento — é o que já acontece hoje sem o campo. Sem estado
  `disabled` no grid de pills.
- Não mexer nas outras 47 fichas com `Ancho [A]`.
- Não mexer em `reducciones-y-desvios` (é `type: subfamilia`, não tem eixos).
- Não mexer nas reducciones de `escaleras` (CL5042 / CL5044 / CL5046) — não
  têm `dimensionAxes` e a família não entra no lançamento.

### Nenhum código muda — confirmar que continua assim

`ProductSheet.jsx` já é genérico sobre `dimensionAxes`: render dos eixos,
`selectedAxes` inicial, leitura da URL (`product.dimensionAxes?.forEach`) e
`axesForSku`. Só **confirmar**, não refatorar.

### O que muda de comportamento (esperado, não é bug)

- O SKU composto dessas 3 peças passa de `CT3150-400x100` para
  `CT3150-400x200x100` (A × A' × B).
- A URL da ficha ganha `&anchoMenor=…`.
- O grid de 10 valores cai em 2 linhas de 5 pela regra de balanceamento que já
  existe (`rows = ceil(n/8)`).
- O default do eixo novo é o primeiro valor (50), mesma regra do `ancho`.

### Verificar depois

1. `npm run build` passa.
2. `/catalogo/bandejas/reduccion-central/`: os dois grids aparecem, "Ancho
   mayor [A]" em cima, "Ancho menor [A']" embaixo, "Ala [B]" por último.
3. A caixa de "Espesor mínimo recomendado" continua reagindo ao **Ancho
   mayor** (não ao menor).
4. Agregar a cotización → o SKU no carrinho traz os três números; "editar"
   volta pra ficha com os três selecionados.

---

## Parte 2 — "Material y terminación" em 2 colunas

Em `app/catalogo/[categoria]/[produto]/ProductSheet.jsx`, bloco
`Material y terminación` (~linha 678). Hoje são 5 opções empilhadas em
`space-y-1`, cada uma com label à esquerda e `ambiente` empurrado pra direita
com `ml-auto`. Ocupa ~220px de vertical.

**Mudança:** grid de 2 colunas a partir de `lg`, com o `ambiente` virando a
segunda linha dentro do card.

- O `radiogroup` passa de `space-y-1` para
  `grid grid-cols-1 lg:grid-cols-2 gap-1`.
- **`lg`, não `md`.** No `md` o layout da ficha já é `320px_1fr`, sobra ~360px
  pra coluna de conteúdo — 2 colunas ali dariam ~176px cada e
  "Galvanizado por inmersión en caliente" quebraria em 3 linhas. Em `lg` sobra
  ~610px, ~300px por coluna, e o label mais longo cabe em uma linha.
- Dentro do botão: trocar `flex flex-wrap items-center` por
  `flex items-start gap-2.5`, e envolver label + ambiente num `<span>` em
  coluna. O `ambiente` perde o `ml-auto` e vira `block` embaixo do label.
- A bolinha do radio precisa de um `mt-[2px]` pra alinhar com a primeira linha
  de texto, já que o alinhamento agora é `items-start`.

**Manter intacto:** as cores de selecionado (`#E1F5EE` / `#A7DFC9` / `#085041`),
`role="radio"` + `aria-checked`, o campo de cor do `needsColor`, o
`product.finishNote`, e o `no-print` do bloco.

Com 5 opções sobra uma sozinha na terceira linha — está certo. Não fazer ela
ocupar as duas colunas: item full-width parece opção destacada.

**Não mexer no bloco de Espesor** — só no de Material y terminación.

### Verificar depois

1. `npm run build` passa.
2. Em 1280px: 2 colunas, nenhum label quebrando em 3 linhas, `ambiente` legível
   embaixo de cada um.
3. Em 768–1023px: volta pra 1 coluna, igual hoje.
4. Em 375px: 1 coluna, nada estourando a largura.
5. Selecionar "Pintura electrostática en polvo" → campo "¿Qué color?" continua
   aparecendo logo abaixo do grid.
6. Navegação por teclado no radiogroup continua funcionando.

---

## Commits

Dois, separados:

1. `feat(bandejas): segundo ancho (A') nas reducciones`
2. `refactor(ficha): material y terminación em 2 colunas no desktop`
