export type IzabelaMessageEvent = 'started' | 'ended' | 'progress' | 'error'

export interface IzabelaMessagePayload<O = any> {
  text: string
  options: O
}
