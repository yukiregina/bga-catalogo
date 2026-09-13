# PROMPT — 4 peças novas em perfilados (KIT2227, FXS6221, FXS6219, FXS6235) + SEO + recomendados

*(11/09/2026, v2 — corrige a v1: sem subfamília nova, as 4 peças entram como
acessório solto igual `CT3211`; as 4 fotos já chegaram na pasta. Cole este
arquivo inteiro no Claude Code, dentro de `bga-catalogo`. Leia o `CLAUDE.md`
da raiz antes de começar.)*

## Contexto

O Akira acrescentou 4 linhas no final da aba `03_PerfiladosF` da planilha
oficial (`BGA_Catalog_Template_vF`, Google Sheets, id
`1h2L1QS4rBOglMtwdk472kh9kN6wdpvU1I5K0yFm6_XI`) e preencheu a coluna
`Recomendados (código)` em praticamente todo o resto da família — que antes
só tinha recomendação nas 13 peças do grupo "curvas" (apontando pra
`KIT2227`, que na época nem existia como produto).

Puxei a planilha ao vivo agora (11/09) e salvei o snapshot completo em
`Claude outputs/perfilados-planilha-oficial-2026-09-11.csv` — use esse CSV
como fonte de verdade se precisar conferir algum campo; os dados abaixo já
foram extraídos dele.

**Import anterior de referência:** `PROMPT-perfilados-seo-import-2026-09-09.md`
nesta mesma pasta — mesma família, mesmo schema. Este prompt só cobre o
delta desta rodada, não repete os 31 SKUs já importados.

## 0. Sobre o KIT2227: ele já saiu do catalog.json uma vez

No import de 09/09, `KIT2227` foi removido do `catalog.json` porque não
aparecia em nenhuma aba da planilha (junto com `ST2260` e `ST2267`, que
**continuam fora** — não voltaram na planilha, não mexer neles). Agora o
Akira colocou `KIT2227` de volta, desta vez com dado completo e um SKU
(`Orden 450`) — não é o mesmo problema de antes, é peça nova de verdade.
Como consequência, os 14 produtos que já tinham `"recommended": ["KIT2227", ...]`
no JSON (mas apontavam pro nada, porque `resolveRecommendedProducts` em
`lib/products.js` ignora código que não existe) passam a resolver de
verdade assim que este produto entrar. Não precisa tocar nesses 14 — eles já
estão certos, só esperando o produto existir.

## 1. Os 4 produtos novos — inserir em `lib/catalog.json`

**Entram como acessório solto, sem subfamília** — igual `CT3211` hoje: um
`"type": "producto"` dentro de `categoryId: "perfilados"`, sem aparecer em
nenhum array `includedPages`. Schema idêntico aos demais produtos da
família (peguei como referência `ST2242`, `ST2254` e `CT3211`, que já estão
no arquivo). Inserir os quatro logo depois de `ST2254` (o último produto de
perfilados hoje) e antes das subfamílias (`curvas-de-perfilado`,
`uniones-de-perfilado`, `soportes-y-fijacion-perfilado`,
`salidas-y-cajas-perfilado`) — mesma posição que `CT3211` ocupa hoje em
relação aos produtos com subfamília.

```json
{
  "id": "KIT2227",
  "categoryId": "perfilados",
  "type": "producto",
  "name": "Kit de Uniones para Perfilado",
  "subtitle": "Tornillería para empalme de tramos",
  "shortDescription": "Kit de Uniones para perfilado BGA — tornillería para empalmar dos tramos de perfilado 38x38.",
  "longDescription": "El kit de uniones trae la tornillería necesaria para empalmar dos tramos de perfilado 38x38 — bulones, arandelas y tuercas.\n\nEs el complemento recomendado para las uniones externa, interna, en L, T y X, y para la platabanda de refuerzo.\n\nDisponible en chapa pregalvanizada (PZ), acero inoxidable AISI 304 y AISI 316, con galvanizado por inmersión en caliente (GF) o pintura electrostática en los colores estándar de BGA para aplicaciones expuestas.\n\nFabricado en Paraguay por BGA Electric S.A. Cumple NBR IEC 61537 (Sistemas de Eletrocalhas e Leitos para Cabos). Se vende por pieza.",
  "faq": [
    { "q": "¿Qué trae el kit?", "a": "Bulones, arandelas y tuercas para empalmar dos tramos de perfilado 38x38." },
    { "q": "¿Con qué piezas de unión se usa?", "a": "Con la unión externa, interna, en L, T y X, y con la platabanda de refuerzo." }
  ],
  "keywords": "kit de uniones perfilado, tornillería para perfilado, kit de empalme 38x38",
  "meta": {
    "title": "Kit de Uniones para Perfilado | BGA Paraguay",
    "description": "Kit de Uniones para perfilado 38x38: tornillería para empalme de tramos. Fabricado en Paraguay por BGA Electric. Cotizá online."
  },
  "dimensionAxes": [
    { "id": "espesor", "label": "Espesor", "values": ["#12", "#14", "#16", "#18", "#20", "#22"], "unit": "" }
  ],
  "dimensions": [
    { "label": "perfil", "value": "38x38", "unit": "mm" }
  ],
  "unidadVenta": "Pieza",
  "finishes": ["pz", "aisi304", "aisi316", "gf", "elec"],
  "recommended": ["FXS6221"],
  "images": {
    "primary": "/images/productos/kit-de-uniones-para-perfilado-kit2227.webp"
  },
  "page": 4
},
{
  "id": "FXS6221",
  "categoryId": "perfilados",
  "type": "producto",
  "name": "Bulón 5/16\" con Traba, Arandela y Tuerca",
  "subtitle": "Tornillería suelta para perfilado y accesorios",
  "shortDescription": "Bulón 5/16\" BGA — con traba, arandela y tuerca, para empalme de perfilado y montaje de accesorios.",
  "longDescription": "El bulón 5/16\" con traba, arandela y tuerca es tornillería suelta para empalmar tramos de perfilado o fijar accesorios sobre el perfil.\n\nSe usa cuando se necesita reponer o completar tornillería, sin comprar el kit completo.\n\nDisponible en chapa pregalvanizada (PZ) y acero inoxidable AISI 304.\n\nFabricado en Paraguay por BGA Electric S.A. Se vende por pieza.",
  "faq": [
    { "q": "¿Sirve para reponer tornillería perdida?", "a": "Sí, se vende suelto para completar o reponer sin comprar el kit completo." },
    { "q": "¿En qué se usa?", "a": "En el empalme de tramos de perfilado y en el montaje de accesorios sobre el perfil." }
  ],
  "keywords": "bulón 5/16 perfilado, tornillería suelta perfilado, bulón con traba",
  "meta": {
    "title": "Bulón 5/16\" para Perfilado | BGA Paraguay",
    "description": "Bulón 5/16\" con traba, arandela y tuerca, para perfilado y accesorios. Fabricado en Paraguay por BGA Electric. Cotizá online."
  },
  "dimensions": [
    { "label": "rosca", "value": "5/16", "unit": "\"" }
  ],
  "unidadVenta": "Pieza",
  "finishes": ["pz", "aisi304"],
  "images": {
    "primary": "/images/productos/bulon-5-16-con-traba-arandela-y-tuerca-fxs6221.webp"
  },
  "page": 4
},
{
  "id": "FXS6219",
  "categoryId": "perfilados",
  "type": "producto",
  "name": "Tuerca Losangular con Pino 1/4\", Arandela y Tuerca",
  "subtitle": "Fijación de soportes y accesorios sobre el perfil",
  "shortDescription": "Tuerca losangular BGA — con pino 1/4\", arandela y tuerca, para fijar soportes y accesorios sobre el perfilado.",
  "longDescription": "La tuerca losangular con pino 1/4\" se inserta en la ranura del perfilado para fijar soportes y accesorios, sin necesidad de perforar.\n\nViene con arandela y tuerca para completar el montaje.\n\nDisponible en chapa pregalvanizada (PZ) y acero inoxidable AISI 304.\n\nFabricado en Paraguay por BGA Electric S.A. Se vende por pieza.",
  "faq": [
    { "q": "¿Necesito perforar el perfilado para usarla?", "a": "No, se inserta directamente en la ranura del perfil." },
    { "q": "¿Para qué se usa?", "a": "Para fijar soportes y accesorios sobre el perfilado." }
  ],
  "keywords": "tuerca losangular perfilado, tuerca de ranura, fijación sin perforar perfilado",
  "meta": {
    "title": "Tuerca Losangular para Perfilado | BGA Paraguay",
    "description": "Tuerca losangular con pino 1/4\", arandela y tuerca, para perfilado. Fabricado en Paraguay por BGA Electric. Cotizá online."
  },
  "dimensions": [
    { "label": "rosca", "value": "1/4", "unit": "\"" }
  ],
  "unidadVenta": "Pieza",
  "finishes": ["pz", "aisi304"],
  "images": {
    "primary": "/images/productos/tuerca-losangular-con-pino-1-4-arandela-y-tuerca-fxs6219.webp"
  },
  "page": 4
},
{
  "id": "FXS6235",
  "categoryId": "perfilados",
  "type": "producto",
  "name": "Varilla Roscada con Tuercas y Arandelas",
  "subtitle": "Suspensión regulable · 1/4\" o 5/16\", 1000 o 3000 mm",
  "shortDescription": "Varilla Roscada BGA — con tuercas y arandelas, para suspensión regulable del perfilado en 1/4\" o 5/16\", largo 1000 o 3000 mm.",
  "longDescription": "La varilla roscada permite suspender y regular la altura del perfilado desde la estructura, junto con el soporte correspondiente.\n\nViene con tuercas y arandelas incluidas, en dos diámetros de rosca (1/4\" y 5/16\") y dos largos (1000 y 3000 mm).\n\nDisponible en chapa pregalvanizada (PZ) y acero inoxidable AISI 304.\n\nFabricado en Paraguay por BGA Electric S.A. Se vende por pieza.",
  "faq": [
    { "q": "¿Qué diámetro elijo?", "a": "Depende del soporte con el que se combina — consultar con la vendedora según la pieza de suspensión." },
    { "q": "¿Qué largo conviene?", "a": "1000 mm para distancias cortas a la estructura; 3000 mm cuando la suspensión es más larga." }
  ],
  "keywords": "varilla roscada perfilado, varilla de suspensión, rosca 1/4 5/16 perfilado",
  "meta": {
    "title": "Varilla Roscada para Perfilado | BGA Paraguay",
    "description": "Varilla roscada con tuercas y arandelas: 1/4\" o 5/16\", 1000 o 3000 mm. Fabricado en Paraguay por BGA Electric. Cotizá online."
  },
  "dimensionAxes": [
    { "id": "rosca", "label": "Rosca", "values": ["1/4\"", "5/16\""], "unit": "" },
    { "id": "largo", "label": "Largo", "values": [1000, 3000], "unit": "mm" }
  ],
  "unidadVenta": "Pieza",
  "finishes": ["pz", "aisi304"],
  "images": {
    "primary": "/images/productos/varilla-roscada-con-tuercas-y-arandelas-fxs6235.webp"
  },
  "page": 4
}
```

**Nota sobre a NBR IEC 61537:** mantive a frase de conformidade só no
KIT2227 (ele é parte do sistema de bandeja/perfilado propriamente dito).
Nos 3 itens de tornillería solta (`FXS6221`, `FXS6219`, `FXS6235`) eu tirei
essa frase — não são o eletroduto/perfil em si, são parafusaria genérica, e
não tenho como confirmar que a norma cobre esse tipo de peça solta. Se você
souber que se aplica, é só voltar a incluir a frase padrão dos outros
produtos.

## 2. Atualizar `recommended` em 17 produtos já existentes

O Akira preencheu `Recomendados (código)` em quase toda a família — antes só
as 13 peças de "curvas" + `ST2011`/`ST2111` tinham (apontando pra
`KIT2227`, `ST2242`, `ST2252` — isso **não muda**, deixa como está). O que é
novo é isto aqui — adicionar o campo `"recommended"` nestes 17 produtos, que
hoje não têm o campo:

| SKU | `recommended` novo |
| --- | --- |
| ST2226 | `["FXS6221"]` |
| ST2227 | `["FXS6221"]` |
| ST2228 | `["FXS6221"]` |
| ST2229 | `["FXS6221"]` |
| ST2230 | `["FXS6221"]` |
| ST2239 | `["FXS6221"]` |
| ST2237 | `["FXS6219"]` |
| ST2242 | `["FXS6235", "FXS6219"]` |
| ST2243 | `["FXS6235", "FXS6219"]` |
| ST2244 | `["FXS6235", "FXS6219"]` |
| ST2245 | `["FXS6235", "FXS6219"]` |
| ST2246 | `["FXS6235"]` |
| ST2249 | `["FXS6221", "FXS6219"]` |
| ST2250 | `["FXS6221", "FXS6219"]` |
| ST2251 | `["FXS6221", "FXS6219"]` |
| ST2252 | `["FXS6221"]` |
| ST2254 | `["FXS6235"]` |

`CT3211` continua sem `recommended` — a planilha não tem nada nessa célula
pra ele.

**Sobre `FX6235`/`FX6219`:** na planilha, a coluna `Recomendados` de
`ST2242`, `ST2243`, `ST2244`, `ST2245`, `ST2246` e `ST2254` está escrita
`FX6235` (sem o S) — e os arquivos de foto de `FXS6235` e `FXS6219` também
chegaram nomeados `FX6219.jpg` (o de `FXS6235` chegou certo, `FXS6235.jpg`).
Tratei como erro de digitação recorrente de quem preenche a planilha/nomeia
as fotos, e normalizei tudo pra `FXS6235`/`FXS6219` (os SKUs oficiais das
linhas) na tabela acima e nos nomes de arquivo webp da seção 3. Confirma
com o Akira quando puder.

## 3. Imagens — as 4 fotos já estão na pasta

Conferi `2. PERFILADOS JPG/` agora: as 4 chegaram —
`KIT2227.jpg`, `FXS6221.jpg`, `FX6219.jpg` (repara: sem o S, é a foto do
`FXS6219`) e `FXS6235.jpg`. Converter as 4 pro padrão que o resto de
`productos/` já usa — 1400 px de largura, qualidade 82, fundo branco
achatado:

```
magick "KIT2227.jpg"  -resize 1400x -background white -flatten -quality 82 public/images/productos/kit-de-uniones-para-perfilado-kit2227.webp
magick "FXS6221.jpg"  -resize 1400x -background white -flatten -quality 82 public/images/productos/bulon-5-16-con-traba-arandela-y-tuerca-fxs6221.webp
magick "FX6219.jpg"   -resize 1400x -background white -flatten -quality 82 public/images/productos/tuerca-losangular-con-pino-1-4-arandela-y-tuerca-fxs6219.webp
magick "FXS6235.jpg"  -resize 1400x -background white -flatten -quality 82 public/images/productos/varilla-roscada-con-tuercas-y-arandelas-fxs6235.webp
```

Se não tiver ImageMagick, um script Node com `sharp` faz o mesmo
(`.resize({width:1400}).flatten({background:'#fff'}).webp({quality:82})`).
Os quatro caminhos já estão certos nos `images.primary` da seção 1 — não
precisa editar de novo, só gerar os arquivos.

## 4. Depois de importar

- Rodar `node scripts/build-search-index.mjs` (ou o comando de prebuild que
  já existe) pra regerar `search-index.json`.
- `npm run build` tem que passar.
- Dois commits separados (conventional commits):
  1. `content: adiciona 4 SKUs novos de perfilados (KIT2227, FXS6221, FXS6219, FXS6235)`
     — os 4 produtos e as 4 imagens.
  2. `content: cruza recomendados de perfilados com as 4 peças novas` — os
     17 produtos da seção 2.
