<template>
  <NvCard size="sm">
    <NvGroup noWrap>
      <NvSpeechEngineInput
        ref="messengerInput"
        v-model="inputValue"
        :engine="speechStore.selectedSpeechEngine"
        :placeholder="placeholder"
        :voice="speechStore.currentSpeechEngine?.getSelectedVoice()"
        class="w-full"
        data-v-step="messenger-text-input"
        size="lg"
        @blur="onInputBlur"
        @enter="onInputEnter"
        @esc="onInputEsc"
        @focus="onInputFocus"
        @space="
          (e) =>
            settingsStore.messageMode === 'word' && [
              playMessage(),
              e.preventDefault(),
            ]
        "
      />
      <NvButton
        data-v-step="messenger-text-input-submit"
        icon-name="message"
        size="lg"
        @click="playMessage()"
      />
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup } from '@packages/ui'
import { computed, ref, watch } from 'vue'
import { useMessengerWindowStore } from '@/teams/messenger/store'
import { emitIPCSay } from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import { useSettingsStore } from '@/features/settings/store'
import NvSpeechEngineInput from '@/features/speech/components/inputs/NvSpeechEngineInput.vue'
import { socket } from '@/services'
import { isGameOverlay } from '@/consts.ts'

const { ElectronMessengerWindow } = window
const messengerWindowStore = useMessengerWindowStore()
const messengerInput = ref()

const settingsStore = useSettingsStore()
const speechStore = useSpeechStore()
const inputValue = ref('')
const inputRef = computed(() => messengerInput.value?.input)

const onInputEsc = () => {
  ElectronMessengerWindow.hide()
}

const placeholder = computed(() => {
  if (speechStore.commands.length > 0) {
    return `Type / to see available commands (${speechStore.commands.length})`
  }
  return 'So, said the angel to the child who, divided, broke the knife..'
})

const playMessage = () => {
  if (inputValue.value) {
    emitIPCSay(inputValue.value)
    inputValue.value = ''
  }
}

const onInputFocus = () => {
  messengerWindowStore.$patch({ isInputFocused: true })
  socket.emit('input:focus')
}

const onInputBlur = () => {
  messengerWindowStore.$patch({ isInputFocused: false })
  socket.emit('input:blur')
}

const onInputEnter = () => {
  if (settingsStore.hideWindowOnMessage || !inputValue.value) {
    ElectronMessengerWindow.hide()
  }
  playMessage()
}

const onWindowFocus = () => {
  if (inputRef.value && messengerWindowStore.focusContext === 'keyboard')
    inputRef.value.focus()
}

const onWindowBlur = () => {
  if (inputRef.value) inputRef.value.blur()
}
if (isGameOverlay) {
  window.addEventListener('focus', () => {
    inputRef.value.focus()
  })
  window.addEventListener('blur', () => {
    inputRef.value.blur()
  })
  document
    .querySelector('#offscreen-focus-fix')
    ?.addEventListener('click', (e) => {
      inputRef.value.focus()
    })
}
watch(
  // Makes sure all conditions are met to focus or blur properly
  () => [
    messengerWindowStore.isFocused,
    messengerWindowStore.focusContext,
    messengerWindowStore.isShown,
  ],
  () => {
    if (messengerWindowStore.isFocused) {
      onWindowFocus()
    } else {
      onWindowBlur()
    }
  },
)
</script>
