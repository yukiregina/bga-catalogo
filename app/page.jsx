// Página inicial — Landing Page.
// The interactive markup lives in components/LandingPage.jsx (client component);
// this file stays a server component so it can export page metadata and render
// the JSON-LD block server-side (needs to be in the static HTML, not injected
// after hydration).
import LandingPage from '@/components/LandingPage'

const TITLE = 'BGA · Bandejas Portacables y Tableros Eléctricos · Paraguay'
const DESCRIPTION = 'BGA fabrica bandejas portacables, escaleras y tableros eléctricos en Paraguay con norma NBR IEC 61537. Cotizá por WhatsApp para proyectos industriales en el Mercosur.'

// Ported verbatim from reference-lp:/index.html <head> — see CLAUDE.md § 5.1
// for why that file is the byte-identical source of truth for the page live
// at bga.com.py today.
export const metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'BGA Paraguay',
    locale: 'es_PY',
    title: TITLE,
    description: 'Fabricamos bandejas portacables, escaleras portacables y tableros eléctricos en Paraguay. Norma NBR IEC 61537. Atendemos obras industriales en el Mercosur.',
    images: ['/images/bga-social-preview.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: 'Fabricamos bandejas portacables, escaleras y tableros eléctricos en Paraguay con norma internacional.',
    images: ['/images/bga-social-preview.webp'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://bga.com.py/#organization',
      name: 'BGA',
      url: 'https://bga.com.py',
      logo: 'https://bga.com.py/logo-bga-bandejas-portacables-paraguay.png',
      description: 'Fabricante paraguayo de bandejas portacables, escaleras portacables y tableros eléctricos con norma NBR IEC 61537.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Ruta PY02 km14',
        addressLocality: 'Minga Guazú',
        addressRegion: 'Alto Paraná',
        addressCountry: 'PY',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+595-974-733100',
        contactType: 'sales',
        availableLanguage: ['Spanish', 'Portuguese'],
      },
      sameAs: ['https://www.instagram.com/bgapy/'],
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://bga.com.py/#localbusiness',
      name: 'BGA – Bandejas Portacables Paraguay',
      image: 'https://bga.com.py/images/bga-fabrica-paraguay-bandejas-portacables-tableros-desktop.webp',
      url: 'https://bga.com.py',
      telephone: '+595974733100',
      email: 'ventas@bga.com.py',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Ruta PY02 km14',
        addressLocality: 'Minga Guazú',
        addressRegion: 'Alto Paraná',
        addressCountry: 'PY',
      },
      areaServed: ['PY', 'BR', 'AR', 'UY'],
      priceRange: '$$',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cuál es el plazo de entrega?',
          acceptedAnswer: { '@type': 'Answer', text: 'Para productos de stock, 3 a 7 días en Paraguay. Para fabricación a medida o pedidos grandes, definimos plazo en la cotización según volumen.' },
        },
        {
          '@type': 'Question',
          name: '¿Atienden obras grandes y construcciones?',
          acceptedAnswer: { '@type': 'Answer', text: 'Sí. Trabajamos con constructoras y proyectos industriales en Paraguay y el Mercosur. Atendemos personalmente los pedidos de obra.' },
        },
        {
          '@type': 'Question',
          name: '¿Tienen factura legal y RUC?',
          acceptedAnswer: { '@type': 'Answer', text: 'Sí. Emitimos factura legal paraguaya. Para clientes del Mercosur, ajustamos documentación según el destino de la mercadería.' },
        },
        {
          '@type': 'Question',
          name: '¿Cuál es el pedido mínimo?',
          acceptedAnswer: { '@type': 'Answer', text: 'No hay mínimo rígido. Atendemos desde una bandeja para reposición hasta pedidos completos para obra. La cotización se ajusta al volumen.' },
        },
      ],
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  )
}
