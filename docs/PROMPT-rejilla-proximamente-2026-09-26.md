# PROMPT — Wire tray line: "Próximamente" + WhatsApp CTA, rename to "Tipo Rejilla"

Date: 2026-09-26 · Repo: `bga-catalogo` · Branch: `main`

## Context

The client (Akira) wants to hold the wire-mesh tray line (`bandejas-de-alambre`) for later.
The family goes back to "contact" mode: badge on the home card, family page with intro +
WhatsApp CTA, no product sheets. The product data **stays** in `lib/catalog.json` so we
can relaunch by flipping one field.

At the same time the line is renamed from "de Alambre" to "Tipo Rejilla". "Alambre" and
"tipo malla" stay in the copy as search synonyms — do not remove them.

The `contact` display mode already exists (`app/catalogo/[categoria]/page.jsx`,
`lib/product-helpers.js`). Sitemap, search index and product routes already skip
non-`catalog` families. **This is a data-only change** (plus one word of copy). Do not
touch components, the badge styling, or analytics.

The category `id` also changes: `bandejas-de-alambre` → `bandejas-tipo-rejilla` (the site is
not on the final domain yet, so there is no redirect cost). Do NOT change product `id`s or
image paths.

---

## 1. Category `bandejas-de-alambre` in `lib/catalog.json`

Set exactly:

```json
"id": "bandejas-tipo-rejilla",
"name": "Bandejas Portacables Tipo Rejilla",
"navLabel": "Rejilla",
"displayMode": "contact",
"description": "Bandejas portacables tipo rejilla, en malla de alambre soldado: livianas y ventiladas, para data centers, telecomunicaciones y tendidos que cambian seguido.",
"badge": "Próximamente"
```

Keep `image` as it is.

Then update `categoryId` from `bandejas-de-alambre` to `bandejas-tipo-rejilla` in the 6
products of this family. Today the old id appears only in `lib/catalog.json` (1 category +
6 products) and in the generated `search-index.json` / `sitemap.xml`, which are rebuilt in
step 4. Confirm with a grep that no source file hardcodes it.

## 2. Contact block copy (voseo fix)

In `app/catalogo/[categoria]/page.jsx`, contact-mode block:
`Consúltanos para más información sobre esta línea.` → `Consultanos para más información sobre esta línea.`

(BGA writes in voseo; this was the only tuteo left.)

## 3. Products — rename now so they are ready for relaunch

These pages won't be generated while the family is in `contact` mode, but update the data
now so relaunch is just flipping `displayMode`.

### 3.1 `bandeja-portacable-de-alambre`

```json
"name": "Bandeja Portacable Tipo Rejilla",
"shortDescription": "Tramo de bandeja portacable tipo rejilla, en malla de alambre soldado, de 3000 mm. Se especifica por ancho, ala, diámetro de alambre y acabado.",
"keywords": "bandeja portacable tipo rejilla, bandeja de rejilla, bandeja portacable de alambre, bandeja portacables tipo malla, wire mesh cable tray, eletrocalha aramada, Paraguay",
"meta": {
  "title": "Bandeja Portacable Tipo Rejilla de Alambre | BGA",
  "description": "Bandeja portacable tipo rejilla en malla de alambre soldado: tramo de 3000 mm, anchos de 50 a 600 mm, en PZ, GF, AISI 304 y AISI 316. BGA Paraguay."
}
```

`longDescription`: only change the opening phrase
`La bandeja portacable de alambre — también llamada bandeja tipo malla o de rejilla —`
→ `La bandeja portacable tipo rejilla — también llamada bandeja de alambre o tipo malla —`.
Leave the rest untouched.

### 3.2 The 5 accessories

Rule: in `name` and `meta.title` only, replace `Bandeja de Alambre` → `Bandeja Tipo Rejilla`.
In `keywords`, **prepend** one term (keep all existing ones). Leave `shortDescription`,
`longDescription`, `faq` and `meta.description` as they are ("bandeja de alambre" stays
there as a synonym).

| id | name | meta.title | keyword to prepend |
|---|---|---|---|
| `union-simple-alambre` | Unión Simple para Bandeja Tipo Rejilla | Unión Simple para Bandeja Tipo Rejilla \| BGA | `unión simple bandeja tipo rejilla` |
| `kit-de-uniones-alambre` | Kit de Uniones para Bandeja Tipo Rejilla | Kit de Uniones para Bandeja Tipo Rejilla \| BGA | `kit de uniones bandeja tipo rejilla` |
| `mano-francesa-triangular-alambre` | Mano Francesa Triangular para Bandeja Tipo Rejilla | Mano Francesa para Bandeja Tipo Rejilla \| BGA | `mano francesa bandeja tipo rejilla` |
| `soporte-travesano-omega-alambre` | Soporte Travesaño Omega para Bandeja Tipo Rejilla | Travesaño Omega para Bandeja Tipo Rejilla \| BGA | `travesaño omega bandeja tipo rejilla` |
| `soporte-acople-vertical-alambre` | Soporte Acople Vertical para Bandeja Tipo Rejilla | Acople Vertical · Bandeja Tipo Rejilla \| BGA | `acople vertical bandeja tipo rejilla` |

## 4. Regenerate and verify

1. Run the prebuild scripts (sitemap + search index) and `npm run build`.
2. Check:
   - `public/sitemap.xml` has **only** `/catalogo/bandejas-tipo-rejilla/` for this family (no product URLs).
   - `lib/search-index.json` has no product from this family.
   - `out/catalogo/bandejas-tipo-rejilla/index.html` renders: H1 "Bandejas Portacables Tipo Rejilla", description, image, "Consultar por WhatsApp" button. No grid, no "Agregar a cotización".
   - Home card and `/catalogo` card show the "PRÓXIMAMENTE" badge and "Ver familia →" (not "0 productos").
   - Header menu shows "Rejilla".
   - `grep -r "Bandeja de Alambre\|Bandejas Portacables de Alambre\|bandejas-de-alambre" lib/ app/ components/ public/sitemap.xml` → no matches.
3. Report anything that didn't match.

## 5. Commit

One commit:

```
content: pausa linea tipo rejilla (modo contacto, badge Próximamente) y renombra alambre → tipo rejilla (id bandejas-tipo-rejilla)
```

## Relaunch later (not now)

Set `displayMode` back to `"catalog"` and `badge` to `"Nueva línea"`. Everything else is ready.
