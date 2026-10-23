import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

import type { Page } from '@playwright/test'

/** Where miniflare writes the messages the app sends. */
const EMAIL_ROOT = join(process.cwd(), '.wrangler', 'tmp', 'email')

/**
 * The address the suite signs in with. Unique per run, so a magic link from
 * an earlier run can never be picked up: the links are single-use.
 */
export const TEST_EMAIL = `e2e+${Date.now()}@example.com`

async function findEmailFiles(): Promise<string[]> {
  let directories: string[]

  try {
    directories = await readdir(EMAIL_ROOT)
  } catch {
    return []
  }

  const files: string[] = []

  for (const directory of directories) {
    const folder = join(EMAIL_ROOT, directory, 'email-text')

    try {
      const entries = await readdir(folder)
      for (const entry of entries) files.push(join(folder, entry))
    } catch {
      // A directory without messages is not interesting.
    }
  }

  return files
}

/**
 * Signs in through the real magic-link flow.
 *
 * The dev server sends the message through the local e-mail binding, and
 * miniflare writes it to disk, so the link can be picked up and followed
 * exactly as a visitor would.
 */
export async function signIn(page: Page, email = TEST_EMAIL): Promise<void> {
  if (page.url() === 'about:blank') {
    await page.goto('/')
  }

  const known = new Set(await findEmailFiles())

  const response = await page.request.post('/api/auth/sign-in/magic-link', {
    data: { email, callbackURL: '/' },
    headers: { origin: new URL(page.url()).origin },
  })

  if (!response.ok()) {
    throw new Error(`The sign-in request failed with ${response.status()}.`)
  }

  const link = await waitForMagicLink(known)
  await page.goto(link)
  await page.waitForLoadState('domcontentloaded')
}

async function waitForMagicLink(known: Set<string>): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const files = await findEmailFiles()
    const fresh = files.filter((file) => !known.has(file))

    // The message the suite just triggered is the only fresh one; the
    // newest of several wins.
    const withTime = await Promise.all(
      fresh.map(async (file) => ({
        file,
        mtime: (await stat(file).catch(() => undefined))?.mtimeMs ?? 0,
      })),
    )
    withTime.sort((a, b) => b.mtime - a.mtime)

    for (const { file } of withTime) {
      const content = await readFile(file, 'utf8').catch(() => '')
      const match = content.match(/https?:\/\/\S+\/api\/auth\/magic-link\/verify\?\S+/)

      if (match) return match[0]
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error('The magic-link message never arrived.')
}

/** The path of the first product in the catalogue. */
export async function firstProductPath(page: Page): Promise<string> {
  await page.goto('/')
  const href = await page.locator('a[href^="/products/"]').first().getAttribute('href')

  if (!href) throw new Error('The catalogue has no products.')

  return href
}

/** The path of the first producer. */
export async function firstProducerPath(page: Page): Promise<string> {
  await page.goto('/producers')
  const href = await page.locator('a[href^="/producers/"]').first().getAttribute('href')

  if (!href) throw new Error('There are no producers.')

  return href
}

/**
 * Waits until React has taken over the server-rendered markup. Until then the
 * page shows the right thing but does not react to anything, so a test that
 * clicks would be clicking into a dead page.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const main = document.querySelector('main')
      return main ? Object.keys(main).some((key) => key.startsWith('__react')) : false
    },
    undefined,
    { timeout: 15_000 },
  )
}
