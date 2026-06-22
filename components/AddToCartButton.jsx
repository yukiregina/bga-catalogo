'use client'

import { useCart } from './CartProvider'

export default function AddToCartButton({ product }) {
  const { addItem, items } = useCart()
  const inCart = items.some(i => i.product.id === product.id)

  return (
    <button
      onClick={() => addItem(product)}
      className={`w-full text-[11px] font-semibold rounded-md py-1.5 mt-2 transition ${
        inCart
          ? 'bg-brand-primary text-white hover:brightness-110'
          : 'bg-brand-accent text-brand-primary hover:brightness-105'
      }`}
    >
      {inCart ? '✓ Agregado' : '+ Cotización'}
    </button>
  )
}
