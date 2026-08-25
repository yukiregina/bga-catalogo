import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className="font-brand text-2xl font-bold text-brand-primary mb-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-text-muted mb-6">
          El contenido que buscás no existe o fue movido.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 bg-brand-accent text-brand-primary text-sm font-semibold px-6 py-3 rounded-lg hover:brightness-105 transition"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  )
}
