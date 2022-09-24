<template>
  <NvCard size="sm">
    <NvGroup noWrap>
      <NvAutocomplete
        :autoScrollIndex="autocompleteValues.length - 1"
        :data="autocompleteValues"
        :getItemKey="(index) => autocompleteValues[index].value"
        :selectOnTab="true"
        :visible="showAutocomplete"
        class="w-full"
        placement="top-start"
        @select="onAutocompleteSelect"
      >
        <template #reference>
          <NvInput
            ref="messengerInput"
            v-model="inputValue"
            :placeholder="placeholder"
            class="w-full"
            size="lg"
            @blur="messengerStore.$patch({ isInputFocused: false })"
            @focus="messengerStore.$patch({ isInputFocused: true })"
            @keydown.esc.prevent="onInputEsc"
            @keydown.enter="!showAutocomplete && playMessage()"
            @keydown.space="
              (e) => settingsStore.messageMode === 'word' && [playMessage(), e.preventDefault()]
            "
            @keydown.tab.prevent="onInputTab"
          />
        </template>
        <template #default="scope">
          <NvOption v-if="autocompleteValues[scope.index]" :active="scope.active">
            <NvGroup>
              <NvText type="label">
                {{ autocompleteValues[scope.index].command }}
              </NvText>
              <NvText v-if="autocompleteValues[scope.index].description" type="caption">
                {{ autocompleteValues[scope.index].description }}
              </NvText>
            </NvGroup>
          </NvOption>
        </template>
      </NvAutocomplete>
      <NvButton icon-name="message" size="lg" @click="playMessage()" />
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvAutocomplete, NvButton, NvCard, NvGroup, NvInput, NvOption, NvText } from '@packages/ui'
import { ComponentPublicInstance, computed, ref, watch } from 'vue'
import { useFuse, UseFuseOptions } from '@vueuse/integrations/useFuse'
import { orderBy } from 'lodash'
import { useMessengerStore } from '@/teams/messenger/store'
import { emitIPCSay } from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import { useSettingsStore } from '@/features/settings/store'

const { ElectronMessengerWindow } = window
const messengerStore = useMessengerStore()
const messengerInput = ref()

const settingsStore = useSettingsStore()
const speechStore = useSpeechStore()
const inputValue = ref('')
const commands = computed(() =>
  speechStore.commands.map((command) => ({
    ...command,
    command: `/${command.value}`,
  })),
)
const latestCommands = ref<string[]>([])
const fuseOptions = computed<UseFuseOptions<typeof commands.value[number]>>(() => ({
  fuseOptions: {
    keys: ['command'],
    threshold: 0.3,
  },
}))
const { results } = useFuse(inputValue, commands, fuseOptions)
const autocompleteValues = computed(() => {
  if (inputValue.value) {
    return (
      orderBy(
        results.value.map(({ item }) => item),
        [({ command }) => latestCommands.value.indexOf(command), 'command'],
        ['desc', 'asc'],
      ).reverse() || []
    )
  }
  return (
    orderBy(
      commands.value,
      [({ command }) => latestCommands.value.indexOf(command), 'command'],
      ['desc', 'asc'],
    ).reverse() || []
  )
})
const showAutocomplete = computed(
  () =>
    commands.value.length > 0 &&
    inputValue.value.startsWith('/') &&
    inputValue.value.split(' ').length < 2,
)

const onInputTab = () => {
  if (!inputValue.value) {
    inputValue.value = '/'
  }
}
const onInputEsc = () => {
  ElectronMessengerWindow.hide()
}
const onAutocompleteSelect = (value: typeof commands.value[number]) => {
  inputValue.value = `${value.command} `
  if (latestCommands.value.includes(value.command)) {
    latestCommands.value.splice(latestCommands.value.indexOf(value.command), 1)
  }
  latestCommands.value.push(value.command)
}
const placeholder = computed(() => {
  if (commands.value.length > 0) {
    return `Type / to see available commands (${commands.value.length})`
  }
  return 'So, said the angel to the child who, divided, broke the knife..'
})

const playMessage = () => {
  if (inputValue.value) {
    emitIPCSay(inputValue.value)
    inputValue.value = ''
  }
}

const onWindowFocus = () => {
  const componentInstance = messengerInput.value as ComponentPublicInstance
  const input = componentInstance.$el.querySelector('input')
  if (input) input.focus()
}

const onWindowBlur = () => {
  const componentInstance = messengerInput.value as ComponentPublicInstance
  const input = componentInstance.$el.querySelector('input')
  if (input) input.blur()
}

watch(
  () => messengerStore.isFocused,
  () => {
    if (messengerStore.isFocused) {
      onWindowFocus()
    } else {
      onWindowBlur()
    }
  },
)
</script>
