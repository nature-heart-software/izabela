<template>
  <NvSelect :options="options" v-bind="$attrs" />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { computed } from 'vue'
import { useSpeechEngineManager } from '@/modules/speech-engine-manager'
import { orderBy } from 'lodash'
import { groupOptions } from '@/utils/select'
import { capitalize } from '@/utils/text'

const { engines } = useSpeechEngineManager()
const options = computed(() =>
  groupOptions(
    orderBy(
      engines.value.map((engine) => {
        const disabled = engine.hasCredentials ? !engine.hasCredentials() : false
        return {
          disabled,
          label: engine.name,
          value: engine.id,
          category: capitalize(engine.category),
          attrs: {
            title: disabled ? 'Requires credentials' : '',
          },
        }
      }),
      ['disabled', 'label'],
      ['asc', 'asc'],
    ),
    'category',
  ),
)
</script>
