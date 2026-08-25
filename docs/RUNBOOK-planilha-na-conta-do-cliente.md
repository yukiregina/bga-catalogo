# Runbook — planilha e script na conta do cliente

> Passo operacional da receita-mestre Faro: a captura de leads nunca mora na
> conta da Faro. Vale para BGA e para todo catálogo seguinte.
> Escrito em 2026-08-24, durante a migração da planilha da BGA.

---

## Por que este passo existe

Regra do `faro-estrategia-producao-sites`: quatro coisas são do cliente sempre —
domínio, hospedagem, **conta Google do Sheets e do GA4**, e os arquivos-fonte.

Planilha de lead na conta da Faro tem três problemas: os dados do cliente ficam
com o fornecedor, a Faro vira dependência permanente, e no dia em que a conta
pessoal sumir o formulário para de gravar sem ninguém perceber — porque com
`mode: 'no-cors'` o navegador nunca vê o erro.

---

## Parte 1 — Criar na conta do cliente

**Logue no navegador com a conta do cliente antes de começar.** Quem clica em
"Implantar" é o dono do script. Se fizer logada na conta da Faro, o problema
continua com um passo a mais.

1. Drive do cliente → **Nova planilha**. Nome sugerido: `BGA — Leads y Cotizaciones`
2. Na planilha: **Extensões → Apps Script**
3. Apagar o `Code.gs` de exemplo e colar o conteúdo de
   `docs/bga-leads-apps-script.gs` inteiro
4. Salvar (ícone de disquete)

### Definir o segredo

5. **Configurações do projeto** (engrenagem) → **Propriedades do script** →
   **Adicionar propriedade**
   - Propriedade: `LEAD_FORM_SECRET`
   - Valor: uma string longa aleatória (no terminal: `openssl rand -hex 24`)

> Isto não é segredo de verdade — ele fica visível no bundle do site para
> qualquer visitante. É trava contra robô que varre a web procurando URL de
> Apps Script aberta. Serve pra planilha não encher de lixo.

### Implantar

> **"Implantar" abre um menu com duas opções que parecem a mesma coisa:**
> **Nova implantação** cria uma URL nova — use só agora, nesta primeira vez.
> **Gerenciar implantações → ✏️ → Nova versão** mantém a mesma URL e publica o
> código novo — é o que você usa de todas as próximas vezes. Ver Parte 5.

6. **Implantar → Nova implantação**
7. Tipo (engrenagem ao lado de "Selecionar tipo"): **App da Web**
8. Duas escolhas que decidem se funciona:
   - **Executar como:** `Eu` (a conta do cliente)
   - **Quem pode acessar:** `Qualquer pessoa` ← **obrigatório**
9. **Implantar** → autorizar (vai aparecer aviso de app não verificado:
   *Avançado → Acessar o projeto*)
10. Copiar a **URL do app da Web** (termina em `/exec`)

> ⚠️ **"Quem pode acessar: Qualquer pessoa" é o erro nº 1 deste setup.** Se
> ficar em "Somente eu", o Apps Script responde com um redirecionamento pra
> tela de login. Como o site envia com `no-cors`, o navegador engole o erro e
> tudo *parece* funcionar — só que nenhuma linha aparece na planilha.

---

## Parte 2 — O que você traz de volta

| Valor | Onde estava |
| --- | --- |
| URL do app da Web | passo 10 |
| `LEAD_FORM_SECRET` | passo 5 |

---

## Parte 2b — Por onde começar a repontar

Um script, duas portas: `doGet` recebe o formulário da landing page, `doPost`
recebe o carrinho do catálogo. Os dois sites podem apontar para a mesma
implantação — e não precisam ser migrados juntos.

**Reponte a landing page primeiro, antes do catálogo.** Ela é a única das duas
que já tem tráfego real, e o formulário é curto: se algo estiver errado, você
descobre no fluxo fácil. Validar primeiro no catálogo seria testar um caminho
que ninguém percorre ainda.

E o motivo que não é técnico: enquanto a LP não for repontada, os leads do
cliente continuam caindo no Drive pessoal da Faro todo dia. Amarrar essa
migração ao lançamento do site novo — que ainda depende de export estático,
imagens e conteúdo — deixa o problema de propriedade esperando semanas sem
precisar.

Ordem:

1. Criar planilha + script + implantação na conta do cliente (Parte 1)
2. Trocar `SHEET_URL` e `SHEET_SECRET` no repo da LP, commitar, deixar publicar
3. Mandar um formulário de teste no site de verdade e conferir a linha na
   planilha nova
4. Só então colocar os mesmos valores no `client.config.js` do catálogo

⚠️ **Não apagar o script antigo** até a LP estar repontada e testada. Se derrubar
antes, o formulário para de gravar e ninguém vê — o `no-cors` engole o erro.

## Parte 3 — Onde colar (três arquivos, não dois)

A URL antiga (`AKfycbz22gwG4S…`) está cravada em três lugares:

1. **`bga-catalogo/client.config.js`** — `data.leadWebhookUrl` e
   `data.leadWebhookSecret`. É o catálogo.
2. **`bga-catalogo/reference-lp:/index.html`** — cópia de referência da LP
   dentro do projeto. Provavelmente não está publicada; conferir antes de
   ignorar.
3. **`Faro comercial/clientes/BGA/05-landing-page/lp-site-antiga-vercel/index.html`**
   — constantes `SHEET_URL` e `SHEET_SECRET`, por volta da linha 981.

⚠️ **Confirmar qual LP está no ar antes de editar.** A pasta se chama
`lp-site-antiga-vercel` e o `.vercel/project.json` aponta pro projeto `bga-lp`,
mas as notas do projeto dizem que a BGA usa Amplify. Editar a cópia errada
significa achar que corrigiu e não ter corrigido — e o formulário da home segue
gravando na conta pessoal.

---

## Parte 4 — Testar (não pule)

Como o `no-cors` esconde erro, o único teste válido é olhar a planilha.

1. Abrir o catálogo, montar um carrinho com 2 itens
2. Preencher nome e RUC com algo reconhecível (`TESTE FARO`)
3. Clicar em enviar
4. Abrir a planilha do cliente → aba **`Cotizaciones`** deve ter a linha nova,
   com a coluna **Estado** já em `nuevo`
5. Repetir pelo formulário da home → a linha cai na **primeira aba**
6. Apagar as linhas de teste

Se a linha não aparecer, verificar nesta ordem: implantação está como
"Qualquer pessoa"? foi criada **nova versão** depois da última edição do
código? o `LEAD_FORM_SECRET` bate com o `leadWebhookSecret` do site?

---

## Parte 5 — Depois de trocar o código do script

Editar o `Code.gs` **não** atualiza o app publicado. Toda vez:

**Implantar → Gerenciar implantações → ✏️ (lápis) → Versão: Nova versão → Implantar**

A URL continua a mesma; o que muda é a versão servida. Este é o segundo erro
mais comum deste setup.

---

## Parte 6 — Linhas antigas

As linhas que já estão na planilha do Drive da Faro não migram sozinhas.
Se quiser preservar: copiar e colar na planilha nova antes de repontar o site.
Se não quiser, tudo bem — mas então apague a planilha antiga depois de confirmar
o teste, pra não sobrar duas fontes de verdade.

---

## Parte 7 — Ao sair do projeto

Conferir que a Faro não é dona de nada:

- [ ] Planilha: dono é o cliente, Faro no máximo como editora
- [ ] Apps Script: implantado pela conta do cliente
- [ ] GA4: propriedade na conta do cliente *(na BGA já está)*
- [ ] Hospedagem: conta do cliente
- [ ] Domínio: registrador do cliente
- [ ] Zip dos fontes entregue
