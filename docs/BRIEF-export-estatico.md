# Brief — deixar o catálogo pronto pra export estático

> Para executar no Claude Code, dentro de `bga-catalogo`.
> Leia o `CLAUDE.md` da raiz antes de começar — ele tem as regras do projeto,
> o estado dos dados e o que foi mexido em 24/08.

---

## Objetivo

Fazer `npm run build` gerar **arquivos estáticos** (`out/`), para publicar no
AWS Amplify do cliente como site estático — mesmo modelo da landing page que já
roda em S3 + CloudFront.

Hoje o build gera app de servidor. Publicar assim vira hospedagem SSR: servidor
24/7 na conta AWS da BGA, custo por requisição e versão de Node pra manter.
O projeto inteiro é montado pra não ter servidor — os dados são um JSON local
(`lib/catalog.json`), o carrinho é `localStorage`, e a captura de lead é um
Apps Script externo. Não há nada que justifique render por requisição.

---

## O que fazer

### 1. `next.config.mjs`

Está vazio. Adicionar:

- `output: 'export'`
- `trailingSlash: true` — sem isso, `/catalogo/bandejas` não resolve para
  `index.html` em hospedagem estática de S3/CloudFront
- `images: { unoptimized: true }` — o projeto só usa `<img>` nativo hoje, mas
  deixa o config à prova de alguém introduzir `next/image` depois

### 2. Remover os dois `force-dynamic`

- `app/catalogo/[categoria]/page.jsx` linha 6
- `app/catalogo/[categoria]/[produto]/page.jsx` linha 1

São incompatíveis com export e não têm motivo aqui: os dados são locais e
estáticos.

### 3. Adicionar `generateStaticParams`

Nas duas rotas dinâmicas. Os dados saem de `lib/catalog.json` via os helpers
que já existem em `lib/products.js` (`getCategories`, `getProductsByCategory`).

- `app/catalogo/[categoria]/page.jsx` → 6 famílias
- `app/catalogo/[categoria]/[produto]/page.jsx` → 72 produtos, cada um com sua
  família

### 4. Tirar `searchParams` — não existe em página exportada

Três ocorrências:

**`app/catalogo/page.jsx` (linhas 8-10) — busca `?q=`**
Passar a busca para o cliente. Já existe `components/ProductFinder.jsx` como
client component; a filtragem deve acontecer nele, sobre a lista completa que a
página estática entrega.

**`app/catalogo/[categoria]/page.jsx` (linhas 20-22) — paginação `?page=`**
**Remover a paginação do v1.** A página pagina de 18 em 18, e a única família
que vai ao ar é Bandejas, com 26 SKUs. Renderizar todos os produtos da família
de uma vez. Menos código, menos superfície de erro, e resolve o bloqueio.

Se em algum momento uma família passar de ~60 itens, aí sim volta como
paginação client-side — não como query string.

### 5. Criar `app/not-found.jsx`

O export estático precisa gerar um `404.html`. Não existe hoje.

### 6. Rodar o build e servir localmente

```bash
npm run build
npx serve out
```

Navegar de verdade: home → família → ficha → adicionar ao carrinho → `/cotacao`.
`trailingSlash` costuma quebrar link relativo; só clicando aparece.

---

## O que NÃO mexer

**`registrarCotizacion()` em `app/cotacao/page.jsx` é chamado sem `await`, de
propósito.** Esperar quebraria o vínculo com o clique do usuário e o navegador
bloquearia o `window.open` como popup. O envio é garantido por
`keepalive: true`. Não "consertar" isso.

Também fora de escopo:

- O fluxo do `wa.me` e a ordem grava-primeiro-abre-depois
- Os eventos GA4 já instrumentados (`lib/analytics.js`, `components/TrackView.jsx`)
- `lib/catalog.json` — conteúdo é outra tarefa
- A pasta `reference-lp:` — é a landing page publicada hoje, não faz parte do
  build. Não editar, não apagar, não incluir no deploy.
- Nada de CMS, painel de administração, banco de dados ou dependência nova sem
  perguntar antes

Não commitar nem publicar nada. Só deixar o build passando.

---

## Critérios de aceitação

- [ ] `npm run build` termina sem erro e gera `out/`
- [ ] `out/` contém: `index.html`, `catalogo/index.html`,
      `catalogo/bandejas/index.html`, uma pasta por SKU de Bandejas,
      `cotacao/index.html`, `404.html`
- [ ] `npx serve out` — navegação inteira funciona sem servidor Node
- [ ] Carrinho persiste ao trocar de página (localStorage)
- [ ] Busca do catálogo funciona sem `?q=` na URL
- [ ] Nenhuma família some da navegação por causa da paginação removida

---

## Onde vai ser publicado — já decidido

**Raiz do domínio, sem subdomínio.** Decisão de 22/06, registrada em
`NOTA_Arquitetura_LP_Catalogo.md`: o catálogo em subpasta (`/catalogo`) concentra
autoridade de SEO; subdomínio fragmenta. Este app vira o site inteiro — a home
(`app/page.jsx`) e o catálogo nas rotas internas.

**Portanto: não configurar `basePath` nem `assetPrefix`.**

A verificação escalonada acontece na URL própria do app no Amplify
(`*.amplifyapp.com`), antes de apontar o domínio. Isso é operação de deploy, não
muda nada no código.

## Perguntar antes de decidir

1. Se aparecer qualquer coisa que exija servidor para funcionar, **parar e
   dizer** em vez de contornar com SSR. A resposta certa provavelmente é mudar
   a funcionalidade, não a hospedagem.
2. Se a home (`app/page.jsx` → `LandingPage.jsx`) tiver algo que não sobrevive ao
   export, **dizer antes de mexer** — ela é a versão nova da landing page e vai
   substituir a que está no ar.
