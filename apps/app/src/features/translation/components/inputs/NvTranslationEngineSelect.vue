<template>
  <NvSelect :options="options" v-bind="$attrs" />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { computed } from 'vue'
import translationEngineManager from '@/modules/translation-engine-manager'
import orderBy from 'lodash/orderBy'

const options = computed(() =>
  orderBy(
    translationEngineManager.getEngines().map((engine) => {
      // const disabled = engine.hasCredentials ? !engine.hasCredentials() : false
      const disabled = false
      return {
        disabled,
        label: engine.name,
        value: engine.id,
        attrs: {
          title: disabled ? 'Requires credentials' : '',
        },
      }
    }),
    ['disabled', 'label'],
    ['asc', 'asc'],
  ),
)
</script>
