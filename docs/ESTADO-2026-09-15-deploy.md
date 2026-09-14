# Handoff — deploy do catálogo BGA

Escrito em 14/09/2026, pra ser colado numa task nova no dia do deploy.
Contexto: a sessão anterior montou a camada de medição inteira e preparou o
domínio. Falta só a troca de app no Amplify.

> **Como usar:** cola este arquivo inteiro na primeira mensagem da task nova e
> diz em que passo você está. O repo `bga-catalogo` precisa estar conectado
> como pasta.

---

## 1. O que existe hoje (tudo já feito, não refazer)

**Código** — `bga-catalogo`, branch `main`, **tudo pushado**:

- GTM substituiu o gtag como carregador (`components/Analytics.jsx`), com
  guarda de hostname `bga.com.py` / `www.bga.com.py` e escape por `gtm_debug`
- `lib/analytics.js` empurra pro `dataLayer`; 8 eventos instrumentados
- `lib/attribution.js` captura utm/gclid/fbclid, TTL 90 dias, último toque pago
- atribuição chega nos dois formulários
- campo opcional de WhatsApp no carrinho
- metatag de verificação do Search Console no `layout.jsx`
- `scripts/build-sitemap.mjs` gera 198 URLs no `prebuild`
- política de privacidade cobre GTM, GA4, Google Ads, Meta, e lista os campos
  reais do formulário

**Fora do código, tudo pronto:**

| | |
| --- | --- |
| GTM | `GTM-M9CWZQV8`, conta da BGA, **versão v1 publicada** |
| GA4 | `G-3PF2RG7WNG`, propriedade "BGA - Site", conta `mkt@bga.com.py` |
| Dimensões personalizadas | 7 criadas (familia, sku, sku_compuesto, producto, origen, rubro, termino) |
| Retenção | 14 meses (já estava) |
| Filtro de tráfego interno | criado com o IP do escritório — **conferir se está Ativo, não Testando** |
| Search Console | 2 propriedades (com e sem www), verificadas, a sem-www vinculada ao GA4 |
| Apps Script | v6 implantada, coluna `WhatsApp` (U) criada na aba `Cotizaciones` |
| Redirect no app ANTIGO | `www` → raiz, 301 |

**Linha de base registrada** em `docs/LINEA-BASE-pre-catalogo-2026-09-13.md`:
359 usuários em 4,5 meses, ~79/mês, 13 leads no GA4 contra 12 na planilha.
Não medir nada contra outra fonte antes de ler esse arquivo.

---

## 2. A situação do Amplify (a parte confusa)

São **dois apps diferentes**, e o domínio só pode estar em um por vez:

| App | Região | O que é | Estado |
| --- | --- | --- | --- |
| `bga-site` | Ohio | landing antiga | **serve `bga.com.py` hoje** |
| `bga-catalogo` | Virgínia | o catálogo novo | sem domínio, só URL `.amplifyapp.com` |

A região não importa pra performance — o Amplify serve por CloudFront e o que
conta é o edge. O que importa é que **configuração não migra entre apps**:
regras de redirect, variáveis, tudo é por app.

---

## 3. Passo a passo do deploy

### 3.1 Antes de tocar no domínio

1. Confirmar que o build mais recente do app do catálogo passou (verde).
2. Abrir a URL `.amplifyapp.com` e percorrer: home → família → ficha →
   agregar → `/cotacao` → enviar. **O GTM não vai carregar ali** (guarda de
   hostname) — isso é esperado, não é defeito.
3. Se quiser ver evento, entrar pelo **Preview do GTM**, que põe `gtm_debug`
   na URL e libera a guarda.

### 3.2 Trocar o domínio

1. No app **antigo** (`bga-site`, Ohio): remover o domínio `bga.com.py`.
2. No app **novo** (`bga-catalogo`, Virgínia): adicionar `bga.com.py`.
3. Nos subdomínios: `bga.com.py` → branch `main`, e `www` → branch `main`.
   **Deixar DESMARCADA** a caixa "Setup redirect from bga.com.py to
   www.bga.com.py" — o canônico do site é sem www.
4. Esperar o certificado SSL. Leva de minutos a algumas horas e não dá pra
   prever; o console mostra o status. **Esta é a janela de risco** — o domínio
   pode ficar fora do ar ou dar erro de certificado até terminar.

### 3.3 Recriar as regras de redirect (no app NOVO)

`Hosting ▸ Rewrites and redirects`, editor de texto, **nesta ordem** — o
Amplify avalia de cima pra baixo e para na primeira que casa:

```json
[
  { "source": "https://www.bga.com.py/<*>", "target": "https://bga.com.py/<*>", "status": "301", "condition": null },
  { "source": "/<*>", "status": "404", "target": "/404.html" }
]
```

A segunda regra é **diferente da do app antigo**. Lá era `404-200 →
/index.html`, que é padrão de SPA. O catálogo é export estático com ~200
páginas HTML reais e gera `out/404.html`. Manter `404-200` aqui produziria
soft 404 (qualquer URL errada devolvendo a home com status 200), esconderia o
`app/not-found.jsx` e estragaria o relatório de 404 no GA4.

---

## 4. Conferência pós-deploy

- `www.bga.com.py/?x=1` cai em `bga.com.py` — **use janela anônima ou
  parâmetro**, o 301 antigo está em cache no teu navegador
- uma página de produto abre direto (ex.: `/catalogo/bandejas/`)
- uma URL inexistente devolve a página 404 de verdade, não a home
- `bga.com.py/sitemap.xml` responde e tem as 198 URLs
- um evento chega no GA4 — **não olhe o Tempo real da tua máquina**, teu IP
  está no filtro de tráfego interno e vai aparecer zero. Use o DebugView ou
  abra pelo celular no 4G.
- uma cotização de teste grava linha na planilha com atribuição nas colunas
  P–T e o WhatsApp na U

Depois: **anotação no GA4 com a data do deploy** (Admin ▸ Anotações). Sem
isso, daqui a três meses ninguém entende por que as métricas de página mudaram
de patamar de um dia pro outro.

---

## 5. Rollback

**Não deletar o app de Ohio.** Deixar de pé por algumas semanas. Se algo der
errado, voltar o domínio pra lá é o caminho mais rápido — com a mesma espera
de certificado, então não é instantâneo, mas é o que existe.

---

## 6. Armadilhas conhecidas

- **Linhas de teste na planilha.** O webhook do lead não tem guarda de
  hostname: cotização enviada pela URL do Amplify **grava na planilha de
  produção**, com `Origen: catalogo`, igual a lead real. Se o teste com o
  cliente gerar linhas, achar e apagar antes de começar a medir.
- **O filtro de tráfego interno esconde teus próprios testes** de todos os
  relatórios, Tempo real incluído.
- **Navegador cacheia 301** com força. Sempre testar redirect com parâmetro
  novo ou em janela anônima.
- **Editar o `.gs` no repo não implanta nada** — o Apps Script vive no editor
  do Google. Se mexer nele, republicar em Gerenciar implantações → Editar →
  **Nova versão** da implantação existente (implantação nova muda a URL e o
  site passa a falar com o código velho, sem erro nenhum).

---

## 7. Depois do deploy, na ordem

1. Teste de usabilidade com a Aida e com um comprador
2. Marcar os 3 eventos-chave no GA4 (`agregar_cotizacion`,
   `cotizacion_enviada`, `click_whatsapp`) — **só dá depois que houver tráfego
   real**, Preview não conta
3. ~2 semanas de tráfego orgânico, pra destravar os eventos-chave e pros
   primeiros termos aparecerem no Search Console
4. Só então a primeira campanha, pequena, tratada como teste do circuito

**Três perguntas pendentes pro Akira:**

- `google / cpc` com 3 sessões na linha de base — existe conta de Google Ads
  da BGA? Se existir, tem histórico com valor.
- Capacidade: a Aida atende ~3 leads/mês hoje com folga. Se o catálogo
  multiplicar isso, o gargalo sai do site e vai pra ela.
- Se for criar a coluna `Tamaño` (chico/mediano/grande) na planilha: a partir
  de quanto um pedido é grande pra eles? Sem faixa combinada a coluna vira
  ruído. Ela iria na **V**, porque a U agora é WhatsApp.

---

## 8. Onde está documentado o quê

| Arquivo | O que tem |
| --- | --- |
| `docs/MEDICION-ga4-gtm.md` | identificadores, contrato do dataLayer, GTM, GA4, Search Console, redirects, checklist de fechamento |
| `docs/LINEA-BASE-pre-catalogo-2026-09-13.md` | o retrato do site antes do catálogo, e o que é ou não comparável depois |
| `docs/PLANO-medicao-e-anuncios-2026-09-13.md` | as 4 fases, convenção de UTM, como ler retorno |
| `docs/PROMPT-medicao-gtm-2026-09-13.md` | o prompt dos 7 blocos, já executado |
