<template>
  <template v-if="listeningToKeys">
    <NvButton class="pointer-events-none">Listening - press Esc to cancel</NvButton>
  </template>
  <template v-else>
    <NvButton @click.prevent="getRecordingKeybind">Alt Gr</NvButton>
  </template>
</template>
<script lang="ts" setup>
import { NvButton } from '@/core/components'
import { ref } from 'vue'

const { ElectronKeybind } = window
const listeningToKeys = ref(false)

const getRecordingKeybind = () => {
  listeningToKeys.value = true
  ElectronKeybind.getRecordingKeybinding().then((res) => {
    listeningToKeys.value = false
    console.log('hello', res)
  })
}
</script>
