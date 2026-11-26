<template>
  <NvPopover placement="top-start" size="sm">
    <template #reference>
      <NvButton aria-label="Error history" icon-name="history" size="sm" />
    </template>
    <div
      :class="
        vstack({
          alignItems: 'stretch',
          gap: '3',
          maxHeight: '50vh',
          overflowY: 'auto',
        })
      "
      aria-label="Session errors"
    >
      <NvText as="h2">Error history</NvText>
      <NvText v-if="!store.entries.length">No errors in this session.</NvText>
      <ul v-else :class="vstack({ alignItems: 'stretch', gap: '3' })">
        <li v-for="error in store.entries.slice().reverse()" :key="error.id">
          <NvText>{{ titles[error.category] }}</NvText>
          <NvText
            >{{ operations[error.operation]
            }}<template v-if="getProviderName(error)">
              · {{ getProviderName(error) }}</template
            ></NvText
          >
          <NvText
            ><time :datetime="error.createdAt">{{
              new Date(error.createdAt).toLocaleTimeString()
            }}</time></NvText
          >
        </li>
      </ul>
      <NvButton :disabled="clearing || !store.entries.length" @click="clear"
        >Clear errors</NvButton
      >
      <NvText v-if="clearFailed" role="alert"
        >Could not clear errors. Try again.</NvText
      >
    </div>
  </NvPopover>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { NvButton, NvPopover, NvText } from '@packages/ui'
import { vstack } from '@/styled-system/patterns'
import { useSessionErrorsStore } from './store'
import { getProviderName } from './provider-name'
const store = useSessionErrorsStore()
const titles = {
  connection: 'Connection error',
  subscription: 'Subscription error',
  other: 'Provider error',
}
const operations = {
  speech: 'Speech',
  'speech-recognition': 'Speech recognition',
  translation: 'Translation',
  provider: 'Provider',
}
const clearing = ref(false)
const clearFailed = ref(false)
async function clear() {
  clearing.value = true
  clearFailed.value = false
  try {
    await window.ElectronSessionErrors.clear()
  } catch {
    clearFailed.value = true
  } finally {
    clearing.value = false
  }
}
</script>
