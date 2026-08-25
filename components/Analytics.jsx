import Script from 'next/script'
import config from '@/client.config.js'

/**
 * Injeta o GA4. Sem gaMeasurementId no client.config.js, não renderiza nada —
 * um catálogo de outro cliente sobe sem medição até alguém configurar.
 */
export default function Analytics() {
  const id = config.data.gaMeasurementId
  if (!id) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  )
}
