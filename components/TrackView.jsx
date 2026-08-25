'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

/**
 * Dispara um evento de visualização a partir de uma página server-side.
 * Renderiza nada. Uso:
 *   <TrackView event="ver_familia" params={{ familia: 'bandejas' }} />
 */
export default function TrackView({ event, params }) {
  const key = JSON.stringify(params ?? {})

  useEffect(() => {
    track(event, params ?? {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key])

  return null
}
