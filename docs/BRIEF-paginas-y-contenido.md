# Brief — estrutura de páginas e conteúdo do catálogo

> Para executar no Claude Code, dentro de `bga-catalogo`.
> Leia o `CLAUDE.md` da raiz antes de começar.
> **Rodar depois do `BRIEF-export-estatico.md`**, não junto: os dois mexem nas
> mesmas rotas, e se algo quebrar precisa dar pra saber qual mudança causou.

---

## Objetivo

Trocar a estrutura de rotas de **uma página por SKU** para **uma página por
peça**, e ligar os cards de intenção a destinos reais.

Hoje `app/catalogo/[categoria]/[produto]/page.jsx` gera uma rota por SKU. Com a
planilha completa isso vira 144 páginas de bandeja onde só existem 36 peças —
as outras 108 são variantes (lisa/perforada × tipo U/C) do mesmo desenho, com o
mesmo texto e a mesma imagem. Conteúdo duplicado em escala, e nenhuma página com
profundidade suficiente pra ser citada.

Além disso: o meta description de produto é template
(`"{nome} — {categoria}. Cotizá por WhatsApp…"`, `[produto]/page.jsx:39`),
idêntico nas 72 páginas atuais. Isso já está no ar.

**Fonte de conteúdo:** aba `07_TEXTOS_SEO` do
`BGA_Catalog_Template_vF_bandejas.xlsx`. 42 linhas, uma por página, com coluna
`Tipo de página`: `producto` (36), `subfamilia` (5), `contenido` (1).

---

## O que fazer

### 1. Agrupar SKUs por página no `catalog.json`

Cada linha `tipo = producto` da `07_TEXTOS_SEO` vira **um** objeto de página. A
coluna `SKUs / páginas incluidas` diz quais SKUs entram.

```
{
  "id": "curva-horizontal-90",
  "categoryId": "bandejas",
  "name": "Curva Horizontal 90°",
  "subtitle": "...",              // col. Subtitle
  "shortDescription": "...",      // col. Short description
  "longDescription": "...",       // col. Descripción larga (parágrafos por \n\n)
  "faq": [{ "q": "...", "a": "..." }],
  "keywords": "...",
  "meta": { "title": "...", "description": "..." },
  "variants": [
    { "sku": "CT3114", "modelo": "Perf.", "tipo": "U" },
    { "sku": "CT3115", "modelo": "Perf.", "tipo": "C" },
    { "sku": "CT3014", "modelo": "Lisa",  "tipo": "U" },
    { "sku": "CT3015", "modelo": "Lisa",  "tipo": "C" },
    { "sku": "CT3214", "rol": "tapa" }
  ],
  "dimensionAxes": [...],          // como já existe hoje
  "recommended": [...]
}
```

**A variante é seleção dentro da ficha, não rota.** É como o carrinho de
cotação já trata variante hoje — ver `faro-catalogo-cotizacion`, seção 3: as
colunas "disponibles" viram dropdown opcional no item cotado.

⚠️ **A regra 2 do CLAUDE.md continua valendo.** Todo nível precisa de caminho
até a cotação. Com variante em dropdown, o "Agregar a cotización" tem que
mandar o SKU da variante selecionada, não o id da página. Se nenhuma variante
foi escolhida, manda a página com a variante em branco — o formulário nunca
pune quem não sabe.

### 2. Páginas de subfamília (5 novas)

Linhas `tipo = subfamilia`. Cada uma lista as páginas de produto que agrupa, na
coluna `SKUs / páginas incluidas`.

| slug | agrupa |
| --- | --- |
| `accesorios-de-curva` | 15 páginas |
| `reducciones-y-desvios` | 6 |
| `soportes-y-fijacion` | 6 |
| `uniones-y-empalmes` | 4 |
| `salidas-y-terminaciones` | 4 |

Rota: `/catalogo/bandejas/<slug>/`. Conteúdo: descrição longa + 3 FAQ + grid das
páginas que agrupa. Precisam de `generateStaticParams` como as outras.

### 3. Ligar os cards de intenção

`app/catalogo/[categoria]/page.jsx`, linhas ~176-193. Hoje cada card é um
`<div>`. O `catalog.json` já tem um campo `filter` em cada `intentCard`
(`"gf"`, `"curvas"`, `"reducciones"`, `"soportes"`) que **nunca é usado**.

Trocar `filter` por `href` e o `<div>` por `<a>`:

| Card | Destino |
| --- | --- |
| Cambios de dirección horizontal | `/catalogo/bandejas/accesorios-de-curva/` |
| Reducir la sección de bandeja | `/catalogo/bandejas/reducciones-y-desvios/` |
| Fijar y suspender la bandeja | `/catalogo/bandejas/soportes-y-fijacion/` |
| **Instalación en exterior o zona húmeda** | `/materiales-y-tratamientos/` |

Dois cards novos, se couberem no grid: *Empalmar tramos* →
`/catalogo/bandejas/uniones-y-empalmes/` e *Salidas y terminaciones* →
`/catalogo/bandejas/salidas-y-terminaciones/`.

**Por que o card de galvanizado é diferente dos outros.** GF é tratamento
superficial, disponível em todos os 144 SKUs — não é um subconjunto de
produtos. Filtrar por ele devolveria o catálogo inteiro. Hoje o card promete
uma navegação que não pode entregar; o destino certo é a página de materiais.

⚠️ **Link real, não filtro client-side.** Filtro é bom pra quem navega, mas não
gera URL: crawler não vê destino e LLM não tem o que citar. E `?filtro=` está
descartado — `searchParams` não existe em página exportada (ver
`BRIEF-export-estatico.md`, item 4).

### 4. Página `/materiales-y-tratamientos/`

Linha `tipo = contenido` da planilha. **Raiz do domínio, não dentro de
`/catalogo`** — não é listagem de produto.

Seções: materia prima · tratamentos superficiais · espessuras e tolerância ·
união CLINCH · tabela de seleção por ambiente.

O conteúdo já existe no código, espalhado: `globalSpecs.materials`,
`globalSpecs.surfaceTreatments` (com `norm` e `useCase`),
`globalSpecs.thicknesses`, `globalSpecs.thicknessTolerance`,
`globalSpecs.joiningProcess`, e a `materialTable` de cada categoria. A página
consome esses mesmos dados — não duplicar em JSON novo.

**Consequência:** a `materialTable` sai das páginas de família e vira um resumo
de 3 linhas + link. Hoje ela se repete em cada categoria; é essa duplicação que
a página existe pra resolver.

Duas das quatro FAQ de bandejas já são de material (GF vs PZ, CLINCH). A
resposta canônica passa a ser a da página de materiais; a família pode manter
uma versão curta.

A página precisa de CTA de cotação e de links descendo pros produtos
("ver bandejas en acero inoxidable") — senão vira página órfã e contraria a
regra 2.

### 5. Schema JSON-LD

- `producto` → `Product` + `FAQPage` com as 3 FAQ
- `subfamilia` → `CollectionPage` + `BreadcrumbList`
- `contenido` → `Article` + `FAQPage` com as 5 FAQ

Bandejas já tem Schema no nível de família; seguir o mesmo padrão.

### 6. Redirects

As rotas por SKU (`/catalogo/bandejas/CT3114/`) já estão indexadas. Cada SKU
redireciona 301 pra sua página de peça. Em site estático no Amplify isso é
regra de redirect no console do app, não código.

---

## O que NÃO fazer

- Não gerar página por variante. É o problema que este brief resolve.
- Não usar `searchParams` pra filtro. Quebra o export.
- Não duplicar a tabela de materiais nas 6 famílias.
- Não mexer no `handleSend` do `app/cotacao/page.jsx`. O `registrarCotizacion()`
  sem `await` é proposital — ver CLAUDE.md, seção 4.

---

## Estado da fonte de dados (atualizado 29/08/2026)

A `07_TEXTOS_SEO` e a `01_Bandejas` estão fechadas. Tudo que estava pendente
quando este brief foi escrito já foi resolvido — ver
`REVISAO-2026-08-28-akira.md` e `REVISAO-textos-akira.md`.

- **Imagens: 36/36 páginas cobertas.** 50 `.webp` em
  `public/images/productos/`. Nenhuma página sobe sem render.
  Ligação no `BRIEF-imagenes.md`, que roda **depois** deste.
- **Materiais: resolvido.** `Materiales disponibles` = `PZ; CN; IN304` nos 144
  SKUs. Sem IN316 (vai para aramados) e sem alumínio (BGA não trabalha).
  Chapa negra fica — passaram a vender em CN.
- **`Revisado por BGA` = "Sí"** nas 42 páginas e nas 144 linhas. O conteúdo não
  é mais rascunho de IA.

### Peças configuráveis — caminho de consulta na ficha

Duas páginas descrevem peças que a BGA fabrica sob medida, e o Akira escreveu
isso no texto delas:

| página | o que o texto diz |
| --- | --- |
| `te-horizontal` | "es posible cambiar el ancho de la salida central, para esto confirmar con el vendedor mostrando un dibujo de la instalación" |
| `desnivel-simple` | "es posible cambiar la altura según su necesidad, para esto confirmar con el vendedor" |

Pela `faro-catalogo-cotizacion` §1, cotável e configurável são coisas
diferentes. Estas duas continuam no carrinho — mas a ficha precisa do
**"Consultar con un especialista"** visível ao lado do "Agregar a cotización",
não escondido no rodapé. Sem isso entra pedido incompleto exatamente onde o
fabricante avisou que entra.

Marcar no `catalog.json` com uma flag por página (ex.: `"configurable": true`)
e deixar o componente decidir — não hardcodar os dois slugs.

### Dois ajustes que este brief precisa fazer no `catalog.json`

1. **Acrescentar o calibre #12.** `globalSpecs.thicknesses` hoje vai de #14 a
   #22, montado a partir do catálogo 25-26 — que não lista #12. A BGA confirmou
   que fabrica em #12 com frequência. Acrescentar `{ "gauge": "#12", "mm": 2.5 }`
   no topo da lista. A tolerância `±0,05mm` não muda, e a
   `Regla espesor mínimo` (`>=500:#14; >=300:#16; <300:#18`) também não — #12 é
   a opção mais grossa, não mexe no piso.

2. **MOQ nunca renderiza vazio.** A coluna `Cantidad mínima (MOQ)` existe na
   planilha mas está vazia nas 144 linhas (a BGA não tem pedido mínimo hoje;
   pode passar a ter com exportação). A ficha e o carrinho só mostram o campo
   quando houver valor — nada de rótulo órfão.

---

## Pendência que este brief NÃO resolve

- **As outras 5 famílias.** Só bandejas sobe (CLAUDE.md, seção 2). A página de
  materiais serve as cinco, mas as `07_TEXTOS_SEO` das outras famílias ainda não
  existem.
