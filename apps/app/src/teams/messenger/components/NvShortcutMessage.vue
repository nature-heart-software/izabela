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
              <NvSpeechEngineSelect v-model="data.engine" class="w-1/3" size="sm"/>
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
              <NvKeybinding v-model="data.shortcut" class="w-1/3" multiple size="sm"/>
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
          <NvButton class="shrink-0" icon-name="ellipsis-v" size="sm"/>
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

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const messagesStore = useMessagesStore()
const settingsStore = useSettingsStore()
const { shortcutMessages } = storeToRefs(messagesStore)
const message = computed(() => shortcutMessages.value.find((m) => m.id === props.id))
const isDataProvided = ref(false)
const data = reactive({
  message: '',
  originalMessage: '',
  command: null as string | null,
  engine: '',
  selectedVoice: {} as Record<string, unknown>,
  shortcut: [] as Key[],
})

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
      data.message = message.value?.message || ''
      data.originalMessage = message.value?.originalMessage || ''
      data.command = message.value?.command || null
    }
  },
  { deep: true, immediate: true },
)

// NOTE: HOLY SHIT DO SOMETHING ABOUT THIS IT'S AWFUL LOL
// Check NvHistoryMessage, NvSpeechSynthesizer and electron-keybinding/register
// Thank you in advance future me, I did my best...
watch(
  () => data,
  () => {
    const voice = data.selectedVoice[data.engine]
    const cleanMessage = getCleanMessage(data.originalMessage, engine.value?.commands?.(voice) || [])
    messagesStore.updateShortcutMessage(props.id, {
      engine: data.engine,
      voice,
      shortcut: data.shortcut,
      message: cleanMessage,
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

const playMessage = computed(() => {
  const voice = data.selectedVoice[data.engine]
  const cleanMessage = getCleanMessage(data.originalMessage, engine.value?.commands?.(voice) || [])
  return ({
    id: props.id,
    message: cleanMessage,
    originalMessage: data.originalMessage,
    command: getMessageCommand(data.originalMessage),
    engine: data.engine,
    voice,
    excludeFromHistory: true,
  })
})
const { play, isPlaying, isLoading, progress } = usePlayMessage(playMessage)
</script>
