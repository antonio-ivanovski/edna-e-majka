import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

import { cn } from '#/lib/utils'

/** The coloured chips: contact details, category chips, status marks. */
const labelStyles = cva(
  'inline-flex items-center gap-[0.75em] rounded-card px-[0.833em] py-[0.5833em] text-[0.8571rem] leading-none font-bold',
  {
    variants: {
      color: {
        grey: 'bg-surface-sunken text-ink-muted',
        green: 'bg-success text-white',
        blue: 'bg-facebook text-white',
        purple: 'bg-instagram text-white',
        red: 'bg-danger text-white',
        accent: 'bg-accent text-on-brand',
        white: 'border border-border bg-surface-raised text-ink',
      },
      size: {
        small: 'text-[0.7857rem]',
      },
      /** A chip that can be pressed or followed. */
      interactive: {
        true: 'transition-colors hover:brightness-95',
      },
    },
    defaultVariants: { color: 'grey' },
  },
)

type LabelProps = {
  className?: string
  color?: VariantProps<typeof labelStyles>['color']
  size?: VariantProps<typeof labelStyles>['size']
  interactive?: boolean
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
  interactive,
  icon,
  detail,
  href,
  asChild,
  children,
  ...rest
}: LabelProps) {
  const styles = cn(labelStyles({ color, size, interactive }), className)
  const content = (
    <>
      {icon}
      {children}
      {detail ? <span className="ml-4 font-bold opacity-80">{detail}</span> : null}
    </>
  )

  if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
    // A slot takes exactly one child, so the icon and the detail are
    // composed into the link itself rather than wrapped around it.
    const childElement = children as ReactElement<{ children?: ReactNode }>

    return (
      <Slot.Root className={styles} {...rest}>
        {cloneElement(childElement, {
          children: (
            <>
              {icon}
              {childElement.props.children}
              {detail ? <span className="ml-4 font-bold opacity-80">{detail}</span> : null}
            </>
          ),
        })}
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
