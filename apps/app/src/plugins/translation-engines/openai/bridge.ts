import { bridge } from '@packages/electron-bridger'
import { electronModuleName } from './shared.ts'
import OpenAI from 'openai'

bridge.register([
  [
    electronModuleName,
    () => ({
      async translate({
        text,
        from,
        to,
        prompt,
        credentials: { apiKey },
      }: any) {
        try {
          const openai = new OpenAI({
            apiKey,
          })

          const response = await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages: [
              {
                role: 'system',
                content: [
                  `You are a translator. Translate all user input into ${to}.`,
                  from && `The source language is ${from}.`,
                  prompt &&
                    `Here are extra instructions from the user: ${prompt}`,
                ]
                  .filter(Boolean)
                  .join(' '),
              },
              { role: 'user', content: text },
            ],
          })

          return response.choices[0].message.content?.trim() || text
        } catch (e) {
          return text
        }
      },
    }),
  ],
])
