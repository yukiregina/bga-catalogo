# Brief — imagens de produto no catálogo

> Para executar no Claude Code, dentro de `bga-catalogo`.
> Leia o `CLAUDE.md` da raiz antes de começar.
> **Rodar depois do `BRIEF-paginas-y-contenido.md`.** As imagens são nomeadas
> por `pagina_slug`; sem a reestrutura de rotas elas não têm onde encaixar.

---

## Estado atual

`public/images/productos/` já tem **50 arquivos `.webp`** prontos (1400 px de
largura, qualidade 82, fundo branco achatado). Total 1,13 MB. Não precisa
converter nada — só ligar.

**Cobertura: 36 de 36 páginas de produto.** Nenhuma página sobe sem imagem.

`public/images/productos/_manifest.csv` mapeia cada arquivo:

```
pagina_slug, rol, sku, origen, src, bytes
```

`rol` assume quatro valores:

| `rol` | qtd | significado |
| --- | --- | --- |
| `primaria` | 36 | render da peça — imagem principal da página e do card |
| `tapa` | 10 | render da tapa correspondente |
| `seccion-U` / `seccion-C` | 2 | corte transversal, só em `bandeja-portacables` |
| `variante-ala75` / `variante-ala100` | 2 | só em `kit-de-uniones` — ver abaixo |

Fonte: `Desktop/BGA-catalogo/4. Catálogo Sitioweb/3. BANDEJAS JPG/`, com as
correções de identificação do Akira já aplicadas.

---

## O que fazer

### 1. `images` no objeto de página do `catalog.json`

Cada página `tipo = producto` ganha:

```json
"images": {
  "primary": "/images/productos/curva-de-descarga.webp",
  "tapa": "/images/productos/curva-de-descarga-tapa.webp"
}
```

`bandeja-portacables` ganha também:

```json
"secciones": {
  "U": "/images/productos/bandeja-portacables-seccion-u.webp",
  "C": "/images/productos/bandeja-portacables-seccion-c.webp"
}
```

Ler do `_manifest.csv`, não digitar à mão. Campos ausentes são omitidos — nunca
string vazia, para o componente poder testar com `?.`.

### 2. `kit-de-uniones` é a exceção — imagem por variante

O KIT3062 é **um SKU só**, com `Ala disponibles = 50,75,100`. Mas os três
renders não são a mesma peça em tamanhos diferentes: eles mostram a
**quantidade de tornillería que vem em cada kit** — 2 chapas + 8 conjuntos para
ala 50, 12 para ala 75, 16 para ala 100.

Ou seja, a imagem carrega informação que muda com a variante. É a única página
do catálogo onde isso acontece.

```json
"images": {
  "primary": "/images/productos/kit-de-uniones.webp",
  "byAla": {
    "50":  "/images/productos/kit-de-uniones.webp",
    "75":  "/images/productos/kit-de-uniones-ala75.webp",
    "100": "/images/productos/kit-de-uniones-ala100.webp"
  }
}
```

Na ficha, a imagem troca quando o usuário escolhe o ala. Sem escolha, mostra a
`primary` (ala 50). O card do grid usa sempre a `primary`.

Não generalizar esse padrão. Nas outras 35 páginas o render é o mesmo desenho
para todas as variantes.

### 3. Componente de imagem

- **Card no grid da família e da subfamília:** `images.primary`.
- **Ficha:** `images.primary` grande. Se houver `tapa`, galeria de duas
  miniaturas (peça / tapa) com legenda — a tapa se cotiza à parte, o usuário
  precisa ver que são duas peças.
- **`bandeja-portacables`:** as duas seções entram como diagrama de apoio ao
  lado do seletor Tipo U / Tipo C, não na galeria principal. É o que faz o
  dropdown de variante ficar compreensível.
- `next/image` com `unoptimized` (já está no `next.config.mjs`), `width` e
  `height` explícitos para não causar layout shift, e `loading="lazy"` em tudo
  que não seja a primeira dobra.

### 4. `alt` — não é enfeite

Gerar do conteúdo que já existe na planilha, não do slug:

```
alt = `${nombre da página} BGA — ${subtitle}`
```

Ex.: `"Curva Horizontal 90° BGA — cambio de dirección horizontal a 90° con radio"`.
Na tapa, prefixar `"Tapa para "`. No kit, acrescentar o ala
(`"…— kit para ala 75 mm"`). O catálogo existe para ser encontrado; `alt`
genérico (`"produto"`, `"imagem"`) desperdiça isso.

### 5. Schema JSON-LD

Acrescentar `image` ao `Product` de cada página de produto, com a URL absoluta
(`https://<domínio>/images/productos/<slug>.webp`). Sem isso o rich result de
produto não renderiza foto.

### 6. Open Graph

`openGraph.images` da página de produto passa a apontar para a `primary` em vez
do preview genérico da marca.

---

## O que NÃO fazer

- Não reconverter nem re-otimizar os `.webp`. Já estão prontos.
- Não gerar imagem por variante lisa/perforada nem U/C. O render é o mesmo
  desenho — é exatamente a duplicação que o `BRIEF-paginas-y-contenido.md`
  resolve. (O `kit-de-uniones` é a única exceção, pelo motivo do item 2.)
- Não usar `next/image` com `loader` remoto. Export estático, imagem local.
- Não deixar card sem altura definida quando falta imagem — quebra o grid.

---

## Pendência de asset (não bloqueia)

Três imagens têm texto queimado dentro do render, que vai ao ar como está:

| arquivo | texto | por quê incomoda |
| --- | --- | --- |
| `salida-lateral-perfilado.webp` | "*Ancho ajustado para encajar mejor visualmente" | é nota interna de quem fez o render, não informação de produto |
| `te-vertical-descarga-tapa.webp` | "Tapa de Te vertical de descarga" | legenda redundante — a página já tem título |
| `te-vertical-descarga-lateral-tapa.webp` | "Tapa de Te vertical de descarga lateral" | idem |

Pedir os três limpos à BGA quando houver outra rodada. Enquanto isso, sobem
assim.
