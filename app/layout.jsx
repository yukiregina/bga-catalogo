import './globals.css'
import config from '@/client.config.js'
import { CartProvider } from '@/components/CartProvider'
import Analytics from '@/components/Analytics'
import Header from '@/components/Header'

const SITE_URL = 'https://bga.com.py'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  config.meta.title,
    template: `%s · ${config.brand.name}`,
  },
  description: config.meta.description,
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    type:     'website',
    url:      '/',
    siteName: 'BGA Paraguay',
    locale:   'es_PY',
    title:    config.meta.title,
    description: config.meta.description,
    images:   ['/images/bga-social-preview.webp'],
  },
  icons: {
    icon:  '/images/favicon.png',
    apple: '/images/apple-touch.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang={config.meta.lang}>
      <head>
        <Analytics />
      </head>
      <body>
        <CartProvider>
          <div className="max-w-[1920px] mx-auto">
            <Header />
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
