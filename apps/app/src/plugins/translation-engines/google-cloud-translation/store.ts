import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared.ts'

const exposedProperties = {
  translateFrom: null,
  translateTo: null,
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)
