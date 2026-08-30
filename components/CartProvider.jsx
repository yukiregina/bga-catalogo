'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

// A identidade da linha é o SKU composto (variante + eixos + material +
// espesor), não o id da página. Duas configurações diferentes do mesmo
// produto são duas linhas — sem isso a segunda escolha some do carrinho.
function getLineId(product) {
  return product.composedSKU ?? product.id
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [mounted, setMounted] = useState(false)

  // Carrega do localStorage após montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bga-cart-v2')
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setMounted(true)
  }, [])

  // Salva no localStorage a cada mudança
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('bga-cart-v2', JSON.stringify(items))
    }
  }, [items, mounted])

  // meta (opcional): { image, imageAlt, title, configLabel, config } — só a
  // ficha manda, porque só ela sabe qual variante/eixo/material foi
  // escolhido. Sem meta, os cinco campos ficam undefined e o comportamento é
  // o mesmo de antes (grade, recomendados, subfamília). `config` é a versão
  // crua ({ variante, axes, material, espesor }) que vira a query da URL
  // quando a linha é clicada de volta pra ficha.
  function addItem(product, quantity = 1, meta = {}) {
    const lineId = getLineId(product)
    setItems(prev => {
      const exists = prev.find(i => i.lineId === lineId)
      if (exists) {
        return prev.map(i =>
          i.lineId === lineId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, {
        lineId,
        product,
        composedSKU: product.composedSKU,
        quantity,
        observation: '',
        image: meta.image,
        imageAlt: meta.imageAlt,
        title: meta.title,
        configLabel: meta.configLabel,
        config: meta.config,
      }]
    })
  }

  function removeItem(lineId) {
    setItems(prev => prev.filter(i => i.lineId !== lineId))
  }

  function updateQuantity(lineId, qty) {
    if (qty < 1) return
    setItems(prev =>
      prev.map(i => i.lineId === lineId ? { ...i, quantity: qty } : i)
    )
  }

  function updateObservation(lineId, obs) {
    setItems(prev =>
      prev.map(i => i.lineId === lineId ? { ...i, observation: obs } : i)
    )
  }

  function clearCart() {
    setItems([])
  }

  return (
    <CartContext.Provider value={{
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      addItem,
      removeItem,
      updateQuantity,
      updateObservation,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
