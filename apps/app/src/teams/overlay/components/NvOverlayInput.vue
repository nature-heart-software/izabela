<template>
  <div
    ref="messenger"
    class="messenger bg-gray-10/95 rounded grid p-4 gap-4 grid-rows-3 grid-rows-none min-w-[480px]"
    data-v-step="messenger-window"
  >
    <NvGroup :spacing="4" class="min-w-0" grow>
      <NvCard class="min-w-0" size="sm">
        <NvGroup noWrap>
          <div
            class="overlayInput border rounded px-5 h-8 text-2 flex items-center text-gray-90 focused font-semibold"
            tabindex="-1"
          >
            <!--.overlayInput-->
            <div ref="keysWrapper" class="overlayInput__wrapper">
              <span
                ref="blankSpaceRef"
                :class="{ activeIndex: carretIndex === -1 }"
                :style="{
                  marginLeft: rem(-blankSpaceWidth),
                }"
                >&nbsp;</span
              >
              <span
                v-for="(key, i) in keys"
                :key="`${i}-${key}`"
                ref="keysRef"
                :class="{
                  activeIndex: carretIndex === i,
                  inSelection: selection[0] < i && i <= selection[1] && hasSelection,
                }"
                >{{ key }}</span
              >
              <template v-if="!value">
                <span
                  v-for="(key, i) in placeholder.split('')"
                  :key="`${i}-${key}`"
                  class="overlayInput__placeholder"
                  >{{ key }}</span
                >
              </template>
              <label class="hidden">
                <input ref="selectionValueRef" :value="selectionValue" type="text" />
              </label>
            </div>
          </div>
        </NvGroup>
      </NvCard>
    </NvGroup>
  </div>
</template>

<script lang="ts" setup>
import { NvCard, NvGroup } from '@packages/ui'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import {
  emitIPCSay,
  onIPCOverlayInputCharacter,
  onIPCOverlayInputCommand,
} from '@/electron/events/renderer'
import { useElementSize } from '@vueuse/core'
import { rem } from 'polished'

const { ElectronOverlayWindow, ElectronKeybinding } = window
const placeholder = ref('So, said the angel to the child who, divided, broke the knife..')
const carretIndex = ref(-1)
const selection = ref([-1, -1])
const settingsStore = useSettingsStore()

const hasSelection = computed(() => selection.value[1] - selection.value[0] > 0)

const keys = ref([])
const value = computed(() => keys.value.join(''))
const keysRef = ref<Element[]>([])
const blankSpaceRef = ref()
const selectionValueRef = ref<HTMLInputElement>()
// private set keys(newValue) {
//   this.$emit('input', newValue.join(''));
// }
const { width: blankSpaceWidth } = useElementSize(blankSpaceRef)

// private set textValue(newValue: any) {
//   this.$emit('input', newValue);
// }

function insertKey(key: string) {
  if (!(key === ' ' && settingsStore.messageMode === 'word')) {
    let index
    if (hasSelection.value) {
      index = selection.value[0] + 1
    } else {
      index = carretIndex.value + 1
    }
    keys.value.splice(index, selection.value[1] - selection.value[0], key)
    // keys.value = flatten(keys.value)
    carretIndex.value = index
    selection.value = [index, index]
  }
  // this.$emit('keyup', { key })
}

function del() {
  let targetIndex
  if (hasSelection.value) {
    // eslint-disable-next-line prefer-destructuring
    targetIndex = selection.value[0]
    keys.value.splice(
      selection.value[0] + 1, // excludes the leftest letter
      selection.value[1] - selection.value[0],
    )
    // keys.value = keys.value
  } else {
    targetIndex = carretIndex.value > -1 ? carretIndex.value - 1 : -1
    keys.value.splice(carretIndex.value, selection.value[1] - selection.value[0] + 1)
    // keys.value = keys.value
  }
  carretIndex.value = targetIndex
  selection.value = [targetIndex, targetIndex]
}

function cut() {
  if (hasSelection.value) {
    copy()
    del()
  }
}

function copy() {
  if (hasSelection.value) {
    ElectronKeybinding.copyToClipboard(selectionValueRef.value?.value || '')
    // Platform.commit('services/clipboard/copy', selectionValue.value)
    selectionValueRef.value?.select()
  }
}

function paste(text: any = '') {
  if (text) {
    insertKey(text.split(''))
    carretIndex.value += text.length
    selection.value = [carretIndex.value + text.length, carretIndex.value + text.length]
  } else {
    ElectronKeybinding.readFromClipboard().then((clipboardContent: string) => {
      if (clipboardContent) {
        clipboardContent.split('').forEach((character: string) => {
          insertKey(character)
        })
        carretIndex.value += text.length
        selection.value = [carretIndex.value, carretIndex.value]
      }
    })
    // Platform.dispatch('services/clipboard/paste')
    //   .then((value: any) => {
    //     if (value) {
    //       insertKey(value.split(''))
    //       carretIndex.value = carretIndex.value + value.length - 1
    //       selection.value = [carretIndex.value, carretIndex.value]
    //     }
    //   })
    //   .catch((err: any) => console.log(err))
  }
}

function suppr() {
  if (hasSelection.value) {
    keys.value.splice(selection.value[0] + 1, selection.value[1] - selection.value[0])
  } else {
    keys.value.splice(carretIndex.value + 1, selection.value[1] - selection.value[0] + 1)
  }
  // eslint-disable-next-line prefer-destructuring
  carretIndex.value = selection.value[0]
  selection.value = [selection.value[0], selection.value[0]]
}

function moveCaretLeft() {
  if (carretIndex.value > -1 && !hasSelection.value) {
    carretIndex.value -= 1
  } else if (hasSelection.value) {
    // eslint-disable-next-line prefer-destructuring
    carretIndex.value = selection.value[0]
  }
  selection.value = [carretIndex.value, carretIndex.value]
}

function moveCaretRight() {
  if (carretIndex.value < keys.value.length - 1 && !hasSelection.value) {
    carretIndex.value += 1
  } else if (hasSelection.value) {
    // eslint-disable-next-line prefer-destructuring
    carretIndex.value = selection.value[1]
  }
  selection.value = [carretIndex.value, carretIndex.value]
}

function moveCaretFarLeft() {
  carretIndex.value = -1
  selection.value = [-1, -1]
}

function moveCaretFarRight() {
  carretIndex.value = keys.value.length - 1
  selection.value = [keys.value.length - 1, keys.value.length - 1]
}

function moveSelectionLeft() {
  // if hasSelection and carret in last position of selection, reduce selection
  if (hasSelection.value && carretIndex.value === selection.value[1]) {
    carretIndex.value -= 1
    selection.value = [selection.value[0], carretIndex.value]
  }
  // else increase selection
  else if (carretIndex.value > -1) {
    carretIndex.value -= 1
    selection.value = [selection.value[0] - 1, selection.value[1]]
  }
}

function moveSelectionRight() {
  // if hasSelection and carret in first position of selection, reduce selection
  if (hasSelection.value && carretIndex.value === selection.value[0]) {
    carretIndex.value += 1
    selection.value = [carretIndex.value, selection.value[1]]
  }
  // else increase selection
  else if (carretIndex.value < keys.value.length - 1) {
    carretIndex.value += 1
    selection.value = [selection.value[0], selection.value[1] + 1]
  }
}

function spaceLetter() {
  insertKey(' ')
}

function selectAll() {
  carretIndex.value = keys.value.length - 1
  selection.value = [-1, keys.value.length - 1]
}

function validateMessage() {
  if (value.value) {
    emitIPCSay(value.value)
    keys.value = []
    if (settingsStore.hideWindowOnMessage) {
      ElectronOverlayWindow.hide()
    }
  } else {
    ElectronOverlayWindow.hide()
  }
}

const commands = {
  delete: del,
  suppr,
  spaceLetter,
  moveCaretLeft,
  moveCaretRight,
  moveSelectionLeft,
  moveSelectionRight,
  selectAll,
  cut,
  copy,
  paste,
  validateMessage,
}

function addListeners() {
  onIPCOverlayInputCharacter((key: keyof typeof commands) => {
    if (commands[key]) {
      commands[key]()
    } else {
      insertKey(key)
    }
  })
  onIPCOverlayInputCommand(([command, ...args]) => {
    if (commands[command as keyof typeof commands]) {
      commands[command as keyof typeof commands](...args)
    }
  })
}

const selectionValue = computed(() =>
  keys.value.slice(selection.value[0] + 1, selection.value[1] + 1).join(''),
)

onMounted(() => {
  addListeners()
})

watch(value, () => {
  if (value.value === '') {
    carretIndex.value = -1
    selection.value = [-1, -1]
  }
})

watch(carretIndex, () => {
  if (carretIndex.value >= 0) {
    nextTick(() => {
      if (keysRef.value[carretIndex.value])
        keysRef.value[carretIndex.value].scrollIntoView({
          inline: 'end',
        })
    })
  }
})
</script>

<style lang="scss" scoped>
@keyframes caret {
  50% {
    background-color: transparent;
  }
}

.overlayInput {
  text-transform: initial;
  width: 100%;
  align-items: center;
  white-space: nowrap;

  input {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
    border: 0;
    opacity: 0;
    padding: 0;
    margin: 0;
    box-shadow: none;
    transform: translate(-100%, -100%);
    outline: 0 !important;
  }

  span {
    white-space: pre;
    position: relative;
    z-index: 0;
    padding-right: 1px;
    letter-spacing: -1px;
    display: inline-block;

    &.activeIndex {
      &:after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 1px;
        background-color: #2b2b2c;
        animation: caret 1s steps(1) infinite;
        z-index: 100000;
      }
    }

    &.inSelection {
      background-color: #444444;
      color: #ffffff;
    }
  }

  .overlayInput__placeholder {
    color: #bebebe;
    opacity: 0.7;
  }

  .overlayInput__wrapper {
    width: 100%;
    overflow: hidden;
  }
}
</style>
