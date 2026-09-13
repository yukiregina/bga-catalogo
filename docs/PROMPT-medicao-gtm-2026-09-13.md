# PROMPT — measurement layer: GTM, attribution capture, new events

Paste into Claude Code at the root of `bga-catalogo`. Seven blocks, one commit
each, in order. Do not batch them into a single commit.

## Context

Next.js with `output: 'export'` (static), hosted on AWS Amplify, domain
`bga.com.py`. Measurement today: GA4 loaded directly via gtag in
`components/Analytics.jsx`, five events fired through `lib/analytics.js`.
Leads are written persist-first to a Google Apps Script webhook
(`lib/leads.js`, catalog cart) and via GET query params
(`components/LandingPage.jsx`, home form).

Goal of this change: put GTM in front of GA4 so advertising tags can be added
later without a deploy, and make every quote request carry the campaign that
produced it. All comments in code: Portuguese, same register as the existing
files (explain the *why*, not the *what*). All user-facing copy: Spanish.

Do not refactor anything outside the scope below. Do not rename existing
events. `track()` must keep its exact signature so no call site changes.

---

## Block 1 — `client.config.js`: add the GTM container id

Add to the `data` block, right above `gaMeasurementId`:

```js
// Container do Google Tag Manager. O GA4 passa a ser configurado DENTRO do
// GTM — o gaMeasurementId abaixo fica como registro de qual propriedade é,
// mas não é mais lido pelo código.
gtmContainerId: 'GTM-M9CWZQV8',
```

Leave `gaMeasurementId` in place with that clarifying comment. Keep the
existing "null = sobe sem medição" semantics: a null `gtmContainerId` must mean
no container loads.

Commit: `feat: adiciona gtmContainerId ao client.config`

---

## Block 2 — `components/Analytics.jsx`: GTM loader replacing gtag

Rewrite the component to inject the standard GTM snippet instead of the gtag
snippet. Keep the existing structure and the existing explanatory comment
block, updated.

Guards, in this order:

1. `process.env.NODE_ENV !== 'production'` → return null (unchanged).
2. No `gtmContainerId` → return null.
3. Runtime hostname check, **with one new escape**: load the container when
   `location.hostname` is in `['bga.com.py','www.bga.com.py']` **OR** when
   `location.search` contains `gtm_debug`. Document why: GTM Preview appends
   `gtm_debug` to the URL, and without this escape the container never loads on
   the Amplify preview build, which makes the whole setup impossible to test
   before it is live.

Initialize `window.dataLayer = window.dataLayer || []` **before** the container
script, so pushes that happen early are not lost.

Also add the `<noscript>` iframe part of the GTM snippet at the top of `<body>`
in `app/layout.jsx`. It must respect the same guards — if that is awkward
inside a server component, it is acceptable to skip the noscript iframe
entirely; say so in a comment rather than shipping a version that loads on the
preview host. Measurement of a JS-disabled visitor is not worth a guard leak.

Commit: `feat: GTM substitui o gtag como carregador da medicao`

---

## Block 3 — `lib/analytics.js`: push to dataLayer

Change the implementation only. Same export, same name, same arguments.

```js
export function track(event, params = {}) {
  if (typeof window === 'undefined') return
  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...params })
  } catch {
    // medição nunca derruba a página
  }
}
```

Update the file's header comment: it is now a dataLayer contract, not a gtag
wrapper, and the event list gains the three new events from Block 6. Add one
line stating that GTM maps these to GA4 — if the container is missing or
blocked, the pushes pile up harmlessly in an array and nothing breaks.

Commit: `refactor: track() empurra pro dataLayer em vez do gtag`

---

## Block 4 — `lib/attribution.js` (new file)

First-party attribution capture. No dependencies.

```
Storage key: 'bga_attr'   (localStorage)
TTL: 90 days
```

Export two functions:

- `captureAttribution()` — call once per page load, client side.
- `getAttribution()` — returns a flat object, or `{}` if nothing stored.

Fields captured from `location.search`: `utm_source`, `utm_medium`,
`utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`, `gbraid`,
`wbraid`. Plus `referrer` (`document.referrer`, hostname only) and
`landing_page` (`location.pathname`) and `ts` (ISO timestamp).

Write rule — **last paid touch wins**, and document it in the header comment:

- If the current URL carries any `utm_*` or any click id → overwrite the stored
  record.
- Else if there is no stored record (or it is older than 90 days) → store the
  current one, with whatever referrer exists (this is the organic/direct case).
- Else → keep what is stored. A returning visitor who arrives direct must not
  erase the campaign that originally brought them.

`getAttribution()` returns a payload-ready shape, truncating each value to 200
characters:

```js
{ fuente, medio, campana, contenido, termino, click_id, pagina_entrada, referrer }
```

`click_id` is the first present of `gclid`, `fbclid`, `gbraid`, `wbraid`,
prefixed with its name (e.g. `gclid:Cj0KC...`), so the source is unambiguous in
the spreadsheet.

Every read and write wrapped in try/catch: localStorage throws in private
browsing on some browsers, and a lead must never be lost because of a storage
error. On failure, `getAttribution()` returns `{}` and the lead is written
without origin — degraded, not broken.

Call `captureAttribution()` from an existing client component that mounts on
every page. `components/CartProvider.jsx` is a client component already in the
layout; a `useEffect(() => { captureAttribution() }, [])` there is enough. Do
not create a new component for this.

Commit: `feat: captura de atribuicao (utm, gclid, fbclid) no primeiro load`

---

## Block 5 — attribution reaches both lead forms

**`app/cotacao/page.jsx`** — spread `getAttribution()` into the
`registrarCotizacion({...})` payload, at the top level, alongside `origen`.
Nothing else changes; `registrarCotizacion` already serializes the whole
object.

**`components/LandingPage.jsx`** — the home form builds a `URLSearchParams`.
Append the same fields, skipping empty values so the URL stays short.

Commit: `feat: origem da visita acompanha o lead nos dois formularios`

---

## Block 6 — three new events

Only these three. Do not instrument anything else.

**`buscar_catalogo`** — in `components/ProductFinder.jsx`. Fires on a debounced
search (800 ms after the last keystroke), only when the trimmed query has 3 or
more characters, and only once per distinct query. Params:

```js
track('buscar_catalogo', { termino: q.toLowerCase(), resultados: results.length })
```

Lowercase the term so GA4 does not split `Bandeja` and `bandeja` into two rows.

**`iniciar_cotizacion`** — in `app/cotacao/page.jsx`. Fires on the first
interaction with any field of the quote form, once per page view (guard with a
ref, not state — it must not re-render anything). Params:

```js
{ items: items.length, unidades: <soma das quantidades> }
```

This is what makes the abandonment rate of the form measurable: it separates
"opened the cart" from "started filling" from "sent".

**`click_linea_nueva`** — on the home category card that carries the
`badge: "Nueva línea"` (`lib/catalog.json`, category `bandejas-de-alambre`).
Fires on click, before navigation. Params:

```js
{ familia: <category id>, badge: <badge text> }
```

Drive it off the presence of `cat.badge`, not off a hardcoded category id, so a
future badged line is measured without a code change.

Commit: `feat: eventos de busca, inicio de cotizacao e clique na linha nova`

---

## Block 7 — Apps Script and privacy policy

**`docs/bga-leads-apps-script.gs`**

Append five columns at the **end** of `HEADERS_COTIZACIONES` — end, not middle:
`Estado` is currently the 12th column and a previous insertion in the middle
already broke it once.

```js
'Fuente', 'Medio', 'Campaña', 'Click ID', 'Página de entrada'
```

Append the matching values to the `appendRow` in `doPost`, in the same order,
each through `clampField` with a 200-character limit. Do the same for the
landing sheet in `doGet`: append the same five headers and values at the end of
its row.

Add a comment explaining that a sheet created before this change keeps its old
header row — the new columns must be added by hand to the existing tab, or the
values land under blank headers. That is a manual step outside the code, and it
has to be said out loud here.

**`app/politica-de-privacidad/page.jsx`**

Rewrite section 7 ("Cookies y medición"). Spanish, same tone as the rest of the
page — plain, no legalese padding. It must cover: Google Tag Manager as the tag
administrator, Google Analytics 4 as the measurement tool, the fact that
advertising tags from Google Ads and Meta may be used to know which ad brought
a visit, and that blocking cookies in the browser does not break the catalogue
or the quote request. Written now so that switching an advertising pixel on
later needs no deploy of legal text.

Commit: `content: politica de privacidade cobre GTM e etiquetas de publicidade`

---

## After the seven blocks

Create `docs/MEDICION-ga4-gtm.md` documenting the result, in Portuguese,
following the same shape as the Triple R measurement doc:

1. Identifiers — GTM container, GA4 property and measurement id, which Google
   account owns them (leave a TODO if unknown at commit time).
2. The dataLayer contract — table of the 8 events with their parameters and
   where each one fires.
3. GTM setup — the tags, triggers and data layer variables to create, with the
   trigger regex written out.
4. GA4 setup — custom dimensions, key events, internal traffic filter, data
   retention.
5. Closing checklist, in checkbox form, so a later session can audit it against
   the GTM version history and the GA4 change log instead of trusting a summary.

Commit: `docs: registra a camada de medicao do catalogo`

## Verification before you report done

- `npm run build` passes and `out/` still generates every page.
- With the site served locally, `window.dataLayer` exists and each of the 8
  events pushes an entry with its parameters — the GTM container itself will
  not load locally, and that is correct behaviour, not a bug.
- A quote request submitted with `?utm_source=test&utm_campaign=verificacion`
  in the URL sends those values in the webhook payload (check the network tab;
  the response is opaque by design).
- Nothing in the diff touches product data, `lib/catalog.json`, or any page
  outside the files named above.
