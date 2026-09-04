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

  // Carrega do localStorage após montar.
  // O `Array.isArray` não é paranoia: este provider embrulha o site inteiro, e
  // um valor que desserialize pra qualquer coisa que não seja array derruba o
  // `items.reduce` daqui de baixo — tela branca em TODA página, sem saída a não
  // ser limpar os dados do site, que ninguém sabe fazer. Valor estranho: começa
  // com carrinho vazio, que é recuperável.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bga-cart-v2')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {}
    setMounted(true)
  }, [])

  // Salva no localStorage a cada mudança — storage bloqueado ou cota cheia
  // não pode derrubar o provider (embrulha o site inteiro); o carrinho segue
  // funcionando em memória durante a sessão, só não persiste.
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('bga-cart-v2', JSON.stringify(items))
      } catch {}
    }
  }, [items, mounted])

  // meta (opcional): { image, imageAlt, title, configLabel, config } — só a
  // ficha manda, porque só ela sabe qual variante/eixo/material foi
  // escolhido. Sem meta, os cinco campos ficam undefined e o comportamento é
  // o mesmo de antes (grade, recomendados, subfamília). `config` é a versão
  // crua ({ variante, axes, material, espesor }) que vira a query da URL
  // quando a linha é clicada de volta pra ficha.
  function makeLine(lineId, product, quantity, meta) {
    return {
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
    }
  }

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
      return [...prev, makeLine(lineId, product, quantity, meta)]
    })
  }

  // Volta da ficha pra corrigir uma linha (link "editar" da /cotacao) — troca
  // a linha de `oldLineId` pela configuração nova NA MESMA POSIÇÃO do array,
  // em vez de remove+add, que jogaria a linha pro fim e bagunçaria a ordem
  // que a pessoa montou. Se `oldLineId` já não existe mais (removida em
  // outra aba, por exemplo), cai no addItem normal.
  function replaceItem(oldLineId, product, quantity = 1, meta = {}) {
    const newLineId = getLineId(product)
    setItems(prev => {
      const idx = prev.findIndex(i => i.lineId === oldLineId)
      if (idx === -1) {
        const exists = prev.find(i => i.lineId === newLineId)
        if (exists) {
          return prev.map(i =>
            i.lineId === newLineId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        }
        return [...prev, makeLine(newLineId, product, quantity, meta)]
      }

      // A configuração nova já existe em outra linha (ex.: a pessoa editou
      // pra bater com algo que já estava no carrinho) — funde as quantidades
      // lá e remove o slot editado, senão duas linhas ficariam com o mesmo
      // lineId.
      const collisionIdx = prev.findIndex((i, j) => j !== idx && i.lineId === newLineId)
      if (collisionIdx !== -1) {
        return prev
          .map((i, j) => j === collisionIdx ? { ...i, quantity: i.quantity + quantity } : i)
          .filter((_, j) => j !== idx)
      }

      return prev.map((i, j) => j === idx ? makeLine(newLineId, product, quantity, meta) : i)
    })
  }

  function removeItem(lineId) {
    setItems(prev => prev.filter(i => i.lineId !== lineId))
  }

  // Normaliza em vez de rejeitar — número inválido ou < 1 vira 1, acima de
  // 9999 vira 9999. Vale pra quem chamar, inclusive input digitável.
  function updateQuantity(lineId, qty) {
    const num = Number(qty)
    const clamped = !num || num < 1 ? 1 : Math.min(num, 9999)
    setItems(prev =>
      prev.map(i => i.lineId === lineId ? { ...i, quantity: clamped } : i)
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
      replaceItem,
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
