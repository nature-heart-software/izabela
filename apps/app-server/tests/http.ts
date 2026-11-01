import { localPorts, localRequest } from './boundaries'
import { once } from 'node:events'
import express, { type RequestHandler } from 'express'

export function harness(plugin: Izabela.Server.Plugin, tempPath: string) {
  const app = express()
  app.use(express.json())
  const handlers = new Map<string, RequestHandler>()
  const post = app.post.bind(app)
  app.post = ((path: string, handler: RequestHandler) => {
    handlers.set(path, handler)
    return post(path, handler)
  }) as typeof app.post
  plugin({ app, config: { tempPath, port: 7070, ws: { port: 7071 } } })
  return { app, handlers }
}
export async function request(
  app: express.Express,
  path: string,
  body: unknown = {},
  method = 'POST',
  raw?: string,
) {
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('No local listener')
  const port = address.port
  localPorts.add(port)
  try {
    return await new Promise<{
      status: number
      headers: import('node:http').IncomingHttpHeaders
      buffer: Buffer
      text: string
      json: () => any
    }>((resolve, reject) => {
      const bytes = raw ?? JSON.stringify(body)
      const req = localRequest(
        {
          host: '127.0.0.1',
          port,
          path,
          method,
          agent: false,
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(bytes),
          },
        },
        (res) => {
          const chunks: Buffer[] = []
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
          res.on('error', reject)
          res.on('end', () => {
            const buffer = Buffer.concat(chunks)
            resolve({
              status: res.statusCode!,
              headers: res.headers,
              buffer,
              text: buffer.toString(),
              json: () => JSON.parse(buffer.toString()),
            })
          })
        },
      )
      req.on('error', reject)
      req.setTimeout(2000, () => req.destroy(new Error('Local HTTP timeout')))
      req.end(bytes)
    })
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
    localPorts.delete(port)
  }
}
