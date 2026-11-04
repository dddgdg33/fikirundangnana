/**
 * Shared building blocks untuk invitation engine.
 */

/* Image with lazy loading */
export function LazyImg({
  src,
  alt = '',
  className,
  eager = false,
  onLoad,
  style,
}: {
  src?: string
  alt?: string
  className?: string
  eager?: boolean
  onLoad?: () => void
  style?: React.CSSProperties
}) {
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={eager ? 'eager' : 'lazy'}
      decoding='async'
      onLoad={onLoad}
    />
  )
}

/* Copy-to-clipboard button helpers */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/* Copy rekening text used by gift sections */
export function formatAccountNumber(n?: string | null): string {
  if (!n) return ''
  return n.replace(/(\d{3,4})(?=\d)/g, '$1 ').trim()
}
