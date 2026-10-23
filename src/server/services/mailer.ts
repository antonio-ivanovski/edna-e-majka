import { Context, Effect, Layer } from 'effect'

import { EmailError } from '../errors'

import { workerEnv } from '../worker-env'

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
          workerEnv().EMAIL.send({
            from: { email: workerEnv().EMAIL_FROM, name: workerEnv().EMAIL_FROM_NAME },
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
