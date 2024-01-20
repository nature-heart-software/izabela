<template>
  <NvCard>
    <NvStack>
      <NvGroup align="start" justify="between" noWrap>
        <NvGroup align="start" class="!flex-1 min-w-0" noWrap>
          <NvButton
            :loading="isLoading"
            class="shrink-0"
            icon-name="play"
            size="sm"
            @click="() => play()"
          />
          <NvStack class="!flex-1 min-h-0">
            <NvSpeechEngineInput
              v-model="data.originalMessage"
              :engine="data.engine"
              :voice="data.selectedVoice[data.engine]"
              class="w-full"
              size="sm"
              @enter="() => play()"
            />
            <NvGroup noWrap>
              <NvSpeechEngineSelect v-model="data.engine" class="w-1/3" size="sm" />
              <template v-if="engine">
                <component
                  :is="engine.voiceSelectComponent"
                  v-if="engine.voiceSelectComponent"
                  v-model="data.selectedVoice[data.engine]"
                  class="w-1/3"
                  placeholder="Speech Voice"
                  size="sm"
                />
              </template>
              <NvKeybinding v-model="data.shortcut" class="w-1/3" multiple size="sm" />
            </NvGroup>
          </NvStack>
        </NvGroup>
        <NvContextMenu
          :options="[
            {
              label: 'Delete',
              icon: 'trash-alt',
              onClick: () => {
                messagesStore.removeShortcutMessage(id)
              },
            },
          ]"
        >
          <NvButton class="shrink-0" icon-name="ellipsis-v" size="sm" />
        </NvContextMenu>
      </NvGroup>
      <div v-if="isPlaying" class="h-2 relative bg-gray-10">
        <div :style="{ width: `${progress * 100}%` }" class="h-full bg-black"></div>
      </div>
    </NvStack>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvContextMenu, NvGroup, NvStack } from '@packages/ui'
import { useMessagesStore } from '@/features/messages/store'
import { storeToRefs } from 'pinia'
import { computed, defineProps, reactive, ref, watch } from 'vue'
import { getEngineById } from '@/modules/speech-engine-manager'
import NvSpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import { useSettingsStore } from '@/features/settings/store'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import { Key } from '@/types/keybinds'
import { usePlayMessage } from '@/features/messages/hooks'
import NvSpeechEngineInput from '@/features/speech/components/inputs/NvSpeechEngineInput.vue'
import { getCleanMessage, getMessageCommand } from '@/modules/izabela/utils'
import hash from 'object-hash'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})
const { ElectronFilesystem } = window
const messagesStore = useMessagesStore()
const settingsStore = useSettingsStore()
const { shortcutMessages } = storeToRefs(messagesStore)
const message = computed(() => shortcutMessages.value.find((m) => m.id === props.id))
const isDataProvided = ref(false)
const data = reactive({
  originalMessage: '',
  engine: '',
  selectedVoice: {} as Record<string, unknown>,
  shortcut: [] as Key[],
})
const hashedData = computed(() =>
  hash([data.originalMessage, data.engine, data.selectedVoice[data.engine]]),
)
const engine = computed(() => {
  if (!data.engine) return null
  return getEngineById(data.engine)
})

watch(
  () => message,
  () => {
    if (!isDataProvided.value) {
      if (message.value) isDataProvided.value = true
      const engineId = message.value?.engine || settingsStore.selectedSpeechEngine
      data.engine = engineId
      data.selectedVoice[engineId] = message.value?.voice
      data.shortcut = message.value?.shortcut || ([] as Key[])
      data.originalMessage = message.value?.originalMessage || ''
    }
  },
  { deep: true, immediate: true },
)

watch(
  () => data,
  () => {
    const voice = data.selectedVoice[data.engine]
    const engineCommands = engine.value?.commands?.(voice) || []
    const cleanMessage = getCleanMessage(data.originalMessage, engineCommands)
    messagesStore.updateShortcutMessage(props.id, {
      ...message.value,
      id: message.value?.id || props.id,
      engine: data.engine,
      voice,
      shortcut: data.shortcut,
      message: cleanMessage,
      translatedMessage: null,
      translatedFrom: null,
      translatedTo: null,
      originalMessage: data.originalMessage,
      command: getMessageCommand(data.originalMessage),
    })
  },
  { deep: true },
)

watch(
  () => data.engine,
  () => {
    if (!data.selectedVoice[data.engine]) {
      data.selectedVoice[data.engine] = engine.value?.getSelectedVoice()
    }
  },
  { immediate: true },
)
watch(
  () => hashedData.value,
  () => {
    ElectronFilesystem.deleteCachedAudio(message.value?.id || props.id)
  },
  { immediate: false },
)
const playMessage = computed(() =>
  message.value
    ? {
        ...message.value,
        excludeFromHistory: true,
      }
    : undefined,
)
const { play, isPlaying, isLoading, progress } = usePlayMessage(playMessage)
</script>
