/**
 * The whole moderation policy, deliberately a single pure function: no flags to
 * configure, no model to call, no fallback that quietly approves everything.
 *
 * A shop that mentions `[spam]` waits for an admin; every other application
 * goes live on its own. Admins can always change the status afterwards.
 */
const SPAM_MARKER = /\[spam\]/i

export type ShopApplication = {
  name: string
  description: string
}

export type ModerationVerdict = { status: 'active' } | { status: 'pending'; note: string }

export function reviewShopApplication(application: ShopApplication): ModerationVerdict {
  if (SPAM_MARKER.test(application.name) || SPAM_MARKER.test(application.description)) {
    return {
      status: 'pending',
      note: 'Автоматската проверка го означи профилот за рачен преглед.',
    }
  }

  return { status: 'active' }
}
