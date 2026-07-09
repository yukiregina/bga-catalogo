'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCategories, getProductsByCategory, getCategoryDisplayMode } from '@/lib/products'
import styles from '@/app/landing.module.css'

// TODO: once product entries carry a normalized `material` / `thickness` /
// `surfaceTreatment` field, add a second guided select here (categoría → especificación)
// that deep-links into /catalogo/[categoria]?spec=... — the catalog pages don't
// parse spec query params yet, so a filter select was left out rather than shipping
// a dropdown that silently does nothing.

export default function ProductFinder() {
  const router = useRouter()
  const categories = getCategories()
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  function handleSearchSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo')
  }

  function handleCategorySelect(e) {
    const categoryId = e.target.value
    setSelectedCategory(categoryId)
    if (categoryId) router.push(`/catalogo/${categoryId}`)
  }

  return (
    <div>
      <form className={styles.finderSearch} onSubmit={handleSearchSubmit} role="search">
        <input
          type="text"
          className={styles.finderInput}
          placeholder="Buscar producto, ej. bandeja perforada 200mm"
          aria-label="Buscar producto"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className={styles.finderSearchBtn}>
          Buscar en el catálogo
        </button>
      </form>

      <div className={styles.productsGrid}>
        {categories.map(cat => {
          const isCatalog    = getCategoryDisplayMode(cat) === 'catalog'
          const productCount = isCatalog ? getProductsByCategory(cat.id).length : 0
          return (
            <Link key={cat.id} href={`/catalogo/${cat.id}`} className={styles.productCard}>
              <div className={styles.productImage}>
                {cat.image ? (
                  <>
                    <span className={styles.productImgOverlay}>{cat.name}</span>
                    <img src={cat.image} alt={cat.name} loading="lazy" />
                  </>
                ) : (
                  <div className={styles.productImagePlaceholder}>
                    <span className={styles.productImgOverlay} style={{ position: 'static', background: 'transparent' }}>{cat.name}</span>
                  </div>
                )}
              </div>
              <div className={styles.productCardBody}>
                <p>{cat.cardDescription ?? cat.description}</p>
                <span className={styles.productLink}>
                  {productCount > 0 ? `${productCount} producto${productCount !== 1 ? 's' : ''}` : 'Ver familia'} →
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className={styles.finderGuided}>
        <span className={styles.finderGuidedLabel}>¿No sabés por dónde empezar?</span>
        <div className={styles.finderSelectWrapper}>
          <select
            className={styles.finderSelect}
            value={selectedCategory}
            onChange={handleCategorySelect}
            aria-label="Elegir familia de producto"
          >
            <option value="">Elegí una familia…</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <span className={styles.selectIcon} aria-hidden="true">
            <svg viewBox="0 0 256 256" width="16" height="16" fill="currentColor"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>
          </span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 8 }}>
        ¿Preferís mirar todo junto?{' '}
        <Link href="/catalogo" className={styles.finderSecondaryLink} style={{ borderBottom: 'none', fontWeight: 600, color: 'var(--ocean)' }}>
          Ver catálogo completo →
        </Link>
      </p>
    </div>
  )
}
