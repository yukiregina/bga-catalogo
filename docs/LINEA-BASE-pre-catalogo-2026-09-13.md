# Linha de base — bga.com.py antes do catálogo

Puxado do GA4 em 13/09/2026, propriedade **BGA - Site** (`G-3PF2RG7WNG`).
Janela: **16 de agosto a 12 de setembro de 2026** (últimos 28 dias fechados).

Este é o retrato do domínio servindo **só a landing antiga** (`bga-site`). Serve
pra comparar depois que o catálogo assumir `bga.com.py`. Depois da troca não dá
mais pra isolar isso — por isso está registrado agora.

---

## Aviso de leitura (importante antes de usar qualquer número)

O relatório bruto mistura duas coisas:

| | Usuários | O que é |
| --- | --- | --- |
| `/` (home da landing) | **101** | público real |
| `/catalogo/*` e `/cotacao/*` | 8 a 11 | **teste interno** — você, o Akira, a sessão com a Aida |

O catálogo nunca foi publicado, então todo evento de catálogo na janela é
tráfego de desenvolvimento e revisão. O pico de **29/08 (216 visualizações, do
Brasil, no Chrome)** que o próprio GA4 sinaliza como anomalia é disso.

Dois efeitos:

1. **Use 101, não 106**, como número de visitantes reais da landing.
2. O filtro de tráfego interno foi criado em 13/09 e **não vale
   retroativamente** — não adianta reprocessar a janela.

---

## 1. Volume (28 dias)

| Métrica | Valor |
| --- | --- |
| Usuários ativos na home `/` | **101** |
| Usuários ativos, total da propriedade | 106 |
| Novos usuários | 102 (96% do total — quase ninguém volta) |
| Sessões | 163 |
| Visualizações da home `/` | 194 |
| Visualizações, total | 565 |
| Contagem de eventos | 1.631 |
| Tempo médio de engajamento por usuário | 1 min 47 s |
| Taxa de rejeição da home | 38,5% |

Ordem de grandeza: **cerca de 100 pessoas por mês**, quase todas na primeira
visita. É pouco — e é exatamente por isso que a comparação vai ser legível:
qualquer campanha aparece.

---

## 2. De onde vêm (sessões por origem/mídia)

| Origem / mídia | Sessões |
| --- | --- |
| (direct) / (none) | 79 |
| google / organic | 59 |
| l.wl.co / referral | 9 |
| bing / organic | 8 |
| facebook.com / referral | 4 |
| **google / cpc** | **3** |
| chatgpt.com / ai-assistant | 1 |

Duas coisas pra perguntar ao Akira:

- **`google / cpc` com 3 sessões** — isso é clique pago. Ou existe (ou existiu)
  uma conta de Google Ads da BGA rodando alguma coisa, ou é resquício de teste.
  Vale descobrir antes de criar conta nova: se já existe histórico, ele tem
  valor.
- **`l.wl.co`** é encurtador de link do WhatsApp Business. 9 sessões vindas de
  conversa — ou seja, a vendedora já manda o site no WhatsApp hoje. Isso é o
  caminho que o catálogo vai alimentar.

---

## 3. Quem são

**Cidades:** Asunción 29 · São Paulo 16 · Ciudad del Este 4 · Buenos Aires 3 ·
Ashburn 2 · Curitiba 2 · Fort Worth 2

São Paulo em segundo lugar é você e o trabalho da Faro; Ashburn e Fort Worth são
datacenter (bot/scanner). O público paraguaio real está em Asunción e Ciudad del
Este.

**Dispositivo:** desktop 67,3% (72 usuários) · mobile 32,7% (35)
**Sistema:** Windows 50 · Android 19 · Macintosh 17 · iOS 16 · Linux 2

Comprador industrial no desktop, como esperado — mas um terço no celular não é
desprezível, e o carrinho de cotação precisa aguentar isso.

---

## 4. O que as pessoas fazem hoje (o número que mais importa)

Eventos da landing antiga, na janela:

| Evento | Contagem | Usuários | % dos 101 |
| --- | --- | --- | --- |
| `file_download` (o PDF do catálogo) | 52 | **27** | **~27%** |
| `form_start` | 6 | 6 | 6% |
| `click_cta_form` | 5 | 4 | 4% |
| `click_whatsapp_direct` + `click_wa_direct` | 5 | 4 | 4% |
| `form_submit` | 2 | 2 | 2% |
| `generate_lead` | 2 | 2 | **2%** |
| `click_nav_products` | 1 | 1 | 1% |
| `view_search_results` | 1 | 1 | 1% |

**A leitura:** de cada 100 visitantes, **27 baixam o PDF e 2 preenchem o
formulário.** O PDF é o que a pessoa realmente quer, e é justamente o caminho que
não deixa rastro nenhum — quem baixa some, e a BGA nunca sabe quem era.

É essa a hipótese que o catálogo testa: transformar quem hoje baixa PDF em quem
pede cotação. Se em 28 dias pós-deploy o número de cotações enviadas passar de
**2**, a mudança se pagou em evidência.

> Nota técnica: `click_whatsapp_direct` e `click_wa_direct` são dois nomes para
> a mesma ação, herdados da landing antiga. No catálogo isso vira `click_whatsapp`
> com parâmetro `origen` — mais um motivo pra não somar cegamente os eventos
> antigos com os novos.

---

## 5. Como comparar depois do deploy

**Comparável direto** (mesma propriedade, mesmo domínio, mesma definição):

- usuários e sessões por mês
- sessões por origem/mídia
- dispositivo e cidade
- `generate_lead` (landing antiga) → `cotizacion_enviada` (catálogo): os dois
  significam "a pessoa pediu contato". É a comparação que interessa.

**Não comparável, e não force:**

- páginas/visualizações — a estrutura de URL muda inteira, o número sobe por
  construção
- taxa de rejeição — um catálogo navegável tem outro padrão de navegação
- `file_download` — o PDF pode deixar de existir; se sumir, a queda a zero é
  desenho, não perda

**Antes de olhar qualquer coisa pós-deploy:** confirmar que a anotação da data
do deploy está no GA4, e que o filtro de tráfego interno está **Ativo** (não
"Testando").

---

## 6. Janela completa — 1 de maio a 12 de setembro de 2026

O GA4 entrou em maio, então esta é **toda a vida medida do site**: 4,5 meses.
É o retrato mais firme que existe, e o que deve ser usado como base. A janela de
28 dias das seções anteriores fica como recorte recente.

| Métrica | Valor | Média mensal |
| --- | --- | --- |
| Usuários ativos | 359 (354 na home `/`) | ~79 |
| Novos usuários | 359 — **100%** | — |
| Sessões | 548 (443 na home) | ~120 |
| Visualizações da home | 562 | — |
| Taxa de rejeição da home | 46,1% | — |
| Tempo médio de engajamento | 1 min 00 s | — |
| Contagem de eventos | 3,3 mil | — |

**359 usuários, 359 novos.** Em quatro meses e meio, praticamente ninguém
voltou. Não é defeito do site: é comprador industrial resolvendo uma compra
pontual. Só muda a leitura de retenção — não espere fidelidade como métrica.

### Origem (sessões)

| Origem / mídia | Sessões |
| --- | --- |
| google / organic | 237 |
| (direct) / (none) | 220 |
| bing / organic | 31 |
| l.wl.co / referral (WhatsApp) | 24 |
| facebook.com / referral | 11 |
| chatgpt.com / ai-assistant | 6 |
| google / cpc | 3 |

### Cidades

Asunción 102 · São Paulo 37 · Ciudad del Este 32 · Ashburn 14 · Warsaw 7 ·
Buenos Aires 6 · Encarnación 6

Asunción + Ciudad del Este + Encarnación = 140 usuários paraguaios reais.
Ashburn e Warsaw são datacenter (robô), São Paulo é trabalho da Faro.

---

## 7. Leads — duas fontes independentes, e elas batem

| Fonte | Leads | Período |
| --- | --- | --- |
| GA4 (relatório Aquisição de leads) | **13** novos leads, 14 eventos principais | 1 mai – 12 set |
| Planilha da BGA (aba de contato) | **12** | (confirmado pela Yuki) |

Diferença de 1 em 13 — dentro do esperado entre um evento de navegador
(bloqueador, aba fechada antes de gravar) e a linha gravada na planilha. **A
medição não está mentindo**, e isso é o que dá confiança pra usar os outros
números.

**≈ 3 leads por mês. Taxa de conversão: 2,18% dos usuários.**

### De onde vêm os leads

| Canal do primeiro contato | Leads |
| --- | --- |
| Organic Search | 8 (62%) |
| Direct | 4 (31%) |
| AI Assistant (ChatGPT) | 1 (8%) |

O lead vindo do ChatGPT é **um** — anedota, não tendência. Mas registra que
esse caminho existe: alguém perguntou pra uma IA onde comprar bandeja no
Paraguai, chegou no site e pediu contato. Vale reolhar daqui a seis meses.

---

## 8. Páginas de destino — o risco de SEO é menor do que parecia

| Página de destino | Sessões |
| --- | --- |
| `/` | 443 (80,8%) |
| `(not set)` | 86 (15,7%) |
| `/catalogo/bandejas` | 4 |
| `/productos` | 4 |
| `/quien-somos` · `/contacto` · `/BGA_Landing_Page` · outras | 1 a 2 cada |

**Oito em cada dez visitas entram pela home, e a home continua sendo `/`.**
O patrimônio de SEO do site está concentrado justamente na URL que não muda.

Correção do que eu tinha suposto antes de olhar: a lista de redirects 301 é
curta e de baixo risco — `/productos`, `/quien-somos`, `/contacto`,
`/BGA_Landing_Page` e a política de privacidade. Nenhuma delas passa de 4
sessões em 4,5 meses. Continua valendo mapear, mas não é o item crítico do
deploy.

---

## 9. O que ainda não existe e devia

**Search Console: não há propriedade.** Verificado em 13/09/2026 — nem vinculado
ao GA4, nem criado. Isso significa que **não existe nenhum histórico de quais
termos trazem as 237 sessões de busca orgânica**, e pelo que sei o Search Console
não preenche dado retroativo: começa a coletar no dia em que a propriedade é
verificada. Cada dia sem isso é dado que não volta.

É a peça que falta com mais valor, por dois motivos: é a única fonte dos termos
de busca reais, e esses termos são a matéria-prima das palavras-chave da campanha
de Google Ads — de graça, vindas do próprio público.
