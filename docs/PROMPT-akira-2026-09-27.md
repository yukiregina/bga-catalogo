# Two copy/data changes from Akira (2026-09-27)

Branch off `main` (`fix/akira-confianza-espesor`). Two separate commits: (1) Confianza, (2) thickness rule + copy (2 and 2b together).

## 1. Home — "Por qué BGA": Parceria → Confianza

File: `components/LandingPage.jsx` (section `#nosotros`)

- Line ~202, h2: `Excelencia, responsabilidad y parceria` → `Excelencia, responsabilidad y confianza`
- Line ~216, feature label: `03 · Parceria` → `03 · Confianza`
- Leave the card's h3 and paragraph as they are.
- `grep -rni parceria components app lib` must return nothing afterwards (ignore `.claude/worktrees/`, `docs/`).

## 2. Bandejas — minimum thickness per width (Akira's table)

No code change. The UI already reads `minThicknessRule` (`parseMinThicknessRule` in
`lib/product-helpers.js` → `matchedThicknessRule` in `ProductSheet.jsx`, first match wins).
Only the data is wrong.

In `lib/catalog.json`, every product with `categoryId: "bandejas"` (51 of them, all
currently identical) has:

    ">=500:#14; >=300:#16; <300:#18"

Replace it, in all 51, with:

    ">=500:#14; >=400:#16; >=250:#18; >=150:#20; <150:#22"

Resulting mapping (must match Akira exactly):

| Ancho (mm) | Mínimo |
| --- | --- |
| 50, 100 | #22 |
| 150, 200 | #20 |
| 250, 300, 350 | #18 |
| 400, 450 | #16 |
| 500, 600, 700, 800 | #14 |

Constraints:
- Do the replacement with a script (python read-modify-write on the parsed JSON, keep
  2-space indent and key order), not by hand. Only touch bandejas — escaleras has its own
  rule (`>=500:#14; >=400:#16; >=200:#18; <200:#20`) and must stay unchanged.
- Keep `>=500` as the FIRST segment: `showRecommendationNote` uses `thicknessRules[0].width`.
- `#22` must exist in `globalSpecs.thicknesses` (it does — 0.7 mm). Check that the
  below-minimum warning (`belowMinimumGauge`, compares in mm) still works.

### 2b. Same rule restated in copy — update the text too

The old rule is also written out in prose inside `lib/catalog.json` (43 places). Replace
each exact string below (string replace on the file content is fine here — the strings are
unique and contain no JSON escapes). Counts must match before replacing; if not, stop and
tell me.

| Count | Old | New |
| --- | --- | --- |
| 40 | `el espesor mínimo sigue la regla >=500 mm: #14, >=300 mm: #16, menor a 300 mm: #18.` | `el espesor mínimo depende del ancho: #22 hasta 100 mm, #20 hasta 200 mm, #18 hasta 350 mm, #16 hasta 450 mm y #14 desde 500 mm.` |
| 1 (`bandeja-portacables`) | `el espesor mínimo sigue la regla >=500 mm: #14, >=300 mm: #16, menor a 300 mm: #18, #20 o #22.` | same new text as above |
| 1 (`materialsPage`) | `El espesor mínimo sigue el ancho de la bandeja: desde 500 mm, #14; desde 300 mm, #16; por debajo de 300 mm, #18.` | `El espesor mínimo sigue el ancho de la bandeja: hasta 100 mm, #22; hasta 200 mm, #20; hasta 350 mm, #18; hasta 450 mm, #16; desde 500 mm, #14.` |
| 1 | `La regla de mínimo es: ancho desde 500 mm, #14 (2,0 mm); desde 300 mm, #16 (1,5 mm); por debajo de 300 mm, #18 (1,2 mm).` | `La regla de mínimo es: ancho hasta 100 mm, #22 (0,7 mm); hasta 200 mm, #20 (0,9 mm); hasta 350 mm, #18 (1,2 mm); hasta 450 mm, #16 (1,5 mm); desde 500 mm, #14 (2,0 mm).` |

After: `grep -c "menor a 300\|desde 300 mm\|>=300 mm" lib/catalog.json` → 0.

The Google Sheet (source of truth) already has Akira's values — this change brings
`catalog.json` in line with it. Do not touch the Sheet.

## Verify

1. Print the mapping above from the JSON by running the same first-match logic over
   widths 50…800 for `bandeja-portacables`. Paste the output.
2. Count: 51 bandejas with the new rule, 18 escaleras with the old one, 0 with
   `>=300:#16`.
3. Stop `next dev` if running, then `npm run build` — must pass.
4. `npm run dev` → `/catalogo/bandejas/bandeja-portacables/`: pick ancho 100 → box shows
   `#22`; 200 → `#20`; 450 → `#16`; 600 → `#14`. Home shows "Confianza".

Do not push. Show me the diff stat and wait.
