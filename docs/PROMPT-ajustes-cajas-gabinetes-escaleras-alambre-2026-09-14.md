# PROMPT — Cajas image fix, gabinetes mounted photo, escaleras CL/CLY split, alambre image (2026-09-14)

Paste into Claude Code at the root of `bga-catalogo`. Read the root `CLAUDE.md` first.

Six independent fixes from Akira's review. Sections 1–2 are small and safe — do
those first. Sections 3–5 touch the same family (escaleras) and are more
involved. Section 6 is a one-file image import. **Commit each section
separately** (same convention as `docs/PROMPT-gabinetes-cajas-arrumar-2026-09-13.md`)
so a revert is surgical if something breaks.

---

## 1. Cajas — fix the image tier on 5 SKUs

Confirmed against `public/images/productos/_manifest.csv`: the three generic
caja renders trace back to real photos of specific SKUs —
`CS80.jpg` (webp: `caja-metalica-galvanizada.webp`) is the **regular** tier
and is literally a photo of `CS705025DC`; `CS50.jpg`
(`caja-metalica-galvanizada-chica.webp`) is the **chica** tier and is a photo
of `CS403020DC`. The volume-based split from the 09/12 import (top third by
volume → `-grande`, bottom third → `-chica`) put two SKUs in the wrong tier.
Akira flagged it; here's the fix — in `lib/catalog.json`:

| id | SKU | current `images.primary` | change to |
| --- | --- | --- | --- |
| `caja-cs806025dc` | CS806025DC (800×600×250) | `/images/productos/caja-metalica-galvanizada-grande.webp` | `/images/productos/caja-metalica-galvanizada.webp` |
| `caja-cs705025dc` | CS705025DC (700×500×250) | `/images/productos/caja-metalica-galvanizada-grande.webp` | `/images/productos/caja-metalica-galvanizada.webp` |
| `caja-cs404025dc` | CS404025DC (400×400×250) | `/images/productos/caja-metalica-galvanizada.webp` | `/images/productos/caja-metalica-galvanizada-chica.webp` |
| `caja-cs404020dd` | CS404020DD (400×400×200) | `/images/productos/caja-metalica-galvanizada.webp` | `/images/productos/caja-metalica-galvanizada-chica.webp` |
| `caja-cs404030dc` | CS404030DC (400×400×300) | `/images/productos/caja-metalica-galvanizada.webp` | `/images/productos/caja-metalica-galvanizada-chica.webp` |

After: `caja-cs705025dc` and `caja-cs806025dc` match `caja-cs705015dc` (700×500×150,
already on the regular tier). `caja-cs404025dc`/`-cs404020dd`/`-cs404030dc` match
`caja-cs403020cc`/`-dc`/`-dd`/`-ed` (400×300×200, already chica).

Don't touch `public/images/productos/_manifest.csv` for this section — it
already correctly lists `CS705025DC` and `CS403020DC` as the source SKUs for
those two files; only the five `catalog.json` assignments above were wrong.

Optional: the mapping table in section 7 of
`docs/PROMPT-cajas-gabinetes-import-2026-09-12.md` is now stale for these 5
rows — not worth editing a dated historical doc, skip it.

---

## 2. Gabinetes — wire the "mounted" photo into the placa and trillo pages

Confirmed in `_manifest.csv`: `PLM80.jpg` and `PLM120.jpg` are already
converted (`gabinete-modular-estructura-800.webp` /
`gabinete-modular-estructura-1200.webp`) but unused in `catalog.json` — this
was a deliberate deferral in
`docs/PROMPT-gabinetes-cajas-arrumar-2026-09-13.md` section 4 ("not worth
doing in this pass"). It's worth doing now: Yuki wants the customer to see
the plate mounted on the frame, on the placa and trillo product pages.

Size mapping (Yuki's markup on the live grid):

| id | plate width | complementary image |
| --- | --- | --- |
| `placa-de-montaje-pml114` | 1145 mm | `/images/productos/gabinete-modular-estructura-1200.webp` |
| `placa-de-montaje-pml74` | 745 mm | `/images/productos/gabinete-modular-estructura-800.webp` |
| `placa-de-montaje-pml54` | 545 mm | `/images/productos/gabinete-modular-estructura-800.webp` |
| `trillo-vertical-gabinete` | — | `/images/productos/gabinete-modular-estructura-1200.webp` |

### Schema

`ProductSheet.jsx` today only branches on `images.primary` / `images.tapa` /
`images.bySku` / `images.byAla` (see lines ~85–96 and ~420–440). None of those
fit: `tapa` also swaps the selected variant/SKU (a tapa is a separately
sellable piece), and these four products don't have that — it's the same SKU,
just a second photo. Add a new, generic key instead of overloading `tapa`:

```json
"images": {
  "primary": "/images/productos/placa-de-montaje-modular.webp",
  "secondary": "/images/productos/gabinete-modular-estructura-1200.webp",
  "secondaryLabel": "Instalada"
}
```

In `ProductSheet.jsx`, add a third branch alongside the existing
`hasBySku` / `tapa` gallery logic: when `product.images?.secondary` exists
(and the product has neither `bySku` nor `tapa`), render the same two-thumbnail
toggle used for Pieza/Tapa, but purely as an image swap — **no
`setSelectedVariant` call**, since there's no second SKU behind it. Labels:
`"Pieza"` / `product.images.secondaryLabel` (fallback `"Instalada"` if
absent). Grid card keeps using `images.primary` only, same as every other
product — the toggle only exists on the ficha.

---

## 3. Escaleras — split `escalera-portacables` into 3 pages

Today `escalera-portacables` (`lib/catalog.json`, categoryId `escaleras`) is
one page with a `variants` selector (CL5011, CLY5011, CL5114) and a shared
`dimensionAxes.ala` of `[60, 65, 75, 95, 100]`. Yuki wants the same
page-per-line treatment cajas and gabinetes already got: 3 direct product
pages, no selector, no hub (unlike cajas/gabinetes this is 3 product *lines*,
not 31 sizes, so she asked for 3 pages, not 3-pages-behind-a-hub).

| new page | SKU | `ala` (fixed or axis) | `espesor` axis | `images.primary` |
| --- | --- | --- | --- | --- |
| Escalera Portacables CL | CL5011 | axis `[60, 75]` | `#12`–`#20` (unchanged) | `/images/productos/escalera-portacables.webp` |
| Escalera Portacables CLY | CLY5011 | axis `[65, 95]` | `#12`–`#20` (unchanged) | `/images/productos/escalera-portacables-sin-perforacion-cly5011.webp` (was `bySku.CLY5011` — promote it to `primary` on its own page) |
| Escalera Portacables Tipo Pesado | CL5114 | fixed `dimensions` entry, `100 mm` (single value — not an axis) | `#12`, `#14`, `#16` only — **see note** | `/images/productos/escalera-portacables.webp` (placeholder, see note) |

Suggested slugs: `escalera-portacables-cl`, `escalera-portacables-cly`,
`escalera-portacables-tipo-pesado`. These are new URLs — confirm the slugs
with Yuki before publishing if she cares about the exact path.

**Espesor on Tipo Pesado:** the current shared `longDescription`/FAQ already
says the tipo pesado "admite espesores desde #16 en los anchos chicos y #12
en 800 mm" — i.e. only `#12`/`#14`/`#16`, never `#18`/`#20`. The merged page
never enforced this because the axis was shared across all three lines.
Narrow the espesor axis to `["#12", "#14", "#16"]` on this page only.

**Tipo Pesado photo:** `docs/REVISAO-akira-escaleras-2026-09-13.md` §4 item 3
flags that the spreadsheet's photo column for CL5114 says `CL5111`, which
doesn't match any SKU — open question with Akira, never resolved. Use the
CL leve photo as a placeholder and leave a `TODO` comment in the JSON so it's
not mistaken for final.

**Copy:** `ancho` axis (10 values, unchanged), `unidadVenta`, `finishes` and
`recommended` (`kit-de-uniones-escalera`, `soporte-travesano`) carry over
unchanged to all 3 pages. `longDescription`/FAQ need to be split three ways
from the current shared text — draft it, but **flag it as unapproved draft
copy**, same as the cajas SEO after its 09/13 restructure
(`docs/PROMPT-gabinetes-cajas-arrumar-2026-09-13.md` §3): don't treat it as
final without Yuki's sign-off. Check whether
`docs/PROMPT-escaleras-import-2026-09-12.md` / the `07_TEXTOS_SEO` sheet tab
already has separate CL/CLY/pesado copy before drafting from scratch.

No other page's `recommended`/`includedPages` references `escalera-portacables`
today (checked) — nothing else to update.

---

## 4. Escaleras accessories — split the Ala [B] selector into CL / CLY groups

Applies **only to `categoryId: "escaleras"`** — 55 `dimensionAxes` entries
with `"id": "ala"` exist in `catalog.json`, but `bandeja-portacable-de-alambre`
(categoryId `bandejas-de-alambre`) has one too, with unrelated values
(`30, 50, 100`). **Do not touch that one.**

For every escalera accessory (curvas, tés, cruzetas, reducciones, uniones,
soportes, salidas — the ~27 pages under `categoryId: "escaleras"` with an
`ala` axis) with values drawn from `{60, 65, 75, 95, 100}`: instead of one
flat row of buttons sorted numerically (which interleaves the two lines —
60, 65, 75, 95, 100), group the UI into two labeled clusters:

- **Ala CL**: 60, 75, 100
- **Ala CLY**: 65, 95

Only show the values a given product actually has today — don't add values
it doesn't offer. This is a display grouping (labels + visual split), not a
data change: keep `dimensionAxes` values as-is, just change how
`ProductSheet.jsx` renders the `ala` axis buttons — split into two labeled
sub-rows instead of one. (Same component as section 2, different part of it
— check how the `ancho` axis currently renders in two rows of 5/5 for the
precedent on multi-row axis layout.)

---

## 5. Escalera tapa (CT3211) — needs its own Ancho + Ala configurator

Yuki: "faltou add no site as tapas para escalera CT3211. O cliente
necessariamente precisa escolher o Ancho e ALA pra podermos cotar. Tá no
sheets."

**Flag before implementing:** `docs/PROMPT-escaleras-import-2026-09-12.md`
§5 records a 09/12 decision from Yuki — CT3211 is a **shared SKU**, already
live as `id: "CT3211"`, `categoryId: "perfilados"` ("Tapa para perfilado"),
and escaleras was told to **cross-reference it in `recommended`, not
duplicate the page**. Today's request looks like it reverses that: a
perfilado-only tapa page has no `ala` axis (perfilados don't have alas), so
it can't let an escalera customer pick Ancho **and** Ala the way she's
asking for now. Confirm with Yuki whether this replaces the 09/12 decision
before changing it — don't silently duplicate content that was explicitly
ruled out five days ago.

If confirmed: pull the escalera tapa's Ancho/Ala/Espesor options from the
`02_Escaleras` sheet tab (the "Tá no sheets" — same spreadsheet as the rest
of this family) rather than inventing values. Likely shape: either (a) give
CT3211 its own `dimensionAxes.ala` restricted to the escalera set when
reached from `/catalogo/escaleras/`, keeping one shared product with
context-dependent axes, or (b) a second page under `escaleras` with its own
id that happens to sell the same physical part. Pull the actual axis values
from the sheet before picking between these — don't guess which is cleaner
without the data in front of you.

---

## 6. Alambre — missing image for Soporte Travesaño Omega (WTX7120)

`soporte-travesano-omega-alambre` (`lib/catalog.json`, SKU `WTX7120`) has
`"images": {}` — empty, no fallback. The photo just landed:
`/Users/yuki/Desktop/5. ALAMBRE/WTX7120.JPG` (added today, not yet
converted or in the manifest).

1. Convert to webp matching the rest of the set: 1400px wide, quality 82,
   flattened white background — same recipe already used for the other 5
   alambre photos in that folder (check how `WTX7011.jpg` →
   `bandeja-portacable-de-alambre.webp` etc. were produced, e.g. in git
   history around commit `a829395`/the alambre import, and reuse the same
   command). Output: `public/images/productos/soporte-travesano-omega-alambre.webp`.
2. Add a row to `public/images/productos/_manifest.csv`:
   `soporte-travesano-omega-alambre,primaria,WTX7120,5. ALAMBRE/WTX7120.JPG,/images/productos/soporte-travesano-omega-alambre.webp,<bytes>`
3. In `lib/catalog.json`, set `soporte-travesano-omega-alambre.images` to
   `{ "primary": "/images/productos/soporte-travesano-omega-alambre.webp" }`.

---

## 7. Rebuild, verify, commit

```bash
node scripts/build-search-index.mjs
npm run build
```

Check before committing:

1. The 5 caja pages in section 1 render the corrected image on both the
   grid card and the ficha.
2. The 4 gabinete pages in section 2 show a working Pieza/Instalada toggle;
   every other product's gallery (bySku, tapa, plain primary) still renders
   exactly as before — this touches a shared component, don't regress it.
3. `escaleras` grid shows the 3 new pages instead of 1, with no leftover
   `variants` array on any of them; the ~27 accessory pages show the
   CL/CLY grouped Ala selector.
4. `lib/search-index.json` entry count reflects +2 for the escaleras split
   (1 page → 3) and the WTX7120 addition doesn't change its count (SKU
   already existed, just gained an image).
5. `soporte-travesano-omega-alambre` ficha shows the new photo.

Commit as separate commits, in this order:

```
fix: corrige o tier de imagem de 5 cajas metalicas (CS80/CS50)
feat: foto de placa/trillo montado nas paginas de gabinetes
content: escaleras — separa CL, CLY e tipo pesado em paginas proprias
feat: agrupa o seletor de ala das escaleras em CL/CLY
content: importa imagem do soporte travesano omega (alambre)
```

(Skip section 5's commit until the CT3211 question above is resolved with
Yuki — don't bundle an unconfirmed content decision with the rest.)
