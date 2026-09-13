# Import the "Bandejas de Alambre" family into the catalog

Date: 2026-09-13. Paste into Claude Code at the root of `bga-catalogo`.

Supersedes the earlier version of this file. The source data was found in the
client spreadsheet (`BGA_Catalog_Template_vF`, tab **"Bandejas Aramadas"**,
7 SKUs) — the family is far better documented than assumed, so this is a full
import, not a stub.

---

## Context

`bandejas-de-alambre` was renamed and reordered in commit `a829395` but is still
`displayMode: "contact"` with zero products — that is why the family page shows
only the WhatsApp block.

This task adds **6 product pages covering 7 SKUs** and switches the family to
catalog mode. All copy is Spanish (Paraguayan market) and already written.

## Source data (from the spreadsheet, for reference)

| SKU | Nombre ES | Ancho (mm) | Ala (mm) | Long. | Espesor |
| --- | --- | --- | --- | --- | --- |
| WTX7011 | Bandeja de Alambre 3/16" | 50–600 (8 valores) | 30,50,100 | 3000 | 3/16" |
| WTX7111 | Bandeja de Alambre 1/4" | 50–600 (8 valores) | 30,50,100 | 3000 | 1/4" |
| WTX7062B | Unión Simple #14, bulón M6 y tuerca | — | — | — | #14 |
| KITX7062B | Kit Unión, 2 conjuntos + 2 bulones M6 | — | — | — | #14 |
| WTX3071 | Mano Francesa Triangular | 50–600 (12 valores) | — | — | #14–#20 |
| WTX7120 | Soporte Travesaño Omega 38×25 | 200–600 (9 valores) | — | — | #14–#18 |
| WTX712164 | Soporte Acople Vertical 60×40 | — | — | — | #14–#18 |

Materiales (all 7 rows): `PZ; GF; IN304; IN316`.
Normas (all 7 rows): the same string used by bandejas, perfilados and escaleras.

## Page structure — 6 pages, 7 SKUs

| Page id | SKUs | Measure axes |
| --- | --- | --- |
| `bandeja-portacable-de-alambre` | WTX7011 + WTX7111 (variants) | ancho, ala |
| `union-simple-alambre` | WTX7062B | — |
| `kit-de-uniones-alambre` | KITX7062B | — |
| `mano-francesa-triangular-alambre` | WTX3071 | ancho |
| `soporte-travesano-omega-alambre` | WTX7120 | ancho |
| `soporte-acople-vertical-alambre` | WTX712164 | — |

The two trays share one page because they are the same product in two wire
diameters — same widths, same alas, same finishes. That is the template rule
(page = concept, SKU = selection) and it matches how `bandeja-portacables`
handles CT3011/CT3012/CT3111/CT3112.

## Task 1 — Add the 6 products

Read `Claude outputs/alambre-products-2026-09-13.json`. It is an array of 6
product objects already shaped to the schema in `lib/catalog.json`. Append all 6
to the `products` array. Do not reformat the rest of the file.

## Task 2 — Switch the category to catalog mode

In the `bandejas-de-alambre` category object:

- `displayMode`: `"contact"` → `"catalog"`
- keep `badge: "Nueva línea"`, keep it last in the array, keep `image` and `description`

Do **not** add `richDescription`, `intentCards` or `materialTable` — `perfilados`
and `escaleras` run on the fallback layout and this family should match them.

## Task 3 — Rebuild

```
node scripts/build-search-index.mjs
npm run build
```

The index only covers `displayMode: "catalog"` families, so it should grow by 6.

## Task 4 — Verify

- home: last card reads "6 productos" and still shows the "Nueva línea" badge
- `/catalogo/bandejas-de-alambre/` renders a 6-card grid, not the WhatsApp block
- the tray page shows the variant selector (3/16" and 1/4"), the ancho axis
  (8 values), the ala axis (3 values) and 4 finishes; the thumbnail changes
  between WTX7011 and WTX7111
- `soporte-travesano-omega-alambre` has no image — confirm it renders the
  placeholder cleanly instead of a broken `<img>`
- all `recommended` ids resolve (they were checked at generation; re-verify after import)
- site search returns the pages for "alambre" and for "malla"

## Commit

```
content: importa familia bandejas de alambre com 6 paginas e 7 SKUs
```

---

## Flag to the client before publishing

1. **`Activo = No` on all 7 rows.** The spreadsheet marks the whole family as
   inactive. Yuki decided to publish anyway (the family carries a "Nueva línea"
   badge and is last in the order), but Akira should confirm — the column may
   simply not have been updated yet.

2. **Photo code mismatch on the mano francesa.** The spreadsheet SKU is
   `WTX3071`; the photo file in `5. ALAMBRE` is named `WTX7071.jpg`. Same class
   of typo as CL5114/CL5111 in escaleras. The image is mapped to `WTX3071` here —
   confirm which code is right.

3. **`WTX7120` has no photo.** The travesaño omega has no file in `5. ALAMBRE`
   and the spreadsheet's "Archivo foto" cell lists `WTX7120`, so the photo is
   expected but missing. Ask Akira for it.

4. **Both union products are named "Inoxidable"** in the spreadsheet ("Kit Unión
   Inoxidable…", "Unión Inoxidable Simple…") while the Materiales column offers
   PZ, GF, IN304 and IN316. The product name contradicts the material axis. The
   copy here drops "Inoxidable" from the name and keeps the four finishes —
   confirm that is right, or the names need fixing in the spreadsheet.

5. **The "Espesores disponibles" column means two different things.** On the
   trays it holds the wire diameter (3/16", 1/4"); on the accessories it holds
   the sheet gauge (#14–#20). Not a blocker — it is handled as text in the copy,
   not as an axis — but worth knowing when the column is read again.

6. **No `elec` finish.** The line ships in 4 finishes, as the spreadsheet says.

7. **Curvas** are confirmed to exist but arrive later. When they do they become a
   `type: "subfamilia"` entry with the reserved slug `curvas-alambre`.

## SEO rows for the spreadsheet

`Claude outputs/seo-alambre-2026-09-13.csv` holds the 6 rows for tab
`07_TEXTOS_SEO`, generated from the same JSON so the site and the spreadsheet
cannot drift. All 6 are `Revisado por BGA = NO`.
The earlier `_obsoleto-seo-alambre-2026-09-12.csv` was written before the
spreadsheet tab was found — ignore it.
