// Domínio publicado — fonte única. app/layout.jsx (bundlado pelo Next) e
// scripts/build-sitemap.mjs (Node puro, roda no prebuild) importam os dois
// daqui, pra não ter o mesmo valor hardcoded duas vezes.
//
// Extensão .mjs de propósito, não .js como o resto de lib/: build-sitemap.mjs
// roda via `node`, fora do build do Next, e o package.json não declara
// "type": "module" — um .js aqui seria lido como CommonJS e o `export`
// quebraria o script no prebuild. .mjs força ESM nos dois lados.
export const SITE_URL = 'https://bga.com.py'
