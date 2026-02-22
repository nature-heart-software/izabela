<template>
  <NvSelect :options="options" v-bind="$attrs" />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'

const options = [
  { label: 'gpt-5.2', value: 'gpt-5.2' },
  { label: 'gpt-5.2-2025-12-11', value: 'gpt-5.2-2025-12-11' },
  { label: 'gpt-5.2-chat-latest', value: 'gpt-5.2-chat-latest' },
  { label: 'gpt-5.2-pro', value: 'gpt-5.2-pro' },
  { label: 'gpt-5.2-pro-2025-12-11', value: 'gpt-5.2-pro-2025-12-11' },
  { label: 'gpt-5.1', value: 'gpt-5.1' },
  { label: 'gpt-5.1-2025-11-13', value: 'gpt-5.1-2025-11-13' },
  { label: 'gpt-5.1-mini', value: 'gpt-5.1-mini' },
  { label: 'gpt-5.1-chat-latest', value: 'gpt-5.1-chat-latest' },
  { label: 'gpt-5', value: 'gpt-5' },
  { label: 'gpt-5-2025-08-07', value: 'gpt-5-2025-08-07' },
  { label: 'gpt-5-chat-latest', value: 'gpt-5-chat-latest' },
  { label: 'gpt-5-mini', value: 'gpt-5-mini' },
  { label: 'gpt-5-mini-2025-08-07', value: 'gpt-5-mini-2025-08-07' },
  { label: 'gpt-5-nano', value: 'gpt-5-nano' },
  { label: 'gpt-5-nano-2025-08-07', value: 'gpt-5-nano-2025-08-07' },
  { label: 'gpt-4.1', value: 'gpt-4.1' },
  { label: 'gpt-4.1-2025-04-14', value: 'gpt-4.1-2025-04-14' },
  { label: 'gpt-4.1-mini', value: 'gpt-4.1-mini' },
  { label: 'gpt-4.1-mini-2025-04-14', value: 'gpt-4.1-mini-2025-04-14' },
  { label: 'gpt-4.1-nano', value: 'gpt-4.1-nano' },
  { label: 'gpt-4.1-nano-2025-04-14', value: 'gpt-4.1-nano-2025-04-14' },
  { label: 'gpt-4o', value: 'gpt-4o' },
  { label: 'gpt-4o-2024-11-20', value: 'gpt-4o-2024-11-20' },
  { label: 'gpt-4o-2024-08-06', value: 'gpt-4o-2024-08-06' },
  { label: 'gpt-4o-2024-05-13', value: 'gpt-4o-2024-05-13' },
  { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
  { label: 'gpt-4o-mini-2024-07-18', value: 'gpt-4o-mini-2024-07-18' },
]
</script>