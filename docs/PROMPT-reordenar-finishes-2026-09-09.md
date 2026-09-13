# Prompt pro Claude Code — ordem dos finishes (só dados)

Continuação do trabalho de 2 colunas (ainda não commitado). Substitui qualquer
versão anterior deste arquivo. **Nenhuma linha de `ProductSheet.jsx` muda.**

## O alvo

Em `lg:grid-cols-2`, com 5 opções:

```
(1,1) Pregalvanizado (PZ)      (1,2) Galvanizado por inmersión
(2,1) INOX AISI 304            (2,2) INOX AISI 316
(3,1) Pintura electrostática
      ↓ campo "¿Qué color?" abre aqui, logo abaixo dela
```

O campo de cor continua onde está no código: irmão depois do grid, largura
cheia, `mt-3`. Com a pintura sozinha na última linha e na coluna da esquerda, o
campo abre imediatamente abaixo dela — que é o efeito que se queria, sem tocar
no componente.

## O que editar

Em `lib/catalog.json`, a linha por produto:

```json
"finishes": ["pz", "gf", "elec", "aisi304", "aisi316"],
```

→

```json
"finishes": ["pz", "gf", "aisi304", "aisi316", "elec"],
```

**51 ocorrências, todas idênticas, todas em uma linha só.** Substituição
literal linha a linha — nada de reserializar o JSON com `JSON.stringify`, que
reformata o arquivo inteiro e vira um diff de milhares de linhas.

Confirmar antes: `grep -c '"finishes": \["pz", "gf", "elec", "aisi304", "aisi316"\]' lib/catalog.json` → **51**.
Confirmar depois: esse grep → **0**, e o da ordem nova → **51**.

## Não mexer

- **`globalSpecs.finishes` (linha ~96) fica como está.** Quem define a ordem da
  UI é o array `finishes` de cada produto — `resolvedFinishes` faz
  `product.finishes.map(id => gs.finishes.find(...))`. O global é só o
  dicionário de definições; reordenar ele não muda nada e só suja o diff.
- Nenhuma linha do `ProductSheet.jsx`.

## Não quebra

- `selectedFinish` inicial é `resolvedFinishes[0]?.id` → continua `pz`.
- Leitura de URL (`params.get('finish')`) valida por id, nunca por índice.
- Carrinhos já gravados guardam o id do finish, não a posição.

## Verificar

1. `npm run build` passa.
2. Em 1280px, numa ficha de bandeja: a grade bate com o desenho lá de cima.
3. Clicar em "Pintura electrostática en polvo" → o campo "¿Qué color?" abre
   logo abaixo dela, sem salto visual.
4. Em 768–1023px e em 375px: 1 coluna, ordem lida de cima pra baixo continua
   fazendo sentido — PZ, GF, os dois INOX, pintura.

## Commit

Entra junto com a mudança das 2 colunas — é a mesma decisão de layout:

```
refactor(ficha): material y terminación em 2 colunas, pintura por último
```

O commit do segundo ancho das reducciones continua separado e vem antes.
