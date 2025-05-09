import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared.ts'

const exposedProperties = {
  prompt: '',
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    apiKey: '',
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)
