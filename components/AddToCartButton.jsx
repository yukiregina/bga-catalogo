'use client'

import { useCart } from './CartProvider'
import { track } from '@/lib/analytics'

export default function AddToCartButton({ product }) {
  const { addItem, items } = useCart()
  // Sem composedSKU (grade/recomendados/subfamília não escolhem variante),
  // o lineId é o id da página — mesmo comportamento de antes.
  const inCart = items.some(i => i.lineId === (product.composedSKU ?? product.id))

  function handleAdd() {
    addItem(product)
    if (!inCart) {
      track('agregar_cotizacion', {
        sku: product.id,
        producto: product.name,
        familia: product.categoryId || '',
        origen: 'grilla',
      })
    }
  }

  return (
    <button
      onClick={handleAdd}
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
