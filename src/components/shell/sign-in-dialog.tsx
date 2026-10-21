import { useState } from 'react'

import { Dialog } from '#/components/ui/dialog'

import { SignInForm } from '../auth/sign-in-form'

/** "Најави се" in the header: the magic-link form in a small dialog. */
export function SignInDialog({ googleEnabled }: { googleEnabled: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      size="tiny"
      title="Најава"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className="cursor-pointer px-1.5 py-2 text-black/[0.87] hover:underline"
        >
          Најави се
        </button>
      }
    >
      <SignInForm googleEnabled={googleEnabled} />
    </Dialog>
  )
}
