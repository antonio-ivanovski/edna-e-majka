import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

/** The coloured chips: contact details, category chips, status marks. */
const labelStyles = cva(
  'inline-flex items-center gap-[0.75em] rounded-[0.2857rem] px-[0.833em] py-[0.5833em] text-[0.8571rem] leading-none font-bold',
  {
    variants: {
      color: {
        grey: 'bg-[#e8e8e8] text-black/60',
        green: 'bg-success text-white',
        blue: 'bg-facebook text-white',
        purple: 'bg-instagram text-white',
        red: 'bg-danger text-white',
        accent: 'bg-accent text-black/70',
        white: 'border border-line bg-white text-black/70',
      },
      size: {
        small: 'text-[0.7857rem]',
      },
    },
    defaultVariants: { color: 'grey' },
  },
)

type LabelProps = {
  className?: string
  color?: VariantProps<typeof labelStyles>['color']
  size?: VariantProps<typeof labelStyles>['size']
  /** Placed before the text, inside the chip. */
  icon?: ReactNode
  /** Right-aligned secondary text, as on the contact labels. */
  detail?: ReactNode
  /**
   * Renders an anchor around the whole chip, icon and detail included, and
   * opens external addresses in a new tab. For a router link use `asChild`
   * instead, which places everything on that single child element.
   */
  href?: string
  asChild?: boolean
  title?: string
  children?: ReactNode
}

export function Label({
  className,
  color,
  size,
  icon,
  detail,
  href,
  asChild,
  children,
  ...rest
}: LabelProps) {
  const styles = cn(labelStyles({ color, size }), className)
  const content = (
    <>
      {icon}
      {children}
      {detail ? <span className="ml-4 font-bold opacity-80">{detail}</span> : null}
    </>
  )

  if (asChild) {
    return (
      <Slot.Root className={styles} {...rest}>
        {children}
      </Slot.Root>
    )
  }

  if (href) {
    const external = /^https?:/i.test(href)

    return (
      <a
        href={href}
        className={styles}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        {...rest}
      >
        {content}
      </a>
    )
  }

  return (
    <span className={styles} {...rest}>
      {content}
    </span>
  )
}
