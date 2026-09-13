# PROMPT — Importar perfilados (dados do Akira) + textos SEO

*(v4 — 10/09. Corrige a v3 em três pontos: (a) o CSV técnico de perfilados
estava desatualizado e foi refeito; (b) o Akira já revisou o SEO de perfilados
na planilha, então ele entra nesta rodada em vez de ficar pra próxima; (c) as
3 edições que ele fez no texto já estão aplicadas no CSV de SEO. Se você tinha
aberto a v3, ignore — este arquivo substitui.)*

Contexto: Akira terminou de preencher a aba `03_PerfiladosF` da planilha
oficial (`BGA_Catalog_Template_vF`, Google Sheets nativo, id
`1h2L1QS4rBOglMtwdk472kh9kN6wdpvU1I5K0yFm6_XI`, conta `mkt@bga.com.py`) — é
essa aba que é fonte de verdade pra perfilados, não a `03_Perfilados` antiga.
Ele também revisou a aba `07_TEXTOS_SEO`.

## CSVs desta pasta — use estes, não os do dia 09

| Arquivo | O quê |
| --- | --- |
| `perfilados-planilha-oficial-2026-09-10.csv` | aba `03_PerfiladosF`, **31 SKUs**, todas as colunas |
| `seo-perfilados-32-linhas-2026-09-10-revisado.csv` | 32 linhas de SEO de perfilados, já com as edições do Akira e `Revisado por BGA = Si` |
| `seo-aba7-bandejas-tapas-2026-09-09.csv` | aba `07_TEXTOS_SEO`, as 57 linhas de bandejas + tapas |

Os arquivos `perfilados-planilha-oficial-2026-09-09.csv`,
`seo-perfilados-32-linhas-2026-09-09.csv` e
`perfilados-F-colunas-extra-2026-09-09.csv` são versões antigas — **não usar**.

## 1. CT3211 — não é bug, é código reaproveitado

`CT3211` é o mesmo código de uma tapa de bandeja, mas o Akira confirmou: a
BGA reaproveita esse código pra tapa do perfilado também, variando a largura
(hoje só existe a versão 38, perfil 38x10 — "Tapa para perfilado",
subfamília `Accesorio de Perfilado`). No `catalog.json` de hoje já existe UM
produto com `id: "CT3211"` e `categoryId: "perfilados"` — então o dado já tá
no lugar certo, só falta enriquecer com os campos da planilha (`Uso
principal`, `Aplicaciones`, `Unidad de venta`, `Materiales`, `Tratamientos`,
`Espesores`, `Normas`, `Búsquedas`). Não remover, não duplicar — é upsert
normal, igual aos outros 30 SKUs desta aba.

Se no futuro existir uma tapa de perfilado noutra largura, ela ganha SKU
próprio — por enquanto é só a de 38.

## 2. Import de perfilados — schema

1. Antes de tocar em nada, olhe o schema completo de um produto de bandejas
   que já tem os campos de texto (`richDescription`, aplicações, unidade de
   venda etc. — pegue qualquer um da categoria `bandejas` em
   `lib/catalog.json`) e reuse os mesmos nomes de campo pros equivalentes de
   perfilados. Não inventar chave nova pro mesmo dado.
2. Upsert por SKU: os 31 SKUs de `perfilados-planilha-oficial-2026-09-10.csv`
   entram/atualizam com todos os campos de texto e técnicos da planilha.
3. **Lembrete da profundidade decidida pro catálogo:** perfilados entra "o
   mais simples possível" (ver `CLAUDE.md`, seção de profundidade por
   família) — é conteúdo de página, não o configurador completo de
   material+tratamento que bandejas tem. Não construir ficha/carrinho novo
   pra essa família nesta rodada. `Recomendados` e `Regla espesor mínimo` já
   vêm prontos na planilha — só usar se o schema de bandejas já tiver um
   campo equivalente pra reaproveitar; senão, deixar de fora por ora (não
   inventar mecanismo novo só pra isso).

## 3. SKUs que saem

A `03_PerfiladosF` está em **31 SKUs**. O CSV do dia 09 tinha 32 e estava
errado em dois pontos — ele foi puxado no meio da edição do Akira:

- **`ST2012`** (Perfilado 38x19 Liso) saiu da aba — agora o 38x19 só tem a
  versão perforada (`ST2112`). A linha foi removida do CSV novo.
- **`ST2240` não existe mais** — virou `ST2239` (Platabanda Interna con 4
  Orificios). No dump antigo a coluna `Código` já dizia `ST2239` mas a coluna
  `SKU` ainda dizia `ST2240`. Conferido campo a campo contra a planilha de
  hoje: os dados são idênticos, só o código estava atrasado. Já corrigido no
  CSV novo.

Comparado com a aba antiga (`03_Perfilados`, 54 linhas), o Akira também
cortou os perfis 100x100x50 (`ST2231` a `ST2236`), o `ST238`, e um grupo de
acessórios que não seguiu — `ST2223`,`ST2224`,`ST2225`,`ST2247`,`ST2248`,
`ST2253`,`ST2255`,`ST2256`,`ST2257`,`ST2258`. (Os pares `ST2246-1/-2`,
`ST2249-1/-2`, `ST2250-1/-2`, `ST2251-1/-2` da aba antiga não contam como
cortados — viraram uma linha só, singular, na `03_PerfiladosF`.)

No `catalog.json` de hoje, `ST2241` ainda existe como produto `perfilados` —
**remover**. (`ST2012` nunca chegou a entrar no `catalog.json`, e `ST2239` já
está lá com o código certo — nada a fazer nesses dois.)

## 4. Mais 3 SKUs sem explicação — saem também

`KIT2227`, `ST2260`, `ST2267` estão em `perfilados` no `catalog.json` hoje e
não aparecem em nenhuma das abas da planilha. Confirmado com a Yuki (09/09):
**saem os três**. Com o `ST2241` da seção 3, são **4 remoções** ao todo:
`ST2241`, `KIT2227`, `ST2260`, `ST2267` — todos verificados como presentes no
`catalog.json` hoje.

## 5. SEO aba 7 — bandejas/tapas

As 57 linhas de bandejas + tapas estão todas com `Revisado por BGA = Sí`.
Comparar `seo-aba7-bandejas-tapas-2026-09-09.csv` com o que já está em
`richDescription`/FAQ/meta dos produtos de bandejas no `catalog.json` e
atualizar o que tiver mudado.

## 6. SEO aba 7 — perfilados: aprovado, entra nesta rodada

As 32 linhas estão na planilha com **`Revisado por BGA = Si`** — o Akira já
revisou. Importar de `seo-perfilados-32-linhas-2026-09-10-revisado.csv`.

Cobertura: 28 páginas de produto (os 31 SKUs agrupados por conceito —
perfilado 38x38 como página com liso/perforado, 38x19 só perforado; `CT3211`
como tapa; as 8 curvas/derivações, 5 uniões + platibanda, 5 soportes/fixação,
3 saídas + caixa de tomada, cada uma na sua própria página) mais 4 páginas de
subfamília (curvas, uniões, soportes, saídas/caixas), pra manter a mesma
estrutura de navegação que bandejas já tem.

**O que o Akira mudou na revisão** (3 edições em 32 linhas; as outras 29
ficaram idênticas ao que foi mandado). Já aplicadas no CSV — estão aqui só
como registro:

| Linha | Campo | Mudança |
| --- | --- | --- |
| `curva-horizontal-90-perfilado` | Descripción larga | "resuelve el giro" → "soluciona el giro" |
| `perfilado-38x38` | Palabras clave | acrescentou `perfil 38x38` no início |
| `perfilado-38x19` | Palabras clave | acrescentou `perfil 38x319` no início |

⚠️ `perfil 38x319` é erro de digitação do Akira — o produto é 38x19. **Foi
mantido no CSV como ele escreveu, de propósito**: quem corrige é a Yuki, na
planilha, não o Code no import. Se a correção já tiver sido feita na planilha
quando este prompt rodar, use o valor da planilha.

## 7. Depois de importar

- Rodar `node scripts/build-search-index.mjs` (ou o comando de prebuild que
  já existe) pra regerar `search-index.json`.
- `npm run build` tem que passar.
- Dois commits separados (conventional commits):
  1. `content: importa perfilados da 03_PerfiladosF (planilha 10/09)` — os 31
     SKUs e as 4 remoções.
  2. `content: textos SEO de perfilados e bandejas/tapas (aba 07, revisada)` —
     as 32 linhas de perfilados e as atualizações de bandejas/tapas.
