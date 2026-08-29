# Revisão Akira — conferência de 28/08/2026

Arquivos conferidos, todos em `Desktop/BGA-catalogo/4. Catálogo Sitioweb/`:

- `BGA_Catalog_Template_vF_bandejas RevAkira.xlsx` (144 SKUs + 42 páginas SEO)
- `Revisao Imagens.xlsx` (54 respostas do Akira sobre os renders)
- `3. BANDEJAS JPG/LISTA FALTANTES/` (12 PNGs novos)
- `bandejas_correcoes-tecnicas.csv` (91 correções)

---

## 1. Correções técnicas — **91/91 aplicadas**

Todas as 91 linhas do `bandejas_correcoes-tecnicas.csv` batem com o valor
corrigido na aba `01_Bandejas`. Nenhuma pendência.

## 2. Textos — completos e revisados

Aba `07_TEXTOS_SEO`, 42 páginas (36 `producto` · 5 `subfamilia` · 1 `contenido`):

| Campo | Preenchimento |
| --- | --- |
| slug, tipo, nome, subtitle, title tag, meta description | 42/42 |
| short description, descripción larga, palabras clave | 42/42 |
| FAQ 1–3 | 42/42 |
| FAQ 4–5 | 1/42 (só `materiales-y-tratamientos`, por desenho) |
| SKUs incluídas | 41/42 (`materiales-y-tratamientos` não tem SKU — ok) |

Limites de caractere respeitados: nenhum title tag > 60, nenhuma meta > 155.

**`Revisado por BGA` = "Sí"** nas 42 páginas SEO e nas 144 linhas de SKU
(29/08). O Akira confirmou que leu tudo e só não tinha marcado a coluna. O
conteúdo não é mais rascunho de IA.

## 3. Imagens — **36 de 36 páginas de produto cobertas**

As 12 imagens da `LISTA FALTANTES` fecham exatamente as 12 peças que estavam
sem render (CT3060, CT3061, CT3117, CT3122, CT3124, CT3126, CT3132, CT3134,
CT3142, CT3145, CT3147, CT3149).

As dúvidas de identificação que estavam na coluna `Notas` foram respondidas:

| Pendência anterior | Resposta do Akira | Status |
| --- | --- | --- |
| `CT3128.jpg` mostra peça plana, não curva de descarga | o arquivo é o CT3154 (reducción central); a curva de descarga é `REVISAR_CT3128-curva-descarga.jpg` | resolvido, troca aplicada |
| CT3150 / CT3252 — não dá pra distinguir direita de esquerda | ambos OK como estão | resolvido |
| `CT3066.jpg` e `CT3067-AB.jpg` são o mesmo arquivo | CT3066 = soporte tipo A · CT3067 = soporte tipo B | resolvido |
| `TC3238.jpg` (typo) | é CT3238 | resolvido |
| `seccion-bandeja-tipo-U/C` | imagem complementar de CT3111/CT3011 e CT3112/CT3012 | resolvido → vira imagem secundária da página `bandeja-portacables` |
| `REVISAR_soporte-colgante-a`, `REVISAR_tapa-lisa-15`, `REVISAR_reduccion-o-desvio` | desconsiderar | descartados |

**Já processado:** 50 arquivos `.webp` em `public/images/productos/` do repo
(1400 px de largura, qualidade 82). 65,5 MB de JPG/PNG → **1,13 MB**, média de
23 KB. Cobertura: **36/36** páginas de produto, mais tapa onde existe e as duas
seções (U e C) da página de bandeja. Mapa origem → destino em
`public/images/productos/_manifest.csv`.

---

## 4. O que ainda falta

### Decisões (Yuki / BGA) — **todas fechadas em 29/08**

Respostas do Akira, aplicadas na planilha (backup em
`..._BACKUP-antes-materiais.xlsx`):

| # | pergunta | resposta | o que mudou |
| --- | --- | --- | --- |
| 1 | Inox 316 | não é necessário em bandejas; vai entrar em **aramados**. Nunca houve solicitação | `IN316` fora de `Materiales` nas 144 linhas · "AISI 304 o 316" → "AISI 304" nos 42 textos · 2 FAQs corrigidas |
| 2 | Alumínio ASTM 1100 | remover — sem demanda e difícil de conseguir a matéria-prima | tirado da página `materiales-y-tratamientos`; nunca esteve nos SKUs |
| 3 | Espesor #12 (2,5 mm) | **existe**, fazem com frequência | planilha mantida · **falta acrescentar no código** (ver abaixo) |
| 4 | Chapa negra | manter — passaram a vender em CN por demanda | nada muda |
| 5 | `Revisado por BGA` | leu tudo, só esqueceu de marcar | "Sí" nas 42 páginas e nas 144 linhas de SKU |
| 6 | MOQ | não existe hoje; talvez com exportação no futuro | **coluna fica**, vazia — decisão da Yuki |

⚠️ **Consequência do item 1:** 316 sai de bandejas mas entra em **Bandejas
Aramadas**. Quando essa família for populada, a legenda e o `Materiales` dela
precisam de `IN316` — não é um código morto, só não é de bandejas.

⚠️ **Consequência do item 3, no código:** `globalSpecs.thicknesses` do
`catalog.json` vai de #14 a #22. Falta `{ "gauge": "#12", "mm": 2.5 }` no topo
da lista. A tolerância `±0,05mm` continua valendo. A `Regla espesor mínimo`
(`>=500:#14; >=300:#16; <300:#18`) não muda — #12 é opção mais grossa, não
altera o mínimo.

⚠️ **Consequência do item 6, no código:** a ficha e o carrinho não devem
renderizar o campo MOQ quando estiver vazio. A coluna existe na planilha para
quando houver exportação; hoje não tem valor nenhum.

### Buracos de dados na planilha

- ~~`Cantidad mínima (MOQ)` vazia em 144/144~~ → resolvido, item 6 acima.
- `Modelo` e `Tipo` vazios em `CT3063-50/75/100` (união interna — provavelmente
  "-" como nos outros acessórios).
- `Longitud std` vazio em `CT3214` e `CT3216` (tapas — provavelmente 3000).
- `SVG entregue?` = "No" em 143/144. Renders em SVG não vão entrar no v1 — as
  50 `.webp` cobrem 36/36 páginas.

### Fora do escopo de bandejas

As outras 5 famílias continuam praticamente vazias na planilha
(Escaleras 1 SKU ativo, Perfilados/Aramadas/Cajas/Gabinetes 0) e não têm aba
`07_TEXTOS_SEO`. Seguem como `displayMode: pdf`/`contact`, conforme
`CLAUDE.md` seção 2.

---

## 5. Próximos passos, em ordem

1. `BRIEF-export-estatico.md` — rodar primeiro (mexe nas mesmas rotas).
2. `BRIEF-paginas-y-contenido.md` — reestrutura de 144 rotas por SKU para 42
   páginas por peça, alimentado pela `07_TEXTOS_SEO`.
3. `BRIEF-imagenes.md` — ligar as 50 `.webp` já geradas ao `catalog.json` e às
   fichas. Depende do passo 2 (as imagens são nomeadas por `pagina_slug`).
4. Redirects 301 das rotas antigas por SKU → páginas novas, no console do
   Amplify (site estático, não dá pra fazer em código).
5. OK da BGA nos textos (item 4.3) e nos materiais (item 4.4) — antes de
   divulgar o catálogo, não depois.
