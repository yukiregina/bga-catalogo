'use client'

import Link from 'next/link'
import { useCart } from './CartProvider'

export default function CartBadge({ label }) {
  const { items } = useCart()
  const count = items.length // nº de produtos distintos
  const isEmpty = count === 0

  // Carrinho vazio é visível, mas discreto — amarelo em tinta leve, sem
  // número (a contagem é o que distingue vazio de cheio) — pra não competir
  // com o "Agregar a cotización" da ficha. Existe pra que o fluxo de
  // cotización seja descobrível por quem nunca abriu uma ficha.
  return (
    <Link
      href="/cotacao"
      aria-label={isEmpty ? 'Cotización, vacía' : `Cotización, ${count} producto${count !== 1 ? 's' : ''}`}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
        isEmpty
          ? 'bg-brand-accent/15 border border-brand-accent/40 text-brand-primary hover:bg-brand-accent/25 hover:border-brand-accent/70'
          : 'bg-brand-accent text-brand-primary hover:brightness-105'
      }`}
    >
      {isEmpty ? label : `${label} · ${count}`}
    </Link>
  )
}
