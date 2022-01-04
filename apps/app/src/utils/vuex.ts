import { ActionContext, Mutation } from 'vuex'
import { set } from 'lodash'

export type SetPropertyPayload = [string, any]

export const setPropertyMutation: Mutation<any> = (
  state,
  [path, data]: SetPropertyPayload,
): object => set(state, path, data)

export const setPropertyDispatch = (
  { commit }: ActionContext<any, any>,
  payload: SetPropertyPayload,
) => commit('setProperty', payload)

export const setPropertiesMutation: Mutation<any> = (
  state,
  payloads: SetPropertyPayload[],
): object => payloads.map(([path, data]) => set(state, path, data))

export const setPropertiesDispatch = (
  { commit }: ActionContext<any, any>,
  payloads: SetPropertyPayload[],
) => commit('setProperties', payloads)

export const utilMutations = {
  setProperty: setPropertyMutation,
  setProperties: setPropertiesMutation,
}

export const utilActions = {
  setProperty: setPropertyDispatch,
  setProperties: setPropertiesDispatch,
}
