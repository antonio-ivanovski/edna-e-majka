import { Heart, Mail } from 'lucide-react'
import type { ReactNode } from 'react'

import { FacebookIcon, InstagramIcon, MessengerIcon } from '#/components/icons'
import { Dialog } from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'

const channels = [
  {
    label: 'Facebook',
    detail: 'facebook.com/ednaemajka.mk',
    href: 'https://www.facebook.com/ednaemajka.mk',
    color: 'blue' as const,
    Icon: FacebookIcon,
  },
  {
    label: 'Facebook Messenger',
    detail: 'm.me/ednaemajka.mk',
    href: 'https://m.me/ednaemajka.mk',
    color: 'blue' as const,
    Icon: MessengerIcon,
  },
  {
    label: 'Instagram',
    detail: '@ednaemajka.mk',
    href: 'https://www.instagram.com/ednaemajka.mk/',
    color: 'purple' as const,
    Icon: InstagramIcon,
  },
  {
    label: 'Меил',
    detail: 'info@ednaemajka.mk',
    href: 'mailto:info@ednaemajka.mk',
    color: 'red' as const,
    Icon: Mail,
  },
]

/** The informational contact dialog. The trigger defaults to the amber bar. */
export function ContactDialog({ trigger }: { trigger?: ReactNode }) {
  return (
    <Dialog
      size="tiny"
      title="Контактирајте нѐ"
      trigger={
        trigger ?? (
          <button type="button" className="cursor-pointer px-[5px] py-2.5 text-white">
            Контакт
          </button>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <img src="/logo.png" alt="Една е Мајка" className="mx-auto w-40" />
        <div>
          <p className="flex items-center justify-center gap-2 text-center text-lg font-bold text-ink">
            <Heart aria-hidden="true" className="size-5 text-danger" fill="currentColor" />
            Многу сакаме кога ни пишувате
          </p>
          <p className="mt-3 text-center text-ink-muted">
            Слободно можете да ни пишете на било која од социалните мрежи или на нашата меил адреса.
            Ветуваме, ќе вратиме во најкус можен рок.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          {channels.map(({ label, detail, href, color, Icon }) => (
            <Label
              key={label}
              color={color}
              icon={<Icon className="size-3.5" />}
              detail={detail}
              href={href}
              className="transition-opacity hover:opacity-90"
            >
              {label}
            </Label>
          ))}
        </div>
      </div>
    </Dialog>
  )
}
