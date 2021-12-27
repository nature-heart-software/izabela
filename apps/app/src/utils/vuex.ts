import { ActionContext, Dispatch, Mutation } from 'vuex'
import { set } from 'lodash'

export const setPropertyMutation: Mutation<any> = (
  state,
  [path, data]: [string, any],
): object => set(state, path, data)

export const setPropertyDispatch = (
  { commit }: ActionContext<any, any>,
  value: any,
) => commit('setProperty', value)

export const utilMutations = {
  setProperty: setPropertyMutation,
}

export const utilActions = {
  setProperty: setPropertyDispatch,
}
