import { definePluginStore } from '@/store'
import { ENGINE_ID, defaultModel } from './shared.ts'

const exposedProperties = {
  prompt: '',
  model: defaultModel,
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    apiKey: '',
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)
