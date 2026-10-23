import { execFile } from 'node:child_process'
import { createHmac, randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import type { Page } from '@playwright/test'

const execFileAsync = promisify(execFile)

const sqlEscape = (value: string) => value.replace(/'/g, "''")

/** The local secret, from the gitignored file the dev server itself reads. */
async function readSecret(): Promise<string> {
  const content = await readFile('.dev.vars', 'utf8')
  const line = content
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('BETTER_AUTH_SECRET='))

  if (!line) {
    throw new Error('BETTER_AUTH_SECRET is missing from .dev.vars.')
  }

  return line.slice('BETTER_AUTH_SECRET='.length).trim().replace(/^"|"$/g, '')
}

/**
 * Signs the raw session token the way the server does: HMAC-SHA256 with the
 * auth secret, base64, appended after a dot and URI-encoded.
 */
function signCookieValue(value: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(value).digest('base64')
  return encodeURIComponent(`${value}.${signature}`)
}

/**
 * Signs in without touching the magic-link flow: the user and session rows
 * are written straight into the local D1, and the session cookie is set on
 * the browser context. No e-mail, no rate limits, fully deterministic.
 *
 * Each call mints a fresh user, so tests never share state with each other.
 */
export async function signInAs(
  page: Page,
  input?: { email?: string; name?: string; role?: 'user' | 'admin' },
): Promise<{ email: string; name: string; userId: string }> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`
  const email = input?.email ?? `e2e+${stamp}@example.com`
  const name = input?.name ?? 'E2E Тест'
  const userId = `e2e-user-${randomUUID()}`
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '')
  const sessionId = `e2e-session-${randomUUID()}`
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000

  const sql = [
    `INSERT INTO "user" (id, name, email, email_verified, role, banned) VALUES ('${userId}', '${sqlEscape(name)}', '${sqlEscape(email)}', 1, '${input?.role ?? 'user'}', 0);`,
    `INSERT INTO "session" (id, expires_at, token, user_id) VALUES ('${sessionId}', ${expiresAt}, '${token}', '${userId}');`,
  ].join('\n')

  const file = join(tmpdir(), `e2e-signin-${stamp}.sql`)
  await writeFile(file, sql)

  try {
    await execFileAsync('pnpm', [
      'exec',
      'wrangler',
      'd1',
      'execute',
      'DB',
      '--local',
      '--file',
      file,
    ])
  } finally {
    await import('node:fs/promises').then((fs) => fs.unlink(file).catch(() => undefined))
  }

  const secret = await readSecret()
  await page.context().addCookies([
    {
      name: 'better-auth.session_token',
      value: signCookieValue(token, secret),
      domain: 'localhost',
      path: '/',
    },
  ])

  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')

  return { email, name, userId }
}
