# Prompt — Renomear Aramados → Bandeja Portacable de Alambre, mover pro fim, badge "Nueva línea"

Data: 12/09/2026. Cola isso no Claude Code, na raiz do repo `bga-catalogo`.

---

## Contexto

A família que hoje se chama **Aramados** (`id: "aramados"`, `displayMode: "contact"`,
0 produtos) muda de nome para **Bandejas Portacables de Alambre**. Ela ainda não
vende — por isso continua em modo `contact` (imagem + bloco de contato), entra
por último na ordem das famílias, e ganha um selo "Nueva línea" no card da home.

A LP dedicada vem depois — esta mudança não a implementa.

**Por que trocar o `id` e não só o `name`:** "aramado" é palavra portuguesa e não
é o que um comprador paraguaio digita. A URL `/catalogo/bandejas-de-alambre/`
carrega o termo de cabeça em espanhol. Como o catálogo ainda não está publicado
(bga.com.py serve o bga-site antigo), não há custo de redirect nem de SEO
acumulado — é agora ou nunca.

---

## Tarefa 1 — `lib/catalog.json`

Na array `categories`, o objeto com `id: "aramados"`:

1. `id`: `"aramados"` → `"bandejas-de-alambre"`
2. `name`: `"Aramados"` → `"Bandejas Portacables de Alambre"`
3. `image`: → `"/images/bandeja-portacable-alambre-bga-malla-soldada-paraguay.webp"`
   (arquivo já existe no repo)
4. `description`: substituir por:
   `"Bandejas portacables en malla de alambre soldado — sistema tipo malla, liviano y ventilado, para telecomunicaciones, data centers y tendidos que cambian seguido."`
5. Acrescentar `"badge": "Nueva línea"`
6. `displayMode`: mantém `"contact"`
7. **Mover o objeto inteiro pro final da array `categories`** (depois de `gabinetes`).

Resultado esperado da ordem: bandejas → perfilados → escaleras → tableros →
gabinetes → bandejas-de-alambre.

## Tarefa 2 — varrer referências ao id antigo

`grep -rn "aramados" --include="*.js" --include="*.jsx" --include="*.json" --include="*.mjs" . | grep -v node_modules | grep -v .next`

Confirmado em 12/09: não há rota estática, link ou índice de busca apontando pra
`aramados` (o `search-index.json` só indexa famílias `displayMode: "catalog"`).
Se aparecer algo além do `catalog.json`, corrigir junto. O arquivo
`public/images/aramados-portacables-bga-industria-paraguay.webp` fica órfão
depois da troca — podés apagar.

## Tarefa 3 — badge no card da home (`components/ProductFinder.jsx`)

Dentro de `<div className={styles.productImage}>`, no bloco `cat.image ?`,
antes da `<img>`, acrescentar:

```jsx
{cat.badge && <span className={styles.productBadge}>{cat.badge}</span>}
```

## Tarefa 4 — CSS (`app/landing.module.css`)

Logo depois de `.productImgOverlay` (por volta da linha 341), acrescentar:

```css
.productBadge {
  position: absolute; top: 10px; right: 10px; z-index: 3;
  padding: 4px 10px; border-radius: 999px;
  background: var(--bolt); color: var(--ocean);
  font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

## Tarefa 5 — rebuild + verificação

```
node scripts/build-search-index.mjs
npm run build
```

Checar:
- home: o card "Bandejas Portacables de Alambre" é o último do grid e tem o selo amarelo
- o `<select>` "Elegí una familia…" lista o novo nome, por último
- `/catalogo/bandejas-de-alambre/` abre em modo contact e não dá 404
- `/catalogo/aramados/` dá 404 (esperado — não tinha tráfego)

## Commit

```
feat: renomeia familia aramados para bandejas de alambre e adiciona badge de nueva linea
```

---

## O que NÃO entra aqui (decisão consciente)

- **Banner de largura total na home.** O selo no card já sinaliza a novidade
  onde o olho já está (o grid de famílias) sem gastar uma dobra inteira com uma
  linha que ainda não tem produto, preço nem ficha. Se depois da LP no ar a
  linha merecer mais peso, aí sim vale uma faixa acima do grid — é meia hora de
  trabalho e a decisão fica mais barata com dado de tráfego na mão.
- **Páginas de produto.** Não existe dado na planilha pra essa família ainda
  (ver pendências abaixo).

---

## Dados confirmados pela Yuki (12/09/2026)

Na aba de bandejas do template, **coluna L = Materiales disponibles** e
**coluna U = Normas que cumple**. A família de alambre segue esse mesmo layout.

- **Materiales (col. L):** `PZ; GF; IN304; IN316` — os mesmos do resto do catálogo.
- **Normas (col. U):** iguais para bandeja, perfilado, escalera e alambre:
  `NBR IEC 61537 (Sistemas de Eletrocalhas e Leitos para Cabos); NBR 7008 (pregalvanizado); NBR 6323 / ASTM 123 (galvanizado por inmersión en caliente)`

Isso já está escrito no `seo-alambre-2026-09-12.csv` — descrição longa, FAQ 4
(materiales) e FAQ 5 (normas) da família, e a linha de material/norma das 4
páginas de produto.

**Dois efeitos colaterais que valem uma passada:**

1. A aba `02_Escaleras` está com a coluna "Normas que cumple" **vazia nas 33
   linhas**. Pela regra que a Yuki confirmou, ela leva a mesma string acima —
   dá pra preencher a família inteira de uma vez.
2. A string de normas cobre pregalvanizado e galvanizado a fogo, mas **não o
   inox**. No `catalog.json` os materiais AISI 304/316 aparecem com `ASTM A240`
   na `materialTable` de bandejas. Se for pra manter coerência, `ASTM A240`
   entra na coluna U das quatro famílias — confirmar com o Akira antes.

---

## Pendências com o Akira antes da LP

1. **WTX7011 × WTX7111** — as duas fotos são tramo de bandeja de alambre e eu não
   consigo distinguir uma da outra pela imagem. Em bandejas o par 3011/3111 é
   lisa/perforada, mas aqui as duas são malha. Qual é a diferença (altura? paso
   de malla? diámetro del alambre?).
2. **Medidas — só a bandeja tem** (Yuki, 12/09). Os outros três (kit de uniones,
   ménsula, fijación a varilla roscada) são peça única / kit, sem eixo de medida.
   Isso define a estrutura das páginas: `bandeja-portacable-de-alambre` é a única
   com seletor de medida dentro da ficha (ancho / altura / largo de tramo, no
   padrão do template — a página é o conceito, o SKU é seleção); as outras três
   são ficha simples, só com o eixo de acabamento (PZ / GF / AISI 304 / AISI 316).
   Falta o Akira mandar os **valores**: anchos, alturas e largo de tramo, mais
   paso de malla e diâmetro do alambre — esse último é o dado que o comprador de
   telecom compara.
3. **Pintura electrostática** — a lista de materiais tem 4 (PZ, GF, IN304,
   IN316). Em bandejas o eixo de acabamento tem 5, com pintura electrostática.
   A linha de alambre não leva pintura mesmo, ou é omissão? (A pintura sobre
   malha soldada é menos comum, então 4 faz sentido — só confirmar.)
4. **Fabricação ou revenda** — se a linha é fabricada pela BGA ou representada.
   Muda o texto e o argumento da LP.
5. **Curvas — confirmado que existem, mas entram depois** (Yuki, 12/09). Duas
   consequências pra agora:
   - O texto de SEO foi reescrito: a versão anterior vendia a bandeja de alambre
     como "não precisa de acessório de curva, dobra a malha na obra". Isso
     argumentaria contra um produto que a BGA vende. Agora o texto diz que há
     acessórios de curva **e** que a malha pode ser dobrada em obra quando a
     trajetória não entra numa peça padrão — os dois caminhos, sem depreciar o
     acessório.
   - A estrutura de páginas tem que deixar espaço: quando as curvas chegarem,
     elas viram subfamília (como "Accesorios de Curva" em bandejas), não itens
     soltos. Vale já reservar o slug `curvas-alambre` na hora de montar.
   Ainda falta: se há tes e reducciones além das curvas, e as fotos isoladas
   (a foto do card mostra uma curva horizontal, mas é imagem de composição).
6. **Nome do produto vs. nome da família** — usei "Bandejas Portacables de
   Alambre" na família (plural, como as outras: "Bandejas y Accesorios",
   "Perfilados y Accesorios") e "Bandeja Portacable de Alambre" na página de
   produto. Se o Akira quiser o singular na família também, é uma linha.
7. **Desenho técnico em SVG** — a Yuki vai pedir ao Akira (12/09). Os JPG que
   ele mandou servem como referência, mas não pro site: traço fino borra no
   zoom e o isométrico veio em 388 px. Quando o SVG chegar, ele entra na área
   de especificação da ficha (não como imagem principal — essa continua o
   render) e a coluna "SVG entregue?" da planilha marca como entregue.
   **Não bloqueia nada**: as cotas já estão como texto na ficha (malla 100 × 50
   mm, alambre 6,35 e 4,76 mm, ala 50 mm a 70°), que é o que o Google indexa e
   o que lê bem no celular. O desenho só ilustra.
