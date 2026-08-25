'use client'

import Link from 'next/link'
import { useCart } from './CartProvider'

export default function CartBadge({ label }) {
  const { items } = useCart()
  const count = items.length // nº de produtos distintos
  const isEmpty = count === 0

  // Carrinho é estado, não CTA: vazio não chama atenção nem é clicável — mas
  // continua ocupando o mesmo espaço, pra não empurrar o resto do menu
  // toda vez que o carrinho enche/esvazia (visibility, não display/unmount).
  return (
    <Link
      href="/cotacao"
      aria-hidden={isEmpty}
      tabIndex={isEmpty ? -1 : undefined}
      className={`bg-brand-accent text-brand-primary text-xs font-semibold px-3 py-1.5 rounded-full hover:brightness-105 transition ${
        isEmpty ? 'invisible pointer-events-none' : ''
      }`}
    >
      {label} · <span className="inline-block w-4 text-center">{count}</span>
    </Link>
  )
}
