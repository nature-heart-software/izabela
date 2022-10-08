<template>
  <NvCard>
    <NvStack v-loading="downloading">
      <NvGroup align="start" justify="between" noWrap>
        <NvGroup align="start" class="!flex-1 min-w-0" noWrap>
          <NvButton
            :loading="requestingToPlay"
            class="shrink-0"
            icon-name="play"
            size="sm"
            @click="() => playMessage()"
          />
          <NvStack class="!flex-1 min-h-0">
            <NvInput
              v-model="data.message"
              size="sm" />
            <NvGroup noWrap>
              <NvSpeechEngineSelect
                class="w-1/3"
                v-model="data.engine" size="sm" />
              <template v-if="engine">
                <component
                  class="w-1/3"
                  :is="engine.voiceSelectComponent"
                  v-if="engine.voiceSelectComponent"
                  placeholder="Speech Voice"
                  size="sm"
                  v-model="data.selectedVoice[data.engine]"
                />
              </template>
              <NvKeybinding class="w-1/3" v-model="data.shortcut" size="sm" multiple/>
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
      <div
        v-if="playingMessageStore.id === id && playingMessageStore.progress < 1"
        class="h-2 relative bg-gray-10"
      >
        <div
          :style="{ width: `${playingMessageStore.progress * 100}%` }"
          class="h-full bg-black"
        ></div>
      </div>
    </NvStack>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvContextMenu, NvGroup, NvStack, NvInput } from '@packages/ui'
import { useMessagesStore, usePlayingMessageStore } from '@/features/messages/store'
import { storeToRefs } from 'pinia'
import { computed, defineProps, onMounted, reactive, ref, watch } from 'vue'
import { getEngineById } from '@/modules/speech-engine-manager'
import { emitIPCSay } from '@/electron/events/renderer'
import { purify } from '@packages/toolbox'
import NvSpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import { useSettingsStore } from '@/features/settings/store'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import { Key } from '@/types/keybinds'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const messagesStore = useMessagesStore()
const settingsStore = useSettingsStore()
const playingMessageStore = usePlayingMessageStore()
const { shortcutMessages } = storeToRefs(messagesStore)
const message = computed(() => shortcutMessages.value.find((m) => m.id === props.id))
const isDataProvided = ref(false)
const data = reactive({
  message:'',
  engine: '',
  selectedVoice: {} as Record<string, unknown>,
  shortcut: [] as Key[],
})

watch(() => message, () => {
  if (!isDataProvided.value) {
    if (message.value) isDataProvided.value = true
    const engine = message.value?.engine || settingsStore.selectedSpeechEngine
    data.engine = engine
    data.selectedVoice[engine] = message.value?.voice
    data.shortcut = message.value?.shortcut || ([] as Key[])
    data.message = message.value?.message || ''
  }
}, { deep: true, immediate: true })
const requestingToPlay = ref(false)
const engine = computed(() => {
  if (!data.engine) return null
  return getEngineById(data.engine)
})

watch(() => data, () => {
  messagesStore.updateShortcutMessage(props.id, {
    engine: data.engine,
    voice: data.selectedVoice[data.engine],
    shortcut: data.shortcut,
    message: data.message,
  })
}, { deep: true })

watch(
  () => playingMessageStore.progress,
  () => {
    if (playingMessageStore.id === props.id) {
      requestingToPlay.value = false
    }
  },
)

const playMessage = () => {
  if (!message.value || !engine.value) return
  requestingToPlay.value = true
  emitIPCSay(
    purify({
      id: props.id,
      message: message.value.message,
      engine: message.value.engine,
      voice: engine.value.getSelectedVoice(),
      excludeFromHistory: true,
    }),
  )
}
</script>
