# Brief — home, navegação unificada e paridade de SEO

> Para executar no Claude Code, dentro de `bga-catalogo`.
> Leia o `CLAUDE.md` da raiz antes de começar.
> **Tarefa separada do `BRIEF-export-estatico.md`.** Não misturar as duas: se algo
> quebrar, precisa dar pra saber qual mudança causou.

---

## Objetivo

Deixar a home nova (`app/page.jsx` → `components/LandingPage.jsx`) pronta para
**substituir a landing page publicada em `bga.com.py`** sem perder nada.

Pela decisão de arquitetura de 22/06, este app vira o site inteiro: a home na
raiz, o catálogo em `/catalogo`. Duas coisas bloqueiam essa troca hoje — a
navegação não foi unificada, e a home nova perdeu metade do SEO da página que
ela vai substituir.

---

## Parte 1 — Navegação

### O problema

São **três** navegações diferentes, e elas divergem até dentro do catálogo:

| Rota | O que a barra tem |
| --- | --- |
| `/` | logo em imagem · `Productos · Sectores · Nosotros · Contacto` (todos âncoras `#`) · botão "Solicitar cotización" → `#contacto` |
| `/catalogo` | nome da marca **em texto**, não a logo · link "Cotización" → `/cotacao` · sem famílias, **sem carrinho** |
| `/catalogo/[categoria]` | `NavLogo` · lista de famílias · `CartBadge` com contador |

A casca muda três vezes. É isso que dá a sensação de ter saído do site — não o
fato de os links serem diferentes.

**Menu diferente por seção é normal e deve continuar.** O que precisa ser
constante é a casca: mesma logo, mesma posição, mesmo carrinho.

### O que fazer

1. **Um componente `Header` só**, usado por todas as rotas, com duas camadas:
   - **Fixa:** a logo em imagem (a mesma da home), sempre linkando para `/`, e o
     `CartBadge`. O badge fica sempre presente — quando o carrinho está vazio,
     ele some ou zera, mas não é a barra inteira que muda.
   - **Contextual:** na home, as âncoras (`Productos · Sectores · Nosotros ·
     Contacto`); dentro de `/catalogo/*`, as famílias, com a atual destacada
     (esse comportamento já existe em `[categoria]/page.jsx` — reaproveitar).

2. **Adicionar "Catálogo" ao menu da home, como link real para `/catalogo`.**
   Hoje o único link interno da home para o catálogo está no rodapé (linha 421).
   O item "Productos" continua sendo âncora para `#productos` — a seção do
   `ProductFinder` — e isso está certo, são coisas diferentes: uma é buscar, a
   outra é navegar o catálogo inteiro.

3. **Corrigir a inconsistência dentro do catálogo:** `/catalogo` mostra o nome da
   marca em texto enquanto a página de família mostra a `NavLogo`. Padronizar na
   logo, pelo `Header` único.

4. **"Solicitar cotización" da home continua indo para `#contacto`.** É o
   formulário de contato, intenção diferente do carrinho de cotação. Não trocar.

---

## Parte 2 — Paridade de SEO com a página publicada

### O problema

O comentário no topo de `LandingPage.jsx` já avisa: o JSON-LD do `<head>`
original **não foi portado**. Medido em 24/08 no site no ar:

| Item | `bga.com.py` (publicado) | home nova |
| --- | --- | --- |
| JSON-LD | `Organization` + `LocalBusiness` + `FAQPage` (um bloco `@graph`) | ❌ nenhum |
| `<link rel=canonical>` | `https://bga.com.py/` | ❌ |
| Open Graph | 7 tags (`og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:locale`, `og:site_name`) | ❌ |
| `meta description` | preenchida | ✅ (via `app/layout.jsx`) |
| `meta robots` | `index, follow` | ❌ |
| `robots.txt` / `sitemap.xml` | existem | ❌ não estão em `public/` |

Trocar a página publicada por esta seria uma **regressão de SEO na porta de
entrada** — justamente o oposto do motivo pelo qual esta migração existe.

### O que fazer

1. **Portar o JSON-LD** do `<head>` do arquivo publicado. A fonte fiel é
   `reference-lp:/index.html` (byte-idêntica ao que está no ar — ver `CLAUDE.md`).
   No Next isso vai como `<script type="application/ld+json">` na página, ou via
   `metadata` do App Router quando couber.
2. **Metadata completa** em `app/layout.jsx` e por página: `canonical`,
   `openGraph`, `robots`. Título e descrição únicos por rota — as páginas de
   família e de produto também, que é onde está o ganho de long-tail.
3. **`robots.txt` e `sitemap.xml`** em `public/`, cobrindo as rotas do catálogo.
   Copiar os da LP publicada como base e acrescentar `/catalogo/*`.
4. **Apagar o TODO de Google Analytics** no topo de `LandingPage.jsx`: ele está
   desatualizado. O GA4 passou a ser carregado em 24/08 por
   `components/Analytics.jsx`, montado no `app/layout.jsx`, e vale para o app
   inteiro — home incluída.

---

## O que NÃO mexer

- O design e a copy da home. Isto é migração técnica, não redesenho.
- `registrarCotizacion()` sem `await` em `app/cotacao/page.jsx` — proposital,
  ver `CLAUDE.md`.
- Os eventos GA4 já instrumentados.
- A pasta `reference-lp:` — é a página publicada hoje. Serve como **fonte de
  consulta** para o `<head>`, mas não se edita e não entra no build.
- Não commitar nem publicar.

---

## Critérios de aceitação

- [ ] A mesma logo, na mesma posição, em todas as rotas
- [ ] `CartBadge` presente em todas as rotas do catálogo, inclusive `/catalogo`
- [ ] Item "Catálogo" no menu da home, levando para `/catalogo`
- [ ] Carrinho montado no catálogo continua visível ao voltar para a home
- [ ] `view-source` da home renderizada contém: bloco JSON-LD com `Organization`,
      `LocalBusiness` e `FAQPage`; `<link rel=canonical>`; as 7 tags Open Graph;
      `meta robots`
- [ ] `public/robots.txt` e `public/sitemap.xml` existem e listam as rotas do catálogo
- [ ] Nenhuma seção da home sumiu na conferência lado a lado com `bga.com.py`

---

## Perguntar antes de decidir

1. Se a paridade de conteúdo entre a home nova e a publicada tiver diferença de
   **texto ou seção** (não só de `<head>`), **listar as diferenças e perguntar**
   antes de mexer. Pode ser mudança intencional da Yuki.
2. Se o `hreflang` deve entrar: a LP publicada não tem, e o catálogo hoje é só
   espanhol. Só faz sentido se PT-BR entrar — e cada idioma é um projeto à parte.
