<template>
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
      <NvInput
        ref="inputRef"
        :modelValue="props.modelValue"
        v-bind="$attrs"
        @blur="onInputBlur"
        @focus="onInputFocus"
        @update:modelValue="(value) => emit('update:modelValue', value)"
        @keydown.tab.prevent="onInputTab"
        @keydown.enter="onInputEnter"
      />
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
</template>
<script lang="ts" setup>
import { NvAutocomplete, NvGroup, NvInput, NvOption, NvText } from '@packages/ui'
import { computed, defineEmits, defineExpose, defineProps, ref, watch } from 'vue'
import { getEngineById } from '@/modules/speech-engine-manager'
import { useFuse, UseFuseOptions } from '@vueuse/integrations/useFuse'
import { orderBy } from 'lodash'
import { useMessagesStore } from '@/features/messages/store'
import { onKeyStroke } from '@vueuse/core'

const props = defineProps({
  engine: {
    type: String,
    required: true,
  },
  voice: {
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
})
const emit = defineEmits(['update:modelValue'])
const inputRef = ref()
const historyMessageIndex = ref(-1)
const messagesStore = useMessagesStore()
const engine = computed(() => {
  if (!props.engine) return null
  return getEngineById(props.engine)
})

const commands = computed(
  () =>
    engine.value?.commands?.(props.voice).map((command) => ({
      ...command,
      command: `/${ command.value }`,
    })) || [],
)

const inputValue = computed(() => props.modelValue)
const isInputFocused = ref(false)
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
  return orderBy(commands.value,
    [({ command }) => latestCommands.value.indexOf(command), 'command'],
    ['desc', 'asc']).reverse() || []
})

const isAutocompleteVisible = computed(
  () =>
    commands.value.length > 0 && inputValue.value.startsWith('/') && inputValue.value.split(' ').length < 2,
)

const onAutocompleteSelect = (value: typeof commands.value[number]) => {
  console.log('weewoo')
  emit('update:modelValue', `${ value.command } `)
  if (latestCommands.value.includes(value.command)) {
    latestCommands.value.splice(latestCommands.value.indexOf(value.command), 1)
  }
  latestCommands.value.push(value.command)
}

const onInputTab = () => {
  console.log('woowee')
  if (!inputValue.value && commands.value.length > 0) {
    emit('update:modelValue', '/')
  }
}

watch(historyMessageIndex, () => {
  emit('update:modelValue', messagesStore.reversedHistory[historyMessageIndex.value]?.message || '')
})

watch(() => messagesStore.history, (value, oldValue) => {
  if (value.length !== oldValue.length) {
    historyMessageIndex.value = -1
  }
})

onKeyStroke('ArrowUp', () => {
  if (
    !isAutocompleteVisible.value &&
    isInputFocused.value &&
    historyMessageIndex.value < messagesStore.history.length-1
  ) {
    historyMessageIndex.value += 1
  }
})

onKeyStroke('ArrowDown', () => {
  if (!isAutocompleteVisible.value && isInputFocused.value && historyMessageIndex.value > -1) {
    historyMessageIndex.value -= 1
  }
})

const onInputEnter = (e: KeyboardEvent) => {
  if (isAutocompleteVisible.value) {
    e.preventDefault()
  }
}

const onInputFocus = () => {
  isInputFocused.value = true
}

const onInputBlur = () => {
  isInputFocused.value = false
}

const input = computed(() => inputRef.value?.input)
defineExpose({
  input,
})
</script>
