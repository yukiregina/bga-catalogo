# PROMPT — Gabinetes: page-per-SKU + cajas cleanup before push (2026-09-13)

Paste into Claude Code at the root of `bga-catalogo`.

---

## Context

Two families were imported today (`cfa270f` cajas, `c81e59d` gabinetes) and are not pushed yet.
Cajas landed as **one page per SKU** (2 `subfamilia` hubs + 35 `producto` pages). Gabinetes landed
as **4 pages with variant selectors**, which hides 15 of the 16 spreadsheet rows behind dropdowns —
including all three PML placa sizes.

This prompt makes gabinetes match cajas, and fixes what cajas is missing.

**Source of truth:** `Claude outputs/gabinetes-planilha-oficial-2026-09-13.csv` (16 rows, aba
06_Gabinetes, already corrected by Akira). Do not invent technical data. Anything not in that file
or in the SEO CSVs below stays out.

Work in `lib/catalog.json` unless a section says otherwise. Sections 1–5 are the job; 6 and 7 are
optional and can be dropped without affecting the rest.

---

## 1. Gabinetes → 3 subfamilia hubs + 16 producto pages

Delete the 4 current `gabinetes` entries and rebuild. **No `variants` array anywhere in this
family.** Final shape: 3 hubs (not in the grid, reachable via chips — section 5) and 16 producto
pages (all in the grid).

### 1.1 Hubs (`"type": "subfamilia"`)

Same shape as `caja-metalica-galvanizada`, plus the SEO fields from the CSV in section 2.

| id | name | includedPages |
|---|---|---|
| `gabinete-modular-puerta-simple` | Gabinete Modular Puerta Simple | the 9 `gabinete-pm…` slugs marked Simple below, in table order |
| `gabinete-modular-puerta-doble` | Gabinete Modular Puerta Doble | `gabinete-pm19012080bc`, `gabinete-pm19012060bc`, `gabinete-pm19012040bc` |
| `placa-de-montaje-modular` | Placa de Montaje Modular | `placa-de-montaje-pml114`, `placa-de-montaje-pml74`, `placa-de-montaje-pml54` |

`images.primary` on each hub: keep `/images/productos/gabinete-modular-puerta-simple.webp`,
`…-doble.webp` and `…/placa-de-montaje-modular.webp` respectively.

`trillo-vertical-gabinete` gets **no hub** — it is a single SKU and sits directly in the grid.

### 1.2 The 12 gabinete producto pages

Slug rule follows cajas: `gabinete-{sku lowercased}`.

| slug | SKU | Alto | Ancho | Prof | Puerta | image | recommended |
|---|---|---|---|---|---|---|---|
| gabinete-pm1908080bc | PM1908080BC | 1900 | 800 | 800 | Simple | gabinete-modular-puerta-simple.webp | placa-de-montaje-pml74, trillo-vertical-gabinete |
| gabinete-pm1908060bc | PM1908060BC | 1900 | 800 | 600 | Simple | gabinete-modular-puerta-simple.webp | placa-de-montaje-pml74, trillo-vertical-gabinete |
| gabinete-pm1908040bc | PM1908040BC | 1900 | 800 | 400 | Simple | gabinete-modular-puerta-simple.webp | placa-de-montaje-pml74, trillo-vertical-gabinete |
| gabinete-pm1906080bc | PM1906080BC | 1900 | 600 | 800 | Simple | gabinete-modular-puerta-simple.webp | placa-de-montaje-pml54, trillo-vertical-gabinete |
| gabinete-pm1906060bc | PM1906060BC | 1900 | 600 | 600 | Simple | gabinete-modular-puerta-simple.webp | placa-de-montaje-pml54, trillo-vertical-gabinete |
| gabinete-pm1906040bc | PM1906040BC | 1900 | 600 | 400 | Simple | gabinete-modular-puerta-simple.webp | placa-de-montaje-pml54, trillo-vertical-gabinete |
| gabinete-pm19012080bc | PM19012080BC | 1900 | 1200 | 800 | Doble | gabinete-modular-puerta-doble.webp | placa-de-montaje-pml114, trillo-vertical-gabinete |
| gabinete-pm19012060bc | PM19012060BC | 1900 | 1200 | 600 | Doble | gabinete-modular-puerta-doble.webp | placa-de-montaje-pml114, trillo-vertical-gabinete |
| gabinete-pm19012040bc | PM19012040BC | 1900 | 1200 | 400 | Doble | gabinete-modular-puerta-doble.webp | placa-de-montaje-pml114, trillo-vertical-gabinete |
| gabinete-pm1506060bc | PM1506060BC | 1500 | 600 | 600 | Simple | gabinete-modular-puerta-simple.webp | placa-de-montaje-pml54, trillo-vertical-gabinete |
| gabinete-pm1508040bc | PM1508040BC | 1500 | 800 | 400 | Simple | gabinete-modular-puerta-simple.webp | placa-de-montaje-pml74, trillo-vertical-gabinete |
| gabinete-pm1508060bc | PM1508060BC | 1500 | 800 | 600 | Simple | gabinete-modular-puerta-simple.webp | placa-de-montaje-pml74, trillo-vertical-gabinete |

`dimensions` array, same label style as cajas — `Alto`, `Zócalo` (100 mm, fixed), `Ancho`,
`Profundidad`, `Puerta` (Simple/Doble), `Espesor cuerpo` (#14), `Espesor PLM` (#16), `IP` (IP55),
`Acabado` (`Beige RAL7032 / Naranja RAL2009`).

`unidadVenta`: `"Pieza"`. No `dimensionAxes`, no `variants` — the page **is** the measurement.

### 1.3 The 3 PML producto pages

| slug | SKU | Ancho | for gabinete | image | recommended |
|---|---|---|---|---|---|
| placa-de-montaje-pml114 | PML114 | 1145 | 1200 mm (puerta doble) | placa-de-montaje-modular.webp | gabinete-modular-puerta-doble, trillo-vertical-gabinete |
| placa-de-montaje-pml74 | PML74 | 745 | 800 mm | placa-de-montaje-modular.webp | gabinete-modular-puerta-simple, trillo-vertical-gabinete |
| placa-de-montaje-pml54 | PML54 | 545 | 600 mm | placa-de-montaje-modular.webp | gabinete-modular-puerta-simple, trillo-vertical-gabinete |

`dimensions`: `Ancho` (mm), `Aba` (20 mm), `Espesor` (#14).

`dimensionAxes` — these two stay, because the spreadsheet gives one SKU for all of them, not one
SKU per size:

```json
[
  { "id": "alto", "label": "Alto", "values": [50,100,150,200,250,300,350,400,450,500], "unit": "mm" },
  { "id": "acabado", "label": "Acabado", "values": ["Naranja RAL2009", "Galv. Natural"], "unit": "" }
]
```

Note the axis is **Alto**, not `largo` as the current import has it — the spreadsheet column is
"Alto (mm)". Same correction on the trillo below.

### 1.4 Trillo

Keep `trillo-vertical-gabinete` as is, with two edits: rename the `largo` axis to
`{ "id": "alto", "label": "Alto", "values": [1500,1900,2000], "unit": "mm" }`, and point
`recommended` at the three PML pages instead of the two gabinete hubs.

---

## 2. SEO for the 19 gabinete pages

Source: **`Claude outputs/seo-gabinetes-19-linhas-2026-09-13.csv`** — 3 subfamilia + 16 producto
rows, all `Revisado por BGA = Sí`, same 22-column layout as the other SEO CSVs.

Map per row: `Nombre de la página` → `name`, `Subtitle` → `subtitle`, `Title tag` → `meta.title`,
`Meta description` → `meta.description`, `Short description (card)` → `shortDescription`,
`Descripción larga` → `longDescription` (keep the `\n\n` paragraph breaks),
`FAQ n · pregunta/respuesta` → `faq[]` (skip empty pairs), `Palabras clave` → `keywords`.

Apply to hubs and producto pages alike — cajas producto pages currently have none of this, which is
what section 3 fixes.

---

## 3. Cajas: import the SEO that never landed

The 37 cajas pages are live with no `subtitle`, `shortDescription`, `longDescription`, `faq`,
`keywords` or `meta` — `generateMetadata` is falling through to the generic fallback on every one of
them. The text exists and was approved:

**`Claude outputs/seo-cajas-gabinetes-2026-09-12.csv`**, the 37 rows whose `pagina_slug` starts with
`caja-` (2 subfamilia + 35 producto). Same field mapping as section 2. Ignore the 4 gabinete rows in
that file — they are superseded by the CSV in section 2.

Also **rename** all 37 to the `Nombre de la página` value from that CSV: cards and H1 go from
`Caja Met 1000X600X250 Sobreponer, Con PLM #16/#16` to `Caja Metálica 1000×600×250 mm`. Keep the raw
spreadsheet name nowhere — the SKU is already in the spec area and that is what Aida matches on.

Leave the `dimensions`, `sku`, `unidadVenta` and `images` of the cajas pages untouched.

---

## 4. Images

Two converted files are staged but unused, and they are misnamed: `PLM80.jpg` / `PLM120.jpg` are not
photos of the placa — they are renders of the **gabinete frame with the placas mounted on the
trillos**. The actual placa photo is `PML.jpg` (`placa-de-montaje-modular.webp`), already used.

Rename in `public/images/productos/` and update the matching rows in `_manifest.csv` (`rol` becomes
`estructura`):

- `gabinete-modular-puerta-simple-placa-montaje.webp` → `gabinete-modular-estructura-800.webp`
- `gabinete-modular-puerta-doble-placa-montaje.webp` → `gabinete-modular-estructura-1200.webp`

Do **not** wire them into `catalog.json` yet — `ProductSheet` has no generic gallery slot (only
`primary`/`tapa`/`bySku`/`byAla`), and adding one is not worth doing in this pass. Section 7 has the
cheap alternative if you want them visible now.

Everything else in the untracked image set is already correct and just needs committing.

---

## 5. Chips: the hub pages have no inbound links

`getProductsByCategory` filters out `type: "subfamilia"`, so hub pages never appear in the grid or
in search. Only `bandejas` has `intentCards` pointing at its hubs — **perfilados (4), escaleras (5)
and tableros (2) hubs are orphaned today**, and gabinetes is about to add 3 more: 14 pages carrying
full SEO text with zero internal links pointing at them.

Add `intentCards` to those four categories, following the bandejas pattern (`label`, `description`,
`tag`, `href`), rendered as chips above the grid:

**tableros**
- `Caja Metálica Sobreponer` — "Chapa galvanizada, IP55, más de 30 medidas" — tag `31 medidas` — `/catalogo/tableros/caja-metalica-galvanizada/`
- `Caja Metálica Inoxidable` — "AISI 304 para ambientes de higiene exigente" — tag `AISI 304` — `/catalogo/tableros/caja-metalica-inox-304/`

**gabinetes**
- `Gabinete Modular Puerta Simple` — "600 u 800 mm de ancho, 1500 o 1900 de alto" — tag `9 medidas` — `/catalogo/gabinetes/gabinete-modular-puerta-simple/`
- `Gabinete Modular Puerta Doble` — "1200 mm de ancho, para tableros de gran porte" — tag `3 medidas` — `/catalogo/gabinetes/gabinete-modular-puerta-doble/`
- `Placa de Montaje Modular` — "Repuesto o placa adicional, tres anchos" — tag `Accesorio` — `/catalogo/gabinetes/placa-de-montaje-modular/`

**perfilados** and **escaleras** — one chip per existing hub, `label` = hub `name`, `description` =
first sentence of the hub's `shortDescription`, `tag` = `N piezas` from `includedPages.length`.

---

## 6. Rebuild, verify, commit

```bash
node scripts/build-search-index.mjs
npm run build
```

Check before committing:

1. `lib/catalog.json` — `gabinetes` has exactly 19 entries: 3 `subfamilia`, 16 `producto`, and the
   string `"variants"` does not appear anywhere under `categoryId: "gabinetes"`.
2. `/catalogo/gabinetes/` grid renders 16 cards; every card shows its measurement in the name.
3. `/catalogo/tableros/` grid renders 35 cards with the new clean names.
4. Every one of the 37 cajas pages and 19 gabinete pages has a non-generic `<title>` and
   `<meta name="description">` in `out/`.
5. `lib/search-index.json` goes from 151 to 163 entries (gabinetes 4 → 16).
6. Every `recommended` code resolves — `resolveRecommendedProducts` drops unknown ids silently, so
   grep for the 16 new slugs and confirm each appears as both a page id and a recommendation target.
7. The five chips in section 5 resolve to real hub pages (no 404).

Commit as three commits, so a revert is surgical:

```
content: gabinetes vira uma página por SKU, sem variantes
content: importa SEO de cajas e renomeia as 37 páginas
feat: chips de navegação para as subfamílias de perfilados, escaleras, tableros e gabinetes
```

Then push.

---

## 7. Optional — hero image on the hub pages

`SubfamilyView` renders breadcrumb → H1 → longDescription → grid → FAQ, with no image. Adding an
`<img src={subfamilia.images.primary}>` above the description (aspect-square, `object-contain`,
max ~280px, same card styling as the grid) gives all 19 hubs a visual, and lets the two
`gabinete-modular-estructura-*.webp` renders from section 4 be used as the hub image for puerta
simple and puerta doble — which is the clearest picture of what "modular" means in this line.

Isolated to one component; skip it if you would rather push first.

---

## Open items — not blockers, do not guess

- **`Con TL, Con TT` in the spreadsheet product names.** The current live copy reads them as
  "trillos verticales". Not confirmed by Akira. The copy in the new CSV says "trillos" without
  expanding the abbreviation — ask him what TL and TT stand for before making it more specific.
- **`Unidad de venta` is empty in all 16 rows** of aba 06_Gabinetes. Using "Pieza" by analogy with
  cajas. Confirm.
- **`Normas que cumple` is empty** for the whole gabinetes family. No norm is claimed anywhere in
  this import — keep it that way until Akira fills the column.
- **PTL / PLT** — the spreadsheet calls the trillo `PTL` in the photo column, the real file is
  `PLT.jpg`, the SKU column says `PLT`. Using `PLT`. Still uncorrected upstream.
- **Photos**: 12 gabinete pages share 2 renders and 3 PML pages share 1. Worth asking Akira for a
  render per ancho at least.
