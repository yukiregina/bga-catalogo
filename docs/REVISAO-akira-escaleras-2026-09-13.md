# Revisão do Akira — escaleras (13/09/2026)

Como comparei: o conector do Google Sheets me devolve o texto das células, não a
formatação — **não consigo ver o amarelo**. Então diferenciei campo a campo,
comparando o que a Faro mandou em 12/09 com o que está na planilha agora. O
resultado abaixo é diff, não leitura de cor; se ele marcou alguma coisa em
amarelo sem mudar o texto, isso não aparece aqui.

---

## 1. Aba 02_Escaleras — ele preencheu as 29 linhas

As seis colunas que estavam vazias (`Uso principal`, `Aplicaciones/Sectores`,
`Diferencial/Observaciones`, `Normas que cumple`, `Búsquedas alternativas`,
`Unidad de venta`) estão preenchidas nos 29 SKUs — as 4 peças compartilhadas
(CT3070, CT3211, FXS6221, FXS6235) seguem vazias, como combinado.

Ele usou a proposta da Faro com **duas alterações**:

### 1.1 Norma — acrescentou NBR IEC 61537 nas 29 linhas

| | |
| --- | --- |
| Faro propôs | `NBR 7008 (pregalvanizado); NBR 6323 / ASTM 123 (galvanizado por inmersión en caliente)` |
| Akira | `NBR IEC 61537 (Sistemas de Eletrocalhas e Leitos para Cabos); NBR 7008 (...); NBR 6323 / ASTM 123 (...)` |

Eu tinha deixado a IEC 61537 de fora de propósito, por não ter confirmação de
que a BGA a reivindica para escalera. **Ele confirmou.** Agora ela entra
também no texto das páginas — acrescentei a frase "Cumple NBR IEC 61537
(Sistemas de Eletrocalhas e Leitos para Cabos)" no fim da descrição larga das
31 linhas, no mesmo formato que perfilados já usa.

### 1.2 Correção de sentido — externa/interna estava invertido

**Erro meu.** Ele corrigiu em cinco linhas:

| SKU | peça | Faro escreveu | Akira corrigiu |
| --- | --- | --- | --- |
| CL5022 | Curva Vertical Externa 90 | ascendente | **descendente** |
| CL5024 | Curva Vertical Interna 90 | descendente | **ascendente** |
| CL5026 | Curva Vertical Externa 45 | ascendente | **descendente** |
| CL5028 | Curva Vertical Interna 45 | descendente | **ascendente** |
| CL5074 | Curva Vertical de Inversión 90 | sem sentido definido | **descendente** com inversión |

Regra que fica: **externa = baja o plano · interna = sube o plano.**

---

## 2. Aba 07_TEXTOS_SEO — 18 das 31 linhas

Na aba 7 estão só as **18 primeiras** linhas de escaleras: da
`escalera-portacables` até a `reduccion-lateral-izquierda-escalera`.

Não estão lá as outras 13:

`union-simple-escalera` · `kit-de-uniones-escalera` · `tramo-divisor-escalera` ·
`soporte-suspension-escalera` · `acoplamiento-para-tablero-escalera` ·
`salida-horizontal-electroducto-escalera` ·
`salida-vertical-electroducto-escalera` ·
`salida-lateral-perfilado-escalera` · e as 5 de subfamília
(`curvas-y-derivaciones-escalera`, `reducciones-escalera`,
`uniones-y-empalmes-escalera`, `soportes-y-fijacion-escalera`,
`salidas-escalera`).

Conferi que não é corte na minha leitura: os blocos de bandejas (56 linhas) e
perfilados (33) vieram inteiros, e o documento termina exatamente no fim do
bloco de escaleras, com a última linha completa. Parece colagem parcial. Vale
confirmar olhando a planilha.

`Revisado por BGA` está **vazio** nas 18 — a marcação dele foi o amarelo, não
essa coluna.

### 2.1 O que ele mudou nas 18

As 18 linhas são as que a Faro mandou. Ele corrigiu **célula a célula**, e em
três das quatro linhas de curva vertical parou no meio: alguns campos ficaram
com o sentido novo e outros com o antigo. Resultado: a mesma linha diz "sobe"
num campo e "baja" no outro.

| linha | campo | sentido | |
| --- | --- | --- | --- |
| `curva-vertical-externa-90` | Subtitle | baja | editado |
| | Short description | baja | editado |
| | **Meta description** | **sube** | não editado |
| | **Palabras clave** | **sube** | não editado |
| | Descripción larga | os dois | editado — começa com "La curva vertical **interna** resuelve…", que é o texto da outra peça |
| `curva-vertical-interna-90` | Subtitle | sube | editado |
| | Short description | sube | editado |
| | **Meta description** | **baja** | não editado |
| | **Palabras clave** | **baja** | não editado |
| | Descripción larga | sube | editado — começa com "La curva vertical **externa** resuelve…" e mantém "Se fabrica con alas internas", que é da CL5022 |
| `curva-vertical-externa-45` | Subtitle | baja | editado — mas saiu `Bajda de 45°`, sem o "a" |
| | Descripción larga | baja | editado — "cierra el desnivel abierto por la curva vertical **externa** 45°", a peça fechando o desnível que ela mesma abriu; devia ser *interna* |
| | Palabras clave | baja | editado |
| | **Meta description** | **sube** | não editado |
| | **Short description** | **sube** | não editado |
| `curva-vertical-interna-45` | todos | sube | editado por inteiro — **esta ficou certa** |
| `curva-vertical-inversion-90` | todos | — | não tocado na aba 7 (mas corrigido por ele na aba 02) |

Uma dúvida a mais, não erro:

- `curva-vertical-externa-90-escalera` · Short description — ele tirou o
  "con alas internas". Mas a coluna `Notas` da aba 02 para o CL5022 continua
  dizendo "Tipo Leve - **Alas internas**". Mantive o "con alas internas" no v2,
  seguindo o dado da planilha. **Confirmar com ele.**

---

## 3. O que está no `seo-escaleras-31-linhas-2026-09-13-v2.csv`

- As 31 linhas, com a direção corrigida (externa = baja, interna = sube) e o
  texto reescrito por página — não trocado de lugar, então cada página fala da
  peça dela.
- `Bajda` → `Bajada`.
- O "desnivel abierto por la curva vertical interna 45°" na externa 45, e o
  par correspondente na interna 45.
- NBR IEC 61537 no fim da descrição larga das 31.
- Subtitles, metas e palavras-chave alinhados com o novo sentido.
- Title tags e meta descriptions todas dentro de 60 e 155 caracteres.

`Revisado por BGA` continua vazio: as 5 correções acima precisam do ok dele
antes de virar conteúdo publicado.

---

## 4. Pendências abertas com o Akira

1. Confirmar as 4 correções da seção 2.1 e o "alas internas" da CL5022.
2. Colar as 13 linhas que faltam na aba 7.
3. `CL5114` — planilha diz que a foto é `CL5111`; o código não bate com o SKU.
4. `CL5272.jpg` — está na pasta, não corresponde a nenhum SKU da aba.
5. `KIT5262` — qual dos três renders `KIT3062-B*` corresponde a qual ala.
6. Foto melhor de `CL5264`, `CL5265` e `CL5270` (originais 1200×800, peça
   pequena no quadro — os webp saíram em ~425–484 px).
7. `CL5018` — ancho `80O` com letra O, deve ser `800`.
8. `CL5264` e `CL5265` continuam com o mesmo `Nombre ES`.
