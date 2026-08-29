# Revisão de textos do Akira — leitura das marcações (28/08/2026)

> **RESOLVIDO em 29/08/2026.** O Akira respondeu as duas perguntas. As
> correções já foram aplicadas na planilha — backup do estado anterior em
> `BGA_Catalog_Template_vF_bandejas RevAkira_BACKUP-antes-correcoes.xlsx`.
>
> - **Linhas em vermelho:** foi mal-entendido dele — achou que a IA tinha
>   juntado as linhas por engano. **As 6 páginas ficam.**
> - **Tipo A:** é cable de acero mesmo. Tipo A = cable de acero,
>   tipo B = varilla roscada. Subtitle e meta description corrigidos.
> - **KIT3062:** 1 SKU com variantes de ala, código `KIT3062` mantido.
> - **CT3212 (presilla para tapa):** descartado — foi peça única para um
>   cliente, não é mais vendida.

Arquivo: `BGA_Catalog_Template_vF_bandejas RevAkira.xlsx`, aba `07_TEXTOS_SEO`.

Duas marcações, ambas **só nesta aba**. A `01_Bandejas` não tem nenhuma marca do
Akira — as 91 correções técnicas já estavam aplicadas antes.

- **Fundo amarelo puro (`FFFFFF00`): 10 células.** Textos que ele reescreveu.
- **Fonte vermelha (`FFFF0000`): 6 linhas inteiras (40–45).** O que ele acha que
  pode sair.

---

## 1. Os 10 amarelos — o que mudou de fato

### A. Peças que são sob medida (2)

| célula | página | o que ele acrescentou |
| --- | --- | --- |
| L13 | `te-horizontal` · FAQ 1 | "El Te se fabrica con un ancho por boca. Pero es posible cambiar el ancho de la salida central, para esto confirmar con el vendedor mostrando un dibujo de la instalación." |
| J20 | `desnivel-simple` · descripción larga | "Es posible cambiar la altura según su necesidad, para esto confirmar con el vendedor." |

**Consequência de produto, não só de texto.** Estas duas peças são
configuráveis, não só cotáveis. Pela `faro-catalogo-cotizacion` §1, isso é a
diferença entre `modo_cotizacion = carrito` e `= consultar`. Não precisa tirar
do carrinho — mas a ficha destas duas precisa do caminho
"Consultar con un especialista" visível ao lado do "Agregar a cotización",
senão entra pedido incompleto exatamente onde ele avisou que entra.

### B. Especificação técnica que faltava (5)

| célula | página | dado novo |
| --- | --- | --- |
| F30 | `kit-de-uniones` · subtitle | o kit **inclui a tornillería** |
| J31 | `tramo-divisor` · descripción larga | perfil L, **3000 mm de largo × 25 mm de base**, mesma altura do ala |
| I36 · J36 | `mano-francesa-triangular` | dimensiona como **ancho da bandeja + 50 mm**; para escalera, **+100 mm** |
| O37 · P37 | `soporte-travesano` · FAQ 3 (nova) | "¿Se especifica por longitud?" → sim, **ancho da bandeja + 100 mm** |

O travesaño e a mano francesa passam a ter regra de dimensionamento explícita.
Vale conferir se o carrinho pede o campo certo nessas duas — hoje a coluna
`Unidad de venta` do CT3070 diz "Pieza" e `Ala` está como "-".

### C. Correção de identificação (2) — **gera conflito interno**

| célula | página | o que ele diz |
| --- | --- | --- |
| I33 | `soporte-suspension-tipo-a` | tipo A = **horizontal**, fixação por **cable de acero**, "desde el tirante" |
| I34 | `soporte-suspension-tipo-b` | tipo B = **vertical**, por **varilla roscada** |

⚠️ **A página do tipo A ficou dizendo três coisas diferentes:**

| campo | texto atual |
| --- | --- |
| Subtitle | "suspensión con brazo horizontal desde **varilla**" |
| Meta description | "suspensión con brazo horizontal desde **varilla**" |
| Short description (o amarelo) | "Fijación mediante **Cable de Acero** — ... desde el **tirante**" |

Se o Akira está certo, o Subtitle e a Meta do tipo A estão errados e precisam
virar "cable de acero". Isso vale confirmar com ele antes de propagar — é o
tipo de correção que, aplicada ao contrário, sai no title tag e no Google.

### D. Typos no texto dele (não bloqueiam, mas entram no ar)

- F30 `kit-de-uniones`: "Kit de Uniones **com** tornillería" → `con` (português vazando)
- L13 `te-horizontal`: "mostrando **um dibuijo**" → `un dibujo`
- I33 `soporte-suspension-tipo-a`: em Title Case e com `–` e `—` na mesma frase.
  As outras 35 short descriptions seguem um padrão só; esta precisa ser
  normalizada ao padrão, mantendo o conteúdo dele.
- **Pré-existente, achado de passagem:** I37 `soporte-travesano` diz
  "se especifica por **longirud**" → `longitud`.

---

## 2. Os vermelhos — linhas 40 a 45

Não são células soltas. São **6 linhas inteiras**, e são exatamente toda a
camada de navegação intermediária:

| linha | slug | tipo |
| --- | --- | --- |
| 40 | `accesorios-de-curva` | subfamilia (15 peças) |
| 41 | `reducciones-y-desvios` | subfamilia (6) |
| 42 | `soportes-y-fijacion` | subfamilia (6) |
| 43 | `uniones-y-empalmes` | subfamilia (4) |
| 44 | `salidas-y-terminaciones` | subfamilia (4) |
| 45 | `materiales-y-tratamientos` | contenido |

**Isto é decisão de escopo, não correção de texto.** Antes de aceitar:

**A favor de cortar** — são as únicas 6 linhas que não correspondem a uma peça
física. Faz sentido que quem revisa conhecendo o produto olhe para elas e não
saiba o que fazer. O catálogo fica com dois níveis (família → peça), 36 páginas,
mais simples de manter.

**Contra** — três coisas dependem delas:

1. **Os cards de intenção da página de bandejas.** Hoje são `<div>` sem destino
   (`BRIEF-paginas-y-contenido.md`, item 3). As 5 subfamílias são o destino que
   ia ligar esses cards. Se saem, ou os cards continuam mortos, ou os cards
   saem junto.
2. **A página de materiais é o lugar onde a divergência de materiais se
   resolve** (a planilha lista as chapas, o catálogo 25-26 lista as ligas). Sem ela,
   a tabela de materiais volta a se repetir nas 6 famílias — que é o problema
   que ela existia para resolver.
3. **É a camada indexável.** Uma página de 15 peças com FAQ próprio é o tipo de
   página que responde "que accesorios existen para curva de bandeja". As 36
   páginas de peça isoladas não respondem isso.

**O que sugiro:** perguntar o *porquê* antes de executar. A resposta muda o que
fazer:

- Se for *"isso não é produto, não sei revisar"* → mantém as 6, tira da lista de
  revisão dele, e o OK dessas páginas vem de outra pessoa.
- Se for *"o cliente não procura assim, isso confunde"* → aí é feedback de
  negócio e vale cortar mesmo, mas junto com os cards de intenção, para não
  deixar promessa de navegação sem destino.

---

## 3. Resumo — tudo aplicado

1. ~~Perguntar ao Akira sobre as 6 linhas em vermelho e sobre cable vs. varilla~~
   → respondido. As 6 páginas ficam; tipo A é cable de acero, tipo B é varilla
   roscada.
2. Os 10 amarelos aplicados aos textos, com os typos corrigidos. ✓
3. Correção do tipo A propagada para o Subtitle e a Meta description. ✓
4. `te-horizontal` e `desnivel-simple` precisam do caminho de consulta na
   ficha (o Akira disse que são configuráveis sob medida). **Isso é
   implementação** — está no `BRIEF-paginas-y-contenido.md`, seção "Peças
   configuráveis".
5. "longirud" → "longitud" em `soporte-travesano`. ✓
6. `Revisado por BGA` = "Sí" nas 42 páginas e nas 144 linhas de SKU (o Akira
   confirmou que leu tudo, só não tinha marcado). ✓
