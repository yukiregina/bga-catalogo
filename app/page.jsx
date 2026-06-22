// Página inicial — Landing Page
// Por enquanto só redireciona pro catálogo.
// Aqui vai entrar: hero, prova técnica, 6 famílias, setores, CLINCH, footer.

import Link from 'next/link'
import config from '@/client.config.js'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-brand text-4xl font-bold text-brand-primary">
        {config.brand.name}
      </h1>
      <p className="text-text-secondary text-center max-w-sm">
        {config.brand.tagline}
      </p>
      <Link
        href="/catalogo"
        className="bg-brand-accent text-brand-primary font-semibold px-6 py-3 rounded-lg hover:brightness-105 transition"
      >
        Ver catálogo →
      </Link>
    </main>
  )
}
