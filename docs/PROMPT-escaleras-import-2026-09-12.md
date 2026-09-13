# PROMPT — Importar escaleras (aba 02_Escaleras) + imagens + SEO

Contexto: a aba `02_Escaleras` da planilha oficial (`BGA_Catalog_Template_vF`,
Google Sheets nativo, id `1h2L1QS4rBOglMtwdk472kh9kN6wdpvU1I5K0yFm6_XI`, conta
`mkt@bga.com.py`) está com os dados técnicos completos — 33 SKUs. As fotos
chegaram na pasta `Desktop/4. ESCALERAS JPG/`.

Leia o `CLAUDE.md` da raiz antes de começar. Escaleras entra **"o mais simples
possível"** (mesma profundidade de perfilados): é conteúdo de página, não o
configurador completo de material+tratamento que bandejas tem. Não construir
ficha nem carrinho novos para esta família.

## Arquivos desta pasta

| Arquivo | O quê |
| --- | --- |
| `escaleras-planilha-oficial-2026-09-13.csv` | aba `02_Escaleras`, **33 SKUs**, agora com as colunas de texto preenchidas pelo Akira — **usar esta** |
| `seo-escaleras-31-linhas-2026-09-13-v2.csv` | 31 linhas de SEO/GEO, com as correções do Akira aplicadas — **aguardando o ok final dele** |
| `REVISAO-akira-escaleras-2026-09-13.md` | o que ele mudou, o que ficou pendente |

Versões antigas — `escaleras-planilha-oficial-2026-09-12.csv`,
`seo-escaleras-31-linhas-2026-09-12.csv` e
`escaleras-campos-faltantes-2026-09-12.csv` — **não usar**.

## 1. Antes de tocar em nada

Olhe o schema de um produto de perfilados já importado em `lib/catalog.json`
(ex.: `ST2011`) e reuse os mesmos nomes de campo. Não inventar chave nova para
o mesmo dado.

## 2. Os 14 produtos legados de escaleras saem

Hoje `lib/catalog.json` tem 14 produtos com `categoryId: "escaleras"` que vieram
do import do PDF antigo: sem `slug`, sem `type`, sem `images`, com `page: 8`.
São eles:

`CL5011`, `CLY5011`, `CL5016`, `CL5030`, `CL5024`, `CL5022`, `CL5038`,
`CL5042`, `CL5046`, `CL5044`, `CL5036`, `CL5034`, `CL5074`, `KIT5262`

**Remover os 14** e reconstruir a família a partir das 26 páginas de produto
da seção 4. Não é upsert: o schema antigo não bate com o novo.

## 3. A categoria vira `catalog`

Em `categories`, `escaleras` está hoje com `displayMode: "pdf"`. Trocar para
`"catalog"`, como perfilados. Manter `description`, `image` e `pdfUrl` como
estão — o PDF continua disponível na página de família.

## 4. Estrutura de páginas — 26 produto + 5 subfamília

Regra do template: variante compartilha página, SKU é seleção. Os slugs levam
sufixo `-escalera` para não colidir com os de bandejas, igual ao que perfilados
fez com `-perfilado`.

| pagina_slug | SKUs |
| --- | --- |
| `escalera-portacables` | CL5011, CLY5011, CL5114 |
| `curva-horizontal-90-escalera` | CL5016 |
| `curva-horizontal-recta-90-escalera` | CL5018 |
| `curva-horizontal-45-escalera` | CL5020 |
| `curva-vertical-externa-90-escalera` | CL5022 |
| `curva-vertical-interna-90-escalera` | CL5024 |
| `curva-vertical-externa-45-escalera` | CL5026 |
| `curva-vertical-interna-45-escalera` | CL5028 |
| `curva-vertical-inversion-90-escalera` | CL5074 |
| `te-horizontal-escalera` | CL5030 |
| `te-horizontal-recto-escalera` | CL5032 |
| `te-vertical-ascendente-escalera` | CL5034 |
| `te-vertical-descarga-escalera` | CL5036 |
| `union-cruzeta-escalera` | CL5038 |
| `union-cruzeta-recta-escalera` | CL5040 |
| `reduccion-central-escalera` | CL5042 |
| `reduccion-lateral-derecha-escalera` | CL5044 |
| `reduccion-lateral-izquierda-escalera` | CL5046 |
| `union-simple-escalera` | CL5264, CL5265 |
| `kit-de-uniones-escalera` | KIT5262 |
| `tramo-divisor-escalera` | CL5259 |
| `soporte-suspension-escalera` | CL5271 |
| `acoplamiento-para-tablero-escalera` | CL5056 |
| `salida-horizontal-electroducto-escalera` | CL5268 |
| `salida-vertical-electroducto-escalera` | CL5269 |
| `salida-lateral-perfilado-escalera` | CL5270 |

Subfamílias (`type: "subfamilia"`, com `includedPages`):

| pagina_slug | páginas |
| --- | --- |
| `curvas-y-derivaciones-escalera` | as 8 curvas + 4 Te + 2 cruzetas (14) |
| `reducciones-escalera` | as 3 reduções |
| `uniones-y-empalmes-escalera` | união simples, kit de uniões, tramo divisor |
| `soportes-y-fijacion-escalera` | soporte de suspensión, acoplamiento para tablero |
| `salidas-escalera` | salida horizontal, salida vertical, salida lateral a perfilado |

## 5. As 4 peças compartilhadas NÃO ganham página

`CT3070`, `CT3211`, `FXS6221` e `FXS6235` aparecem na aba 02, mas já existem no
`catalog.json` em outras famílias, com texto e imagem próprios:

| SKU | onde já está |
| --- | --- |
| `CT3070` | página `soporte-travesano`, categoria `bandejas` |
| `CT3211` | produto `CT3211` (Tapa para perfilado), categoria `perfilados` |
| `FXS6221` | produto `FXS6221`, categoria `perfilados` |
| `FXS6235` | produto `FXS6235`, categoria `perfilados` |

Decisão da Yuki (12/09): **cross-reference, não duplicar.** Elas entram só em
`recommended` das páginas de escaleras — nada de página nova, nada de conteúdo
duplicado competindo no mesmo resultado de busca. Se a ficha renderizar
`recommended` de outra categoria, garantir que o link aponte para a rota onde a
peça realmente vive.

`recommended` vem pronto na coluna `Recomendados (código)` da planilha: quase
toda a família aponta para `KIT5262`, e as peças de fixação para `FXS6221` /
`FXS6235`.

## 6. Campos técnicos

- `Ancho [A]`, `Ala [B]`, `Longitud std`, `Espesores` → `dimensionAxes` /
  `dimensions`, igual perfilados.
- `Materiales` + `Tratamientos` → o eixo `finishes` de 5 valores já existente
  (`pz`, `gf`, `elec`, `aisi304`, `aisi316`). Não criar sigla nova: as siglas
  cruas da planilha (`PT`, `PNG`, `PNA`, `PBL`, `PBG`, `PES`) são as cores da
  pintura eletrostática e não têm legenda confirmada — mapear tudo para `elec`
  e deixar a cor como escolha na cotação, como bandejas já faz.
- `Regla espesor mínimo` → só usar se o schema de bandejas já tiver campo
  equivalente. Senão, deixar de fora por ora; não inventar mecanismo novo.
- `Uso principal`, `Aplicaciones/Sectores`, `Diferencial`, `Normas que cumple`,
  `Búsquedas alternativas` e `Unidad de venta` **já estão preenchidas** na aba
  02 pelo Akira (13/09) nos 29 SKUs — vêm prontas no CSV, é só importar.
- A norma de escaleras inclui **NBR IEC 61537**, confirmada por ele.
- Sentido das curvas verticais, corrigido por ele: **externa = baja el plano,
  interna = sube el plano.** Vale para CL5022, CL5024, CL5026, CL5028 e para a
  de inversión CL5074 (descendente).

## 7. Imagens — JÁ CONVERTIDAS, não refazer

**As 30 imagens já estão em `public/images/productos/` e o
`_manifest.csv` já tem as 30 linhas novas** (convertidas em 12/09 fora do
Code). Nesta rodada é só **ligar no `catalog.json`**, lendo do manifest — não
reconverter, não renomear, não mexer nos arquivos.

Pipeline usado (o mesmo do `docs/BRIEF-imagenes.md`): recorte da margem
branca, padding uniforme de 6%, webp com teto de 1400 px de largura,
qualidade 82, fundo branco achatado, nome por `pagina_slug`. Resultado:
1,27 MB no total, ocupação do conteúdo no quadro entre 74% e 80% — alinhado
com o que bandejas e perfilados já têm.

A tabela abaixo é o registro de origem de cada arquivo (também está no
`_manifest.csv`, nas colunas `origen` e `src`).

Origem: `Desktop/4. ESCALERAS JPG/` — os originais são JPG/PNG crus, 36
arquivos, 40,8 MB, de 1200×800 a 16837×11905.

Três saíram pequenos porque o original é pequeno e a peça ocupa pouco do
quadro: `union-simple-escalera` (484 px), `union-simple-escalera-ala75`
(484 px) e `salida-lateral-perfilado-escalera` (425 px) — vêm de arquivos de
1200×800 e 30 KB. Funcionam no card, mas vão ficar moles se a ficha exibir
grande. Foto melhor dessas três é pedido pro Akira, não bug do import.

| pagina_slug | rol | arquivo de origem |
| --- | --- | --- |
| `escalera-portacables` | primaria | `CL5011.jpg` |
| `escalera-portacables` | variante | `CLY5011.jpg` |
| `curva-horizontal-90-escalera` | primaria | `CL5016.jpg` |
| `curva-horizontal-recta-90-escalera` | primaria | `CL5018.jpg` |
| `curva-horizontal-45-escalera` | primaria | `CL5020.jpg` |
| `curva-vertical-externa-90-escalera` | primaria | `CL5022.jpg` |
| `curva-vertical-interna-90-escalera` | primaria | `CL5024.jpg` |
| `curva-vertical-externa-45-escalera` | primaria | `CL5026.jpg` |
| `curva-vertical-interna-45-escalera` | primaria | `CL5028.jpg` |
| `curva-vertical-inversion-90-escalera` | primaria | `CL5074.jpg` |
| `te-horizontal-escalera` | primaria | `CL5030.jpg` |
| `te-horizontal-recto-escalera` | primaria | `CL5032.jpg` |
| `te-vertical-ascendente-escalera` | primaria | `CL5034.jpg` |
| `te-vertical-descarga-escalera` | primaria | `CL5036.jpg` |
| `union-cruzeta-escalera` | primaria | `CL5038.jpg` |
| `union-cruzeta-recta-escalera` | primaria | `CL5040.jpg` |
| `reduccion-central-escalera` | primaria | `CL5042.jpg` |
| `reduccion-lateral-derecha-escalera` | primaria | `CL5044.jpg` |
| `reduccion-lateral-izquierda-escalera` | primaria | `CL5046.jpg` |
| `acoplamiento-para-tablero-escalera` | primaria | `CL5056.jpg` |
| `tramo-divisor-escalera` | primaria | `CL5259.jpg` |
| `union-simple-escalera` | primaria | `CL5264.jpg` |
| `union-simple-escalera` | variante | `CL5265.jpg` |
| `salida-lateral-perfilado-escalera` | primaria | `CL5270.jpg` |
| `soporte-suspension-escalera` | primaria | `CL5271.jpg` |
| `salida-horizontal-electroducto-escalera` | primaria | `CL5268.JPG` |
| `salida-vertical-electroducto-escalera` | primaria | `CL5269.JPG` |
| `kit-de-uniones-escalera` | primaria + byAla | `KIT3062-B.jpg`, `KIT3062-B(1).jpg`, `KIT3062-B(2).jpg` |

**As 26 páginas têm imagem.** Uma pendência: `escalera-portacables` /
variante pesado (CL5114) — a planilha diz que a foto é `CL5111`, e na pasta
existe `CL5111.png`. O código não bate com o SKU. **Não ligar essa imagem**
até o Akira confirmar.

### 7.1 `kit-de-uniones-escalera` é a exceção — imagem por variante

Mesma mecânica do `kit-de-uniones` de bandejas (`docs/BRIEF-imagenes.md`,
seção 2): os três renders não são a mesma peça em tamanhos diferentes — eles
mostram **a quantidade de tornillería que vem em cada kit**. A imagem carrega
informação que muda com a variante, então vai em `byAla`.

Confirmado com a Yuki (12/09): os três arquivos `KIT3062-B*` da pasta de
escaleras são do KIT5262, apesar do nome. O que cada render mostra:

| arquivo | conteúdo no render | chapa |
| --- | --- | --- |
| `KIT3062-B.jpg` | 2 chapas de 4 furos + 8× bulón, tuerca e arandela | mais baixa |
| `KIT3062-B(1).jpg` | 2 chapas de 8 furos + 16× bulón, tuerca e arandela | intermediária |
| `KIT3062-B(2).jpg` | 2 chapas de 8 furos + 16× bulón, tuerca e arandela | mais alta |

```json
"images": {
  "primary": "/images/productos/kit-de-uniones-escalera.webp",
  "byAla": {
    "60": "/images/productos/kit-de-uniones-escalera.webp",
    "65": "/images/productos/kit-de-uniones-escalera.webp",
    "75": "/images/productos/kit-de-uniones-escalera-ala75.webp",
    "95": "/images/productos/kit-de-uniones-escalera-ala100.webp",
    "100": "/images/productos/kit-de-uniones-escalera-ala100.webp"
  }
}
```

O comprador escolhe o tipo na ficha, e a miniatura troca junto — mesma
mecânica das variantes da bandeja. **Montar o `byAla` com o mapa acima.**

Como o mapa foi derivado: as três chapas têm a mesma largura e alturas
crescentes (razão altura/largura 0,671 · 0,734 · 0,866), e a quantidade de
tornillería sobe de 8× para 16×. Ou seja, B é a ala menor e B2 a maior. É
leitura das imagens, não dado da planilha — o Akira não confirmou a
associação ala↔render. Se um dia ele corrigir, é trocar os três caminhos no
`byAla`; o resto da ficha não muda.

Arquivos da pasta que **não entram**: `CT3070e.jpg`, `CT3211.jpg`,
`FXS6221.jpg`, `FXS6235.jpg` (as 4 peças compartilhadas já têm imagem própria
onde vivem), `CL5272.jpg` (não corresponde a nenhum SKU da aba — pendente com
o Akira) e `Thumbs.db`.

Alt text por imagem seguindo a convenção de bandejas/perfilados: nome da peça +
"para escalera portacables BGA" + o SKU.

## 8. SEO — entra nesta rodada

Rodada única: escaleras não terá segunda passada. O Akira já não revisa mais
nada (decisão da Yuki, 13/09), então o
`seo-escaleras-31-linhas-2026-09-13-v2.csv` é a versão final — as 31 linhas
estão com `Revisado por BGA = Sí`.

Esse CSV incorpora as duas decisões técnicas que ele tomou (a norma
NBR IEC 61537 e o sentido externa = baja / interna = sube) e corrige as
inconsistências que ficaram na aba 7, onde ele editou uns campos e outros não.
O registro está em `REVISAO-akira-escaleras-2026-09-13.md`.

Importar dele: `shortDescription`, `longDescription`, `faq`, `keywords`,
`meta` e `subtitle`, nas 26 páginas de produto e nas 5 de subfamília.

A aba 7 da planilha ainda tem só as 18 linhas antigas, algumas inconsistentes.
Substituir pelas 31 do v2 — a planilha continua sendo a fonte de verdade para
a próxima família, então não deixar ela divergindo do site.

## 8.1 Pendências que viraram decisão

Como não há mais rodada de revisão, nada disso fica esperando. Resolver assim:

| item | decisão |
| --- | --- |
| `CL5114` com foto nomeada `CL5111` | **não ligar** a imagem. A página `escalera-portacables` usa `CL5011.jpg` como primária e a CLY como variante; o tipo pesado entra sem miniatura própria |
| `KIT5262` — qual render é qual ala | **montar o `byAla` da seção 7.1** com as três imagens, para o comprador escolher o tipo na ficha. A associação ala↔render é leitura das imagens (chapa mais alta = ala maior), não confirmada pelo Akira |
| `CL5018` ancho `80O` | corrigir para `800` no import |
| `CL5264` e `CL5265` com o mesmo `Nombre ES` | a página `union-simple-escalera` diferencia pela ala, como já está no SEO — não renomear os SKUs |
| `CL5272.jpg` | ignorar, não entra no manifest |
| fotos de baixa resolução | sobem como estão |

## 9. Fechamento

- Rodar `scripts/build-search-index.mjs` depois do import.
- Conferir: 26 páginas de produto + 5 de subfamília em `escaleras`, 29 SKUs
  cobertos, 0 produtos legados com `page: 8` sobrando na categoria, e
  `displayMode: "catalog"` na categoria.
- Conferir que nenhuma página de escaleras ficou sem `images.primary`, sem
  `longDescription` ou sem `faq`.
- Commit em conventional commits, direto na main
  (`content: importa família escaleras da planilha oficial`).
