import { workerEnv } from './worker-env'

const SUBJECT = 'Влезете во Една е Мајка'

/**
 * The only outbound message the app sends: a magic-link sign-in. Everything is
 * Macedonian because it is read by producers and visitors.
 *
 * Cloudflare Email Service is in beta and rejects unverified senders
 * (`E_SENDER_NOT_VERIFIED`) or throttles bursts (`E_RATE_LIMIT_EXCEEDED`). Errors
 * are surfaced to the caller instead of being swallowed.
 */
export async function sendMagicLinkEmail({ to, url, expiresInMinutes }: SendMagicLinkEmailInput) {
  const text = [
    'Здраво,',
    '',
    'Побарана е најава на твојата е-пошта на ednaemajka.mk.',
    'Отвори го линкот подолу за да влезеш:',
    '',
    url,
    '',
    `Линкот важи ${expiresInMinutes} минути и може да се искористи само еднаш.`,
    'Ако не си побарал најава, слободно игнорирај ја оваа порака.',
    '',
    'Една е Мајка',
  ].join('\n')

  const html = `<!doctype html>
<html lang="mk">
  <body style="margin:0;padding:24px;background:#f8f8f9;font-family:Onest,Helvetica,Arial,sans-serif;color:#222426">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fff;border:1px solid rgba(34,36,38,.15);border-radius:5px">
      <tr>
        <td style="padding:24px 28px 8px">
          <h1 style="margin:0;font-size:20px;color:#DB2828">Една е Мајка</h1>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.5">Побарана е најава на твојата е-пошта на ednaemajka.mk.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px">
          <a href="${url}" style="display:inline-block;padding:12px 20px;background:#FBBD08;color:#222426;font-weight:600;text-decoration:none;border-radius:5px">Најави се</a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 24px;font-size:13px;line-height:1.5;color:#767676">
          <p style="margin:0">Линкот важи ${expiresInMinutes} минути и може да се искористи само еднаш.</p>
          <p style="margin:12px 0 0">Ако не си побарал најава, слободно игнорирај ја оваа порака.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  try {
    return await workerEnv().EMAIL.send({
      from: { email: workerEnv().EMAIL_FROM, name: workerEnv().EMAIL_FROM_NAME },
      to,
      subject: SUBJECT,
      text,
      html,
    })
  } catch (error) {
    throw new Error(
      `Cloudflare Email Service rejected the magic-link email for ${to}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    )
  }
}

export type SendMagicLinkEmailInput = {
  to: string
  url: string
  expiresInMinutes: number
}
