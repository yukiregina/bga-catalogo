import Script from 'next/script'
import config from '@/client.config.js'

/**
 * Injeta o Google Tag Manager. O GA4 (e qualquer tag futura — Ads, Meta) passa
 * a ser configurado DENTRO do container, não mais aqui no código. Três
 * guardas, nenhuma dispensável:
 *
 * 1. Sem gtmContainerId no client.config.js — um catálogo de outro cliente
 *    sobe sem medição até alguém configurar.
 * 2. NODE_ENV !== 'production' — protege o build local (`next dev`).
 * 3. Hostname fora da lista abaixo — NODE_ENV sozinho não basta: com export
 *    estático o HTML é o mesmo em qualquer lugar que o hospede, e o build de
 *    staging do Amplify também roda com NODE_ENV=production. É o hostname,
 *    checado em runtime no navegador (é o único momento em que ele existe),
 *    que distingue o domínio publicado do preview do Amplify. Se o domínio do
 *    cliente mudar, atualizar a lista abaixo — senão a medição some em
 *    silêncio.
 *
 * Escape do item 3: se a URL trouxer `gtm_debug` (é o que o Preview do GTM
 * anexa), o container carrega mesmo fora do domínio publicado — senão não dá
 * pra testar a configuração antes dela estar no ar.
 */
export default function Analytics() {
  const id = config.data.gtmContainerId
  if (process.env.NODE_ENV !== 'production') return null
  if (!id) return null

  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(){
  var ok = ['bga.com.py','www.bga.com.py'];
  var debug = location.search.indexOf('gtm_debug') !== -1;
  if (ok.indexOf(location.hostname) === -1 && !debug) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
  var f = document.getElementsByTagName('script')[0];
  var j = document.createElement('script');
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=${id}';
  f.parentNode.insertBefore(j, f);
})();`}
    </Script>
  )
}
