# PROMPT — Import cajas (05_Cajas) + gabinetes (06_Gabinetes) + images

Context: the `05_Cajas` (35 SKUs) and `06_Gabinetes` (16 rows) tabs of the
official spreadsheet (`BGA_Catalog_Template_vF`, native Google Sheets, id
`1h2L1QS4rBOglMtwdk472kh9kN6wdpvU1I5K0yFm6_XI`, account `mkt@bga.com.py`)
came in with technical data. Photos are in `Desktop/6. CAJAS/` and
`Desktop/7. GABINETES/`.

Read the root `CLAUDE.md` before starting. Gabinetes stays
**"as simple as possible"** (same depth as perfilados/escaleras/tableros)
— a product page with a size dropdown. Cajas changed: each size is now its
own page, no dropdown (see section 2).

## Files in this batch

| File | What it is |
| --- | --- |
| `seo-cajas-gabinetes-2026-09-12.csv` | 41 rows of SEO/GEO copy (in Spanish — it's site content) — Gabinetes (4 rows) approved; Cajas (2 subfamily + 35 product rows) **pending re-approval** after the switch to page-per-SKU |
| `cajas-planilha-oficial-2026-09-13.csv` | fresh export of the `05_Cajas` tab (30 columns, technical data) |
| `gabinetes-planilha-oficial-2026-09-13.csv` | fresh export of the `06_Gabinetes` tab (29 columns, technical data) — pulled AFTER the sheet fix below, so it's the corrected version |
| This PROMPT | page structure + technical import notes |

Images already converted and in `public/images/productos/` (webp, 1400px
wide, quality 82, white background), with rows already added to
`public/images/productos/_manifest.csv` — no need to reconvert anything,
just link them in the JSON.

## ✅ 06_Gabinetes fixed in the sheet itself (09/13) — unblocked

Yuki and Akira actually fixed the spreadsheet, not just confirmed the
code verbally: the `SKU` column now holds the real product code
(`PM1908080BC`, etc.) instead of an order number, and the column that used
to be mislabeled `Destaque` is now labeled `código` (both columns hold the
same value, which is fine). I pulled a fresh export after this fix —
`gabinetes-planilha-oficial-2026-09-13.csv` — use that instead of the SEO
CSV's SKU list for the technical import. `Orden` and `Activo` both read
"Sí" uniformly across the 16 rows, all consistent — treat all 16 as
active/published.

There's still a minor mismatch they didn't touch: the spreadsheet calls
the vertical rail `PTL` in `Archivo foto`, but the real file in the folder
is `PLT.jpg` — same kind of typo as `CL5114`/`CL5111` in escaleras. I used
`PLT.jpg` since that's the one that exists.

## 1. Color: fixed combo, NOT a variant (corrected 09/12)

Confirmed by Yuki: in `05_Cajas` and `06_Gabinetes`, "Beige RAL7032 /
Naranja RAL2009" is a **fixed factory combo** — body and door in Beige
RAL7032, interior mounting plate in Naranja RAL2009. It's not a color
selector like in bandejas. The SEO copy for `caja-metalica-galvanizada`,
`gabinete-modular-puerta-simple` and `gabinete-modular-puerta-doble` was
adjusted to describe it as fixed text, no selector — don't add a color
field to `catalog.json` for these three pages.

For `placa-de-montaje-modular`, **confirmed by Yuki (09/12)**: color does
stay separate here (a 2-finish selector, Naranja RAL2009 / natural
galvanized) — not a fixed combo like cajas/gabinetes. It should also show
up as a recommended accessory on the gabinete modular pages (already
planned in section 2 below; the SEO copy now mentions this too in the long
description).

For `trillo-vertical-gabinete` I kept the same 2-finish selector by
analogy with the plate, but this **was not explicitly confirmed by
Yuki** — flag it if it applies too, or if the trillo has a different rule.

## 2. Structure — Cajas switched to page-per-SKU (09/13, Yuki's correction)

Yuki looked at the result of the "page=concept, SKU=selection" pattern
applied to Cajas and it felt off: 31 sizes hidden behind a dropdown, only
2-3 generic photos, nothing distinguishable on the family grid. She asked
for one card per size, with name and size visible up front — no size
selector.

This pattern already exists in the template: it's the same
`Tipo de página = subfamilia` mechanism perfilados uses for grouping
(`curvas-de-perfilado`, `uniones-de-perfilado`, etc.). I applied the same
mechanism here:

| pagina_slug | Tipo de página | What it is |
| --- | --- | --- |
| `caja-metalica-galvanizada` | **subfamilia** | groups the 31 product pages below — use for breadcrumb/hub, has no ficha of its own with a dropdown |
| `caja-metalica-inox-304` | **subfamilia** | groups the 4 inox product pages |
| `caja-{sku lowercase}` (31) | producto | one page per size — NO variant axis, N°=1, just the image + specs for that size |
| `caja-{sku lowercase}` (4, inox) | producto | same, for the 4 `CSX...` SKUs |
| `gabinete-modular-puerta-simple` | producto | 9 SKUs (`PM19080*BC`, `PM19060*BC`, `PM15060*BC`, `PM15080*BC`) — still uses the size selector, Yuki didn't ask to change this |
| `gabinete-modular-puerta-doble` | producto | 3 SKUs (`PM19012*BC`) — still uses the selector |
| `placa-de-montaje-modular` | producto | `PML114`, `PML74`, `PML54` — still uses the selector |
| `trillo-vertical-gabinete` | producto | `PLT` (real code to confirm) — still uses the selector |

**Heads up:** I left Gabinetes' size selector untouched because Yuki asked
for the change only on Cajas. But the same problem could show up on
`gabinete-modular-puerta-simple` (9 sizes) — less severe than 31, but
worth showing her the result before assuming it doesn't need the same
treatment there.

The 41 SEO rows are already in the regenerated
`seo-cajas-gabinetes-2026-09-12.csv` — the 33 Cajas rows (2 subfamily + 31
product + 4 inox) came back with `Revisado por BGA` blank again, because
the structure change invalidates the previous approval — this needs to go
back to Yuki (or she reviews it herself) before treating the copy as
final.

placa-de-montaje-modular and trillo-vertical-gabinete are gabinete modular
accessories — link them as `recommended` from both gabinete pages, and
vice versa.

## 3. Special/off-catalog size → sales rep

Across the 41 Cajas and Gabinetes pages, the SEO copy makes clear the
listed sizes are the factory standard (the `Es medida estándar?` column in
`05_Cajas` confirms `Sí` on all 35 rows) and that a size outside the list
gets routed to the sales rep. On the 35 individual Cajas pages this is now
a dedicated FAQ ("¿Y si necesito una medida distinta a esta?" — "What if I
need a different size than this one?") — Yuki asked for this to be clearly
visible, not just mentioned in passing inside the long description. No new
schema field needed: it's the same "Necesito ayuda técnica" flow that
already exists in the cart.

## 4. Cajas — data is clean, SEO needs re-approval after the structure change

The `05_Cajas` tab is well aligned (SKU, Orden, Activo, Código, Nombre
ES… all in the right place) and the fresh export
`cajas-planilha-oficial-2026-09-13.csv` is already in Claude outputs/ —
the technical data can be imported now. The Cajas SEO copy, though, is
unapproved again (section 6) because of the page-per-SKU change — better
to wait for the go-ahead before pasting the text in, even though the
technical data + images can already be wired up.

Technical fields → `dimensionAxes`/`dimensions` (Alto/Ancho/Profundidad),
`Espesor Cuerpo` + `Espesor PLM` → spec sheet fields, `Acabado/Color`,
`IP/Norma`, `Características especiales` → spec text. `Es medida
estándar?` has no equivalent in the current schema — leave it out for now,
don't invent a new field.

## 5. Gabinetes — cleared to import

The data question in the "✅" section above is resolved — the sheet itself
was corrected, not just confirmed by word. Use
`gabinetes-planilha-oficial-2026-09-13.csv` for the technical data.
Gabinetes can be imported in this pass along with Cajas: technical data +
SEO copy (already approved, `Revisado por BGA = Sí` on all 4 rows)
together. Mark all 16 products `Activo: true`, matching the sheet.

## 6. SEO — Gabinetes approved, Cajas back to pending approval

History: Yuki approved the original 6 rows on 09/13 (`Revisado por
BGA = Sí`). That same day she asked to switch Cajas to page-per-SKU
(section 2), which rewrote those 2 Cajas rows into 33 new rows (2
subfamily + 31 product + 4 inox) — they came back with `Revisado por BGA`
blank because it's new copy, not what she'd already seen.

The 4 Gabinetes rows did NOT change — they're still `Revisado por
BGA = Sí`, not waiting on Akira for the text (the Gabinetes block is only
about the SKU/Código data, "⚠️" section above).

Still need to paste the 41 rows into the spreadsheet's `07_TEXTOS_SEO`
tab — I have no way to edit Sheets cells from here, only whole files via
Drive.

## 7. Images — ready, now split across 35 pages

We're still working with the same 3 cajas photos (there's no real photo
per size) — with page-per-SKU, each of the 35 product pages gets assigned
one of those 3 images based on its relative size (top third by volume →
`-grande`, bottom third → `-chica`, the rest → the generic one). It's a
split by volume (Alto×Ancho×Profundidad), not a real photo per size —
this fixes the text problem (name+size visible), but the image still
repeats across several pages. If Akira gets more real photos later, this
is easy to swap for one image per SKU.

Full mapping (31 galvanized + 4 inox):

| pagina_slug | SKU | size (H×W×D mm) | assigned image |
| --- | --- | --- | --- |
| caja-cs1006025cc | CS1006025CC | 1000×600×250 | `caja-metalica-galvanizada-grande.webp` |
| caja-cs1006025dc | CS1006025DC | 1000×600×250 | `caja-metalica-galvanizada-grande.webp` |
| caja-cs1006040cc | CS1006040CC | 1000×600×400 | `caja-metalica-galvanizada-grande.webp` |
| caja-cs1008030cc | CS1008030CC | 1000×800×300 | `caja-metalica-galvanizada-grande.webp` |
| caja-cs1008030dc | CS1008030DC | 1000×800×300 | `caja-metalica-galvanizada-grande.webp` |
| caja-cs1206025cc | CS1206025CC | 1200×600×250 | `caja-metalica-galvanizada-grande.webp` |
| caja-cs1208030cc | CS1208030CC | 1200×800×300 | `caja-metalica-galvanizada-grande.webp` |
| caja-cs1208035cc | CS1208035CC | 1200×800×350 | `caja-metalica-galvanizada-grande.webp` |
| caja-cs202015ed | CS202015ED | 200×200×150 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs302015dd | CS302015DD | 300×200×150 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs302015ed | CS302015ED | 300×200×150 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs302020dd | CS302020DD | 300×200×200 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs302020ed | CS302020ED | 300×200×200 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs352515ed | CS352515ED | 350×250×150 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs403020cc | CS403020CC | 400×300×200 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs403020dc | CS403020DC | 400×300×200 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs403020dd | CS403020DD | 400×300×200 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs403020ed | CS403020ED | 400×300×200 | `caja-metalica-galvanizada-chica.webp` |
| caja-cs404020dd | CS404020DD | 400×400×200 | `caja-metalica-galvanizada.webp` |
| caja-cs404025dc | CS404025DC | 400×400×250 | `caja-metalica-galvanizada.webp` |
| caja-cs404030dc | CS404030DC | 400×400×300 | `caja-metalica-galvanizada.webp` |
| caja-cs504020dc | CS504020DC | 500×400×200 | `caja-metalica-galvanizada.webp` |
| caja-cs504020dd | CS504020DD | 500×400×200 | `caja-metalica-galvanizada.webp` |
| caja-cs504025dc | CS504025DC | 500×400×250 | `caja-metalica-galvanizada.webp` |
| caja-cs604020dc | CS604020DC | 600×400×200 | `caja-metalica-galvanizada.webp` |
| caja-cs604020dd | CS604020DD | 600×400×200 | `caja-metalica-galvanizada.webp` |
| caja-cs605020dc | CS605020DC | 600×500×200 | `caja-metalica-galvanizada.webp` |
| caja-cs605025dc | CS605025DC | 600×500×250 | `caja-metalica-galvanizada.webp` |
| caja-cs705015dc | CS705015DC | 700×500×150 | `caja-metalica-galvanizada.webp` |
| caja-cs705025dc | CS705025DC | 700×500×250 | `caja-metalica-galvanizada-grande.webp` |
| caja-cs806025dc | CS806025DC | 800×600×250 | `caja-metalica-galvanizada-grande.webp` |

The 4 inox SKUs share the one photo that exists
(`caja-metalica-inox-304.webp`) — there's no grande/chica split for that
line.

The other 10 files (gabinetes) are unchanged:

| pagina_slug | role | file |
| --- | --- | --- |
| `gabinete-modular-puerta-simple` | primary | `gabinete-modular-puerta-simple.webp` |
| `gabinete-modular-puerta-simple` | mounting-plate | `gabinete-modular-puerta-simple-placa-montaje.webp` |
| `gabinete-modular-puerta-doble` | primary | `gabinete-modular-puerta-doble.webp` |
| `gabinete-modular-puerta-doble` | mounting-plate | `gabinete-modular-puerta-doble-placa-montaje.webp` |
| `placa-de-montaje-modular` | primary | `placa-de-montaje-modular.webp` |
| `trillo-vertical-gabinete` | primary | `trillo-vertical-gabinete.webp` |

Still unused (`6. CAJAS` folder): `IMG_0848.HEIC`, `IMG_0851.HEIC` and the
`WhatsApp Image...jpg` have no identifiable SKU — they didn't make it into
the manifest. Ask Akira which product they belong to before using them.

## 8. Wrap-up

- Cajas: run `scripts/build-search-index.mjs` after the import.
- Gabinetes: cleared to import too (section 5) — run the same index build
  step after.
- Commit using conventional commits, split by family
  (`content: import cajas family`, `content: import gabinetes family`).
