import { FacebookIcon, InstagramIcon, MessengerIcon } from '#/components/icons'

import { ContactDialog } from './contact-dialog'
import { CooperationDialog } from './cooperation-dialog'

const socials = [
  { href: 'https://www.facebook.com/ednaemajka.mk', label: 'Facebook', Icon: FacebookIcon },
  { href: 'https://m.me/ednaemajka.mk', label: 'Facebook Messenger', Icon: MessengerIcon },
  { href: 'https://www.instagram.com/ednaemajka.mk/', label: 'Instagram', Icon: InstagramIcon },
]

/** The amber strip above every page: social links, cooperation, contact. */
export function AmberBar() {
  return (
    <div role="region" aria-label="Контакт и социјални мрежи" className="bg-brand text-on-brand">
      <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-x-4 px-2">
        <div className="flex items-center">
          {socials.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="inline-block px-[5px] py-2.5 transition-opacity hover:opacity-80"
            >
              <Icon className="size-6" />
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm">
          <CooperationDialog />
          <span aria-hidden="true" className="px-1 text-on-brand/70">
            |
          </span>
          <ContactDialog />
        </div>
      </div>
    </div>
  )
}
