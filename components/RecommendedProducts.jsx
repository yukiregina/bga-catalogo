// Fila horizontal de produtos recomendados na ficha (campo `recommended` do Sheet).
// Recebe produtos já resolvidos (códigos inexistentes foram filtrados antes);
// com lista vazia não renderiza nada.
import Link from 'next/link'
import AddToCartButton from './AddToCartButton'

export default function RecommendedProducts({ products }) {
  if (!products?.length) return null

  return (
    <section className="mt-6">
      <h2 className="font-brand text-base font-bold text-brand-primary mb-3">
        Productos recomendados
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map(product => (
          <div
            key={product.id}
            className="bg-white border border-black/8 rounded-card p-3 flex flex-col w-40 shrink-0"
          >
            <Link href={`/catalogo/${product.categoryId}/${product.id}`} className="block mb-2">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full aspect-square object-contain rounded bg-surface-elevated"
                />
              ) : (
                <div className="w-full aspect-square rounded bg-surface-elevated flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">sin imagen</span>
                </div>
              )}
            </Link>
            <div className="font-mono text-[10px] text-text-sku mb-0.5">{product.id}</div>
            <Link
              href={`/catalogo/${product.categoryId}/${product.id}`}
              className="text-xs font-semibold text-brand-primary leading-tight hover:underline decoration-brand-accent underline-offset-2 transition flex-1"
            >
              {product.name}
            </Link>
            <AddToCartButton product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
