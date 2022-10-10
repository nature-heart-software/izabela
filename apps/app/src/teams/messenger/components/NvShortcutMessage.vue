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
            <NvAutocomplete
              :autoScrollIndex="autocompleteValues.length - 1"
              :options="autocompleteValues"
              :selectOnTab="true"
              :visible="isAutocompleteVisible"
              class="w-full"
              placement="top-start"
              valueKey="value"
              @select="onAutocompleteSelect"
            >
              <template #reference>
                <NvInput v-model="data.message" class="w-full" size="sm"/>
              </template>
              <template #default="{ item, active }">
                <NvOption v-if="item" :active="active">
                  <NvGroup>
                    <NvText type="label">
                      {{ item.command }}
                    </NvText>
                    <NvText v-if="item.description" type="caption">
                      {{ item.description }}
                    </NvText>
                  </NvGroup>
                </NvOption>
              </template>
            </NvAutocomplete>
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
import {
  NvAutocomplete,
  NvButton,
  NvCard,
  NvContextMenu,
  NvGroup,
  NvInput,
  NvOption,
  NvStack,
  NvText,
} from '@packages/ui'
import { useMessagesStore } from '@/features/messages/store'
import { storeToRefs } from 'pinia'
import { computed, defineProps, reactive, ref, watch } from 'vue'
import { getEngineById } from '@/modules/speech-engine-manager'
import NvSpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import { useSettingsStore } from '@/features/settings/store'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import { Key } from '@/types/keybinds'
import { useFuse, UseFuseOptions } from '@vueuse/integrations/useFuse'
import { orderBy } from 'lodash'
import { usePlayMessage } from '@/features/messages/hooks'

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
  engine: '',
  selectedVoice: {} as Record<string, unknown>,
  shortcut: [] as Key[],
})

watch(
  () => message,
  () => {
    if (!isDataProvided.value) {
      if (message.value) isDataProvided.value = true
      const engine = message.value?.engine || settingsStore.selectedSpeechEngine
      data.engine = engine
      data.selectedVoice[engine] = message.value?.voice
      data.shortcut = message.value?.shortcut || ([] as Key[])
      data.message = message.value?.message || ''
    }
  },
  { deep: true, immediate: true },
)
const engine = computed(() => {
  if (!data.engine) return null
  return getEngineById(data.engine)
})

const commands = computed(
  () =>
    engine.value?.commands?.(data.selectedVoice[engine.value.id]).map((command) => ({
      ...command,
      command: `/${ command.value }`,
    })) || [],
)

const inputValue = computed(() => data.message)

const fuseOptions = computed<UseFuseOptions<typeof commands.value[number]>>(() => ({
  fuseOptions: {
    keys: ['command'],
    threshold: 0.3,
  },
}))

const { results } = useFuse(inputValue, commands, fuseOptions)
const autocompleteValues = computed(() => {
  if (data.message) {
    return (
      orderBy(
        results.value.map(({ item }) => item),
        ['command'],
        ['asc'],
      ).reverse() || []
    )
  }
  return orderBy(commands.value, ['command'], ['asc']).reverse() || []
})

const isAutocompleteVisible = computed(
  () =>
    commands.value.length > 0 && data.message.startsWith('/') && data.message.split(' ').length < 2,
)

const onAutocompleteSelect = (value: typeof commands.value[number]) => {
  data.message = `${ value.command } `
}

watch(
  () => data,
  () => {
    messagesStore.updateShortcutMessage(props.id, {
      engine: data.engine,
      voice: data.selectedVoice[data.engine],
      shortcut: data.shortcut,
      message: data.message,
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

const playMessage = computed(() => ({
  id: props.id,
  message: data.message,
  engine: data.engine,
  voice: data.selectedVoice[data.engine],
  excludeFromHistory: true,
}))
const { play, isPlaying, isLoading, progress } = usePlayMessage(playMessage)
</script>
