# BRIEF — Tapas viram produto, 08/09/2026

Registro do que mudou nesta sessão (commits `a3a31f2`, `0420aa3`, `ee64995`),
do que a planilha oficial cobre e não cobre, e do que fica pendente com o
Akira. Não é brief de execução — é o estado, pra quem abrir isto depois sem
ter visto a sessão.

---

## 1. Qual planilha é a oficial

É o Google Sheets **nativo** id `1h2L1QS4rBOglMtwdk472kh9kN6wdpvU1I5K0yFm6_XI`,
na pasta "Catalogo digital web" (`mkt@bga.com.py`).

**Não** é o `.xlsx` `13FPVH7dGC5LUdLw2-4-bWoUVhvhUvfZe` (conta `marcos@`) — esse
é de uma geração anterior do template e ficou sem as colunas de recomendados
na aba de perfilados. A seção 5.6 do `CLAUDE.md`, que apontava pro arquivo
errado, foi corrigida nesta sessão.

---

## 2. O que a aba 01_Bandejas tem

76 linhas, uma por SKU, com colunas completas: Uso principal, Aplicaciones,
Unidad de venta, Nombre PT, Normas, Búsquedas em 76/76 linhas — mais
Recomendados, Regla espesor e Nota recomendación, também em 76/76.

**Mas para no CT3142** (unión cruzeta recta, perforada tipo U), no meio do
grupo. Cobre 16 dos nossos 36 produtos de bandejas (peças, sem contar as
tapas). Faltam 18, mais o resto da própria cruzeta recta:

desnivel-simple · desvio-horizontal-derecho · desvio-horizontal-izquierdo ·
reduccion-lateral-derecha · reduccion-lateral-izquierda · reduccion-central ·
os dois finais de tramo · union-simple · union-interna · kit-de-uniones ·
tramo-divisor · os três soportes · as duas manos francesas · o travesaño.

---

## 3. O padrão dos recomendados (vale como regra de import)

```
peça    → [tapa dela, CT3062, CT3063, KIT3062]
tapa    → [as 4 variantes da peça que ela cobre]
bandeja → idem peça + CT3065, CT3066, CT3067
```

Truncado em 4 pelo limite da seção 4.1 do
`docs/BRIEF-revisao-akira-2026-09-03.md` (o Akira confirmou que 4
complementos cabem no bloco sem mudar layout; mais que isso muda).

- `CT3062` = `union-simple`
- `CT3063` = `union-interna`
- `KIT3062` = `kit-de-uniones`
- `CT3065` / `CT3066` / `CT3067` = os três soportes de suspensión (omega,
  tipo A, tipo B)

Esses seis são recomendados em quase toda linha da planilha, mas **nenhum
tem linha própria em nenhuma aba** — um import ingênuo que criasse produto
só a partir de linhas geraria referência pendurada (`recommended` apontando
pra um id que não existe) assim que chegasse nessas seis.

---

## 4. Tapa virou produto (decisão do Akira, 08/09)

**Motivo:** na fonte, cada tapa é linha própria, na subfamília "Accesorio de
Bandeja", e é o **primeiro** recomendado de toda peça. Sem ela como produto,
as 16 fichas mostrariam os mesmos 3 relacionados (union-simple, union-interna,
kit-de-uniones) e a tapa ficaria sem ficha, sem card, sem SKU próprio.

**Feito:** 15 tapas criadas — commits `a3a31f2` (tapa da bandeja),
`0420aa3` (as 14 de acessórios de curva/derivação) e `ee64995` (tapas nas
subfamílias + recomendados das 7 peças sem dado na planilha). Cada peça que
ganhou tapa perdeu a variante `role: "tapa"` e a chave `images.tapa`.

**Falta:** 7 tapas — `CT3242`, `CT3244`, `CT3246`, `CT3248`, `CT3250`,
`CT3252`, `CT3254`. Seis sem copy nenhuma na aba; `CT3254` tem render mas não
tem linha.

**Tapa é só lisa, não tem U/C:** as 15 linhas da planilha que descrevem tapa
são unânimes em Modelo = Lisa, Tipo = –, Ala = 10. Por isso o produto tapa
não tem `variants` — só o eixo `ancho`, igual ao `tapa-bandeja-portacables`
que serviu de template.

---

## 5. Erros de dado achados

- **`21a6f69`** pôs curvas no `recommended` da bandeja por leitura errada da
  planilha; corrigido em `a3a31f2`.
- O produto id **`CT3211`** na família **perfilados** é erro de transcrição:
  na fonte, `CT3211` é "Tapa Bandeja Lisa", subfamília Accesorio de Bandeja —
  não tem relação com perfilados. Ainda não removido.
- **`reduccion-lateral-izquierda.webp`** é render de **tapa** no slot da
  peça. O `_manifest.csv` grava `rol=primaria` com `sku=CT3252` (código da
  tapa, não da peça). A ficha de `reduccion-lateral-izquierda` mostra uma
  tampa no lugar do produto. Precisa do render da peça `CT3152`.
- **`reduccion-central`** tem `origen=CT3128.jpg` no manifest — `CT3128` é o
  código da curva de descarga, não da reducción central. A imagem em si
  parece certa; provável nome de arquivo de origem trocado no manifest.
- As duas **salidas** (`CL5268-*`, `CL5270`) estão na nossa família
  **bandejas**, mas na fonte pertencem à aba **Escaleras**.
- Quatro nomes de tapa corrigidos vs. a planilha, com base no campo
  "Nombre PT" e na frase de uso da mesma linha:
  - `CT3222` — planilha diz "Tapa Vertical 45 Lisa", falta "Externa"
  - `CT3224` — planilha diz "Tapa Vertical Int. 45 Lisa", vira "Interna"
  - `CT3226` — planilha diz "Tapa Curva Horizontal Lisa", falta o "45"
  - `CT3234` — planilha diz "Tapa Te Vertical Ascendente Lisa **Tipo**",
    "Tipo" sobrando

---

## 6. Dívida técnica registrada no audit de 08/09

- **`ST2239`** e **`KIT5262`** têm variantes com `code` + `attributes` em vez
  de `sku` — um segundo schema de variante dentro do mesmo catálogo. Dorme
  enquanto essas famílias continuarem em modo PDF (sem ficha navegável).
- **`salida-horizontal-electroducto`** e **`salida-lateral-perfilado`** não
  têm `dimensionAxes`.
- **`public/sitemap.xml`** é estático, escrito à mão: 50 URLs,
  `lastmod` 2026-08-29, zero tapas. Quando o importador da planilha existir
  (seção 5.6 do `CLAUDE.md`), gerar o sitemap no mesmo `prebuild` que já
  gera o `search-index.json`.
- As 5 subfamílias existem, têm conteúdo pronto (`longDescription`, FAQ,
  `includedPages`) e **não são linkadas de lugar nenhum**. A grade da
  família bandejas é plana: 51 cards sem agrupamento visual.

---

## 7. Pendente com o Akira (pedido enviado 08/09)

- **Renders:** `CT3216`, `CT3222`, `CT3224`, `CT3226`, `CT3232`, `CT3234` —
  tapas sem imagem — mais a peça `CT3152` (reducción lateral izquierda, hoje
  mostrando o render errado, ver seção 5).
- **Planilha:** completar a aba `01_Bandejas` do `CT3142` pra baixo — lista
  completa na seção 2.
- **Confirmar** os 4 nomes de tapa corrigidos na seção 5.
- **Perfilados:** "Uso principal", "Aplicaciones" e "Unidad de venta" vazios
  nas 54 linhas da aba.
