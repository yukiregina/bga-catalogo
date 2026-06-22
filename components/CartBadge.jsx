'use client'

import Link from 'next/link'
import { useCart } from './CartProvider'

export default function CartBadge({ label }) {
  const { items } = useCart()
  const count = items.length // nº de produtos distintos

  return (
    <Link
      href="/cotacao"
      className="bg-brand-accent text-brand-primary text-xs font-semibold px-3 py-1.5 rounded-full hover:brightness-105 transition"
    >
      {count > 0 ? `${label} · ${count}` : label}
    </Link>
  )
}
