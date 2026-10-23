import { lazy, Suspense, useState } from 'react'

import { Dialog } from '#/components/ui/dialog'
import { FormSkeleton } from '#/components/ui/skeleton'

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
        <button type="button" className="cursor-pointer px-1.5 py-2 text-ink hover:underline">
          Најави се
        </button>
      }
    >
      {open ? (
        <Suspense fallback={<FormSkeleton rows={2} />}>
          <SignInFormLazy googleEnabled={googleEnabled} />
        </Suspense>
      ) : null}
    </Dialog>
  )
}

/**
 * The form lives in its own chunk: it pulls in react-hook-form and Zod, which
 * would otherwise load for everyone who opens any page. It is fetched the
 * first time the dialog opens.
 */
const SignInFormLazy = lazy(async () => ({
  default: (await import('../auth/sign-in-form')).SignInForm,
}))
