// Tira compacta de produtos relacionados na ficha (campo `recommended` do
// Sheet). Bloco definido pelo cliente — complementos de instalação e outros
// itens que ele queira sugerir; a ordem vem do campo `recommended` e carrega
// significado (o que precisa vs. o que também pode servir). Recebe produtos
// já resolvidos (códigos inexistentes foram filtrados antes); lista vazia
// não renderiza nada.
import Link from 'next/link'
import { getProductImageAlt } from '@/lib/products'

export default function RecommendedProducts({ products, configQuery }) {
  if (!products?.length) return null

  return (
    <div className="mt-3 space-y-1.5">
      <div className="text-[11px] text-text-muted">Productos Relacionados</div>
      {products.map(product => (
        <Link
          key={product.id}
          href={`/catalogo/${product.categoryId}/${product.id}/${configQuery ? `?${configQuery}` : ''}`}
          className="flex items-center gap-2 rounded-lg border border-border-subtle px-2 py-1.5 transition hover:border-brand-accent hover:shadow-sm focus-visible:border-brand-accent focus-visible:shadow-sm"
        >
          {product.images?.primary ? (
            <img
              src={product.images.primary}
              alt={getProductImageAlt(product)}
              width={36}
              height={36}
              loading="lazy"
              className="w-9 h-9 object-contain rounded bg-surface-elevated shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded bg-surface-elevated flex items-center justify-center shrink-0">
              <span className="text-[8px] text-text-muted">s/i</span>
            </div>
          )}
          <span className="text-xs font-medium text-brand-primary flex-1 truncate">
            {product.name}
          </span>
          <span className="text-text-muted text-xs shrink-0">→</span>
        </Link>
      ))}
    </div>
  )
}
