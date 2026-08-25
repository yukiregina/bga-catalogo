'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import config from '@/client.config.js'
import { getCategories } from '@/lib/products'
import CartBadge from './CartBadge'
import styles from '@/app/landing.module.css'

// Casca única do site: mesma logo, mesma posição, mesmo carrinho em toda rota.
// Só a camada contextual muda — âncoras da home vs. famílias do catálogo.
const HOME_LINKS = [
  { href: '#productos', label: 'Productos' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '#sectores', label: 'Sectores' },
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#contacto', label: 'Contacto' },
]

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const activeCategoria = pathname.match(/^\/catalogo\/([^/]+)/)?.[1] ?? null

  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!isHome) return
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  function closeNav() {
    setNavOpen(false)
  }

  const categories = getCategories()

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
      <div className={styles.container}>
        <nav className={styles.nav} aria-label="Navegación principal">
          <button
            className={styles.navToggle}
            aria-label="Abrir menú"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(o => !o)}
          >
            <svg viewBox="0 0 256 256" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/></svg>
          </button>

          <Link href="/" className={styles.logo} aria-label={`${config.brand.name} – inicio`}>
            <img
              src="/logo-bga-bandejas-portacables-paraguay.png"
              alt={`${config.brand.name} – Bandejas portacables y tableros eléctricos, Paraguay`}
              height="48"
            />
          </Link>

          <div className={`${styles.navLinks} ${navOpen ? styles.navLinksOpen : ''}`}>
            {isHome
              ? HOME_LINKS.map(link =>
                  link.href.startsWith('#') ? (
                    <a key={link.href} href={link.href} onClick={closeNav}>{link.label}</a>
                  ) : (
                    <Link key={link.href} href={link.href} onClick={closeNav}>{link.label}</Link>
                  )
                )
              : categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/catalogo/${cat.id}`}
                    onClick={closeNav}
                    className={cat.id === activeCategoria ? styles.navLinkActive : undefined}
                  >
                    {cat.name.split(' ')[0]}
                  </Link>
                ))}
          </div>

          <div className={styles.headerActions}>
            <CartBadge label={config.catalog.ctaText} />
          </div>
        </nav>
      </div>
    </header>
  )
}
