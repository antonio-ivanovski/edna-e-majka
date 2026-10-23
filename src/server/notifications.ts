import { Effect } from 'effect'

import { Mailer } from './services/mailer'

const baseStyle =
  'margin:0;padding:24px;background:#faf6ec;font-family:Onest,Helvetica,Arial,sans-serif;color:#222426'

function shell(title: string, body: string): string {
  return (
    '<!doctype html>\n<html lang="mk">\n  <body style="' +
    baseStyle +
    '">\n    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fff;border:1px solid rgba(34,36,38,.15);border-radius:5px">\n      <tr>\n        <td style="padding:24px 28px 8px">\n          <h1 style="margin:0;font-size:20px;color:#9f3a38">Една е Мајка</h1>\n          <h2 style="margin:12px 0 0;font-size:17px;color:#222426">' +
    title +
    '</h2>\n        </td>\n      </tr>\n      <tr>\n        <td style="padding:16px 28px 24px;font-size:15px;line-height:1.5;color:#222426">\n          ' +
    body +
    '\n        </td>\n      </tr>\n    </table>\n  </body>\n</html>'
  )
}

function send(to: string, subject: string, text: string, html: string) {
  return Effect.gen(function* () {
    const mailer = yield* Mailer
    yield* mailer
      .send({ to, subject, text, html })
      .pipe(
        Effect.catchTag('EmailError', (error) =>
          Effect.logWarning('email delivery failed', { to, subject, reason: error.message }),
        ),
      )
  })
}

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const sendEnquiryNotification = Effect.fn('sendEnquiryNotification')(function* (input: {
  readonly to: string
  readonly storeName: string
  readonly productName: string | null
  readonly enquirerName: string
  readonly enquirerEmail: string
  readonly message: string
  readonly appUrl: string
}) {
  const subject = 'Ново барање за ' + input.storeName
  const productLine = input.productName ? '\nПроизвод: ' + input.productName : ''
  const text = [
    'Здраво,',
    '',
    'Добивте ново барање преку Една е Мајка.',
    '',
    'Од: ' + input.enquirerName + ' (' + input.enquirerEmail + ')',
    productLine,
    '',
    'Порака:',
    input.message,
    '',
    'Одговорете директно на ' + input.enquirerEmail + '.',
    '',
    'Една е Мајка',
  ]
    .filter(Boolean)
    .join('\n')

  const html = shell(
    'Ново барање',
    '<p>Добивте ново барање преку Една е Мајка.</p>' +
      '<p><strong>Од:</strong> ' +
      escape(input.enquirerName) +
      ' (' +
      escape(input.enquirerEmail) +
      ')</p>' +
      (input.productName
        ? '<p><strong>Производ:</strong> ' + escape(input.productName) + '</p>'
        : '') +
      '<p><strong>Порака:</strong></p>' +
      '<p style="white-space:pre-wrap">' +
      escape(input.message) +
      '</p>' +
      '<p>Одговорете директно на <a href="mailto:' +
      escape(input.enquirerEmail) +
      '">' +
      escape(input.enquirerEmail) +
      '</a>.</p>',
  )

  yield* send(input.to, subject, text, html)
})

export const sendModerationDecision = Effect.fn('sendModerationDecision')(function* (input: {
  readonly to: string
  readonly storeName: string
  readonly status: 'active' | 'suspended' | 'archived' | 'pending'
  readonly note: string | null
  readonly appUrl: string
}) {
  const approved = input.status === 'active'
  const subject = approved
    ? input.storeName + ' е одобрена'
    : 'Измена на статусот на ' + input.storeName
  const verdict = approved
    ? 'Вашата продавница е одобрена и сега е јавно видлива.'
    : 'Статусот на вашата продавница е сменет на ' + input.status + '.'

  const text = [
    'Здраво,',
    '',
    verdict,
    input.note ? 'Забелешка: ' + input.note : '',
    '',
    'Погледнете ја продавницата: ' + input.appUrl,
    '',
    'Една е Мајка',
  ]
    .filter(Boolean)
    .join('\n')

  const html = shell(
    approved ? 'Продавницата е одобрена' : 'Измена на статусот',
    '<p>' +
      escape(verdict) +
      '</p>' +
      (input.note ? '<p><strong>Забелешка:</strong> ' + escape(input.note) + '</p>' : '') +
      '<p><a href="' +
      escape(input.appUrl) +
      '">Погледнете ја продавницата</a></p>',
  )

  yield* send(input.to, subject, text, html)
})

export const sendNewApplicationNotification = Effect.fn('sendNewApplicationNotification')(
  function* (input: {
    readonly to: string
    readonly storeName: string
    readonly ownerName: string
    readonly ownerEmail: string
    readonly needsReview: boolean
    readonly appUrl: string
  }) {
    const subject = input.needsReview
      ? 'Нова апликација за преглед: ' + input.storeName
      : 'Нова продавница: ' + input.storeName

    const text = [
      'Здраво,',
      '',
      'Нова продавница е регистрирана на Една е Мајка.',
      '',
      'Име: ' + input.storeName,
      'Сопственик: ' + input.ownerName + ' (' + input.ownerEmail + ')',
      input.needsReview
        ? 'Автоматската проверка ја означи за рачен преглед.'
        : 'Автоматски одобрена.',
      '',
      'Админ панел: ' + input.appUrl + '/admin/stores',
      '',
      'Една е Мајка',
    ].join('\n')

    const html = shell(
      'Нова продавница',
      '<p>Нова продавница е регистрирана на Една е Мајка.</p>' +
        '<p><strong>Име:</strong> ' +
        escape(input.storeName) +
        '</p>' +
        '<p><strong>Сопственик:</strong> ' +
        escape(input.ownerName) +
        ' (' +
        escape(input.ownerEmail) +
        ')</p>' +
        '<p>' +
        (input.needsReview
          ? 'Автоматската проверка ја означи за рачен преглед.'
          : 'Автоматски одобрена.') +
        '</p>' +
        '<p><a href="' +
        escape(input.appUrl) +
        '/admin/stores">Админ панел</a></p>',
    )

    yield* send(input.to, subject, text, html)
  },
)

export const sendNewProductNotification = Effect.fn('sendNewProductNotification')(
  function* (input: {
    readonly to: string
    readonly storeName: string
    readonly productTitle: string
    readonly productUrl: string
  }) {
    const subject = 'Нов производ од ' + input.storeName
    const text = [
      'Здраво,',
      '',
      input.storeName + ' објави нов производ: ' + input.productTitle,
      '',
      input.productUrl,
      '',
      'Една е Мајка',
    ].join('\n')

    const html = shell(
      'Нов производ',
      '<p>' +
        escape(input.storeName) +
        ' објави нов производ: <strong>' +
        escape(input.productTitle) +
        '</strong></p>' +
        '<p><a href="' +
        escape(input.productUrl) +
        '">Погледнете го производот</a></p>',
    )

    yield* send(input.to, subject, text, html)
  },
)
