import Script from 'next/script'
import config from '@/client.config.js'

/**
 * Injeta o GA4. Três guardas, nenhuma dispensável:
 *
 * 1. Sem gaMeasurementId no client.config.js — um catálogo de outro cliente
 *    sobe sem medição até alguém configurar.
 * 2. NODE_ENV !== 'production' — protege o build local (`next dev`).
 * 3. Hostname fora da lista abaixo — NODE_ENV sozinho não basta: com export
 *    estático o HTML é o mesmo em qualquer lugar que o hospede, e o build de
 *    staging do Amplify também roda com NODE_ENV=production. É o hostname,
 *    checado em runtime no navegador (é o único momento em que ele existe),
 *    que distingue o domínio publicado do preview do Amplify. Se o domínio do
 *    cliente mudar, atualizar a lista abaixo — senão a medição some em
 *    silêncio.
 */
export default function Analytics() {
  const id = config.data.gaMeasurementId
  if (process.env.NODE_ENV !== 'production') return null
  if (!id) return null

  return (
    <Script id="ga4-init" strategy="afterInteractive">
      {`(function(){
  var ok = ['bga.com.py','www.bga.com.py'];
  if (ok.indexOf(location.hostname) === -1) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=${id}';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', '${id}');
})();`}
    </Script>
  )
}
