import { cn } from '#/lib/utils'

/**
 * A round producer or user picture. Every store image falls back to the
 * placeholder the site has always shipped.
 */
export function Avatar({
  src,
  alt,
  size = 28,
  className,
}: {
  src: string | null | undefined
  alt: string
  size?: number
  className?: string
}) {
  return (
    <img
      src={src ?? '/assets/avatar-placeholder.jpg'}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn(
        'inline-block shrink-0 rounded-full bg-hover object-cover align-middle',
        className,
      )}
    />
  )
}
