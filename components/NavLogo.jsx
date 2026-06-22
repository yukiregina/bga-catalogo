import Link from 'next/link'
import config from '@/client.config.js'

export default function NavLogo() {
  return (
    <Link href="/" className="flex items-center">
      {config.brand.logo ? (
        <img
          src={config.brand.logo}
          alt={config.brand.name}
          className="h-7 w-auto object-contain"
        />
      ) : (
        <span className="font-brand text-sm font-bold text-white tracking-wide">
          {config.brand.name}
        </span>
      )}
    </Link>
  )
}
