import Script from 'next/script'
import config from '@/client.config.js'

/**
 * Injeta o GA4. Não renderiza nada fora de produção (NODE_ENV !== 'production')
 * — senão localhost reporta pra propriedade de produção do cliente — nem sem
 * gaMeasurementId no client.config.js — um catálogo de outro cliente sobe sem
 * medição até alguém configurar.
 */
export default function Analytics() {
  const id = config.data.gaMeasurementId
  if (process.env.NODE_ENV !== 'production') return null
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
