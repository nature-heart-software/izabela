export type IzabelaMessageEvent = 'start' | 'end' | 'progress' | 'error'

export interface IzabelaMessagePayload<O = any> {
  text: string
  options: O
}
