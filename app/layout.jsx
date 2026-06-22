import './globals.css'
import config from '@/client.config.js'
import { CartProvider } from '@/components/CartProvider'

export const metadata = {
  title:       config.meta.title,
  description: config.meta.description,
}

export default function RootLayout({ children }) {
  return (
    <html lang={config.meta.lang}>
      <body>
        <CartProvider>
          <div className="max-w-[1920px] mx-auto">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
