import { Context, Effect, Layer } from 'effect'

import { env } from 'cloudflare:workers'

import { EmailError } from '../errors'

export interface MailMessage {
  readonly to: string
  readonly subject: string
  readonly text: string
  readonly html: string
}

export interface MailerService {
  readonly send: (message: MailMessage) => Effect.Effect<void, EmailError>
}

export class Mailer extends Context.Service<Mailer, MailerService>()('edna-e-majka/server/Mailer') {
  static readonly layer = Layer.sync(Mailer, () => {
    const send: MailerService['send'] = (message) =>
      Effect.tryPromise({
        try: () =>
          env.EMAIL.send({
            from: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html,
          }),
        catch: (cause) => new EmailError({ message: 'Не успеавме да испратиме е-пошта.', cause }),
      }).pipe(Effect.asVoid)

    return Mailer.of({ send })
  })
}
