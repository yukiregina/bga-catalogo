'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [mounted, setMounted] = useState(false)

  // Carrega do localStorage após montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bga-cart')
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setMounted(true)
  }, [])

  // Salva no localStorage a cada mudança
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('bga-cart', JSON.stringify(items))
    }
  }, [items, mounted])

  function addItem(product) {
    setItems(prev => {
      const exists = prev.find(i => i.product.id === product.id)
      if (exists) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product, quantity: 1, observation: '' }]
    })
  }

  function removeItem(productId) {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }

  function updateQuantity(productId, qty) {
    if (qty < 1) return
    setItems(prev =>
      prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
    )
  }

  function updateObservation(productId, obs) {
    setItems(prev =>
      prev.map(i => i.product.id === productId ? { ...i, observation: obs } : i)
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
