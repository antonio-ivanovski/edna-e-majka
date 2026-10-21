import { Mail, Phone } from 'lucide-react'

import { FacebookIcon, InstagramIcon } from '#/components/icons'
import { Label } from '#/components/ui/label'
import { externalUrl, phoneHref } from '#/lib/urls'
import { cn } from '#/lib/utils'

export type ProducerContactDetails = {
  phone?: string | null
  email?: string | null
  facebook?: string | null
  instagram?: string | null
}

/**
 * How to reach a producer, in the order the site has always used: phone,
 * Facebook, Instagram, mail.
 */
export function ProducerContacts({
  contacts,
  className,
}: {
  contacts: ProducerContactDetails
  className?: string
}) {
  const facebook = externalUrl(contacts.facebook)
  const instagram = externalUrl(contacts.instagram)

  return (
    <div
      className={cn(
        'flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center',
        className,
      )}
    >
      {contacts.phone ? (
        <Label color="green" icon={<Phone className="size-3.5" />} href={phoneHref(contacts.phone)}>
          {contacts.phone}
        </Label>
      ) : null}
      {facebook ? (
        <Label color="blue" icon={<FacebookIcon className="size-3.5" />} href={facebook}>
          Facebook
        </Label>
      ) : null}
      {instagram ? (
        <Label color="purple" icon={<InstagramIcon className="size-3.5" />} href={instagram}>
          Instagram
        </Label>
      ) : null}
      {contacts.email ? (
        <Label color="red" icon={<Mail className="size-3.5" />} href={`mailto:${contacts.email}`}>
          {contacts.email}
        </Label>
      ) : null}
    </div>
  )
}
