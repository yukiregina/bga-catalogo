// Este arquivo carrega os dados dos produtos.
// Agora usa o JSON local (placeholder).
// Quando o Google Sheets estiver pronto, a lógica de busca vai entrar aqui —
// o resto do projeto não precisa mudar.

import data from './catalog.json'

export function getCategories() {
  return data.categories
}

export function getProductsByCategory(categoryId) {
  return data.products.filter(p => p.categoryId === categoryId)
}

export function getAllProducts() {
  return data.products
}

export function getBrand() {
  return data.brand
}

export function getProductById(productId) {
  return data.products.find(p => p.id === productId) ?? null
}

export function getCategoryById(categoryId) {
  return data.categories.find(c => c.id === categoryId) ?? null
}
