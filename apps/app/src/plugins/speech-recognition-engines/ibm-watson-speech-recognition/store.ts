import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared.ts'

const exposedProperties = {}

export const store = definePluginStore(
  ENGINE_ID,
  {
    apiKey: '',
    url: '',
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)
