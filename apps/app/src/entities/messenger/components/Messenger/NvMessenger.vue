<template>
  <div class="messenger bg-gray-10/90 rounded grid p-4 gap-4 grid-rows-3 grid-rows-none">
    <!-- Top -->
    <div class="flex space-x-4">
      <nv-button type="plain" icon-name="info" />
      <nv-card size="xs">
        <div class="inline-flex space-x-2">
          <nv-button size="sm" icon-name="github-alt" />
          <nv-button size="sm" icon-name="twitter-alt" />
          <nv-button size="sm" icon-name="discord" />
        </div>
      </nv-card>
      <div class="flex flex-1 justify-end space-x-4">
        <nv-card size="xs" class="flex-1 min-h-8">
          <div class="inline-flex space-x-2">
            <template v-if="$store.state.env === 'development'">
              <nv-button size="sm" icon-name="redo" @click="reload" />
              <nv-button size="sm" icon-name="brackets-curly" @click="openDevTools" />
            </template>
          </div>
        </nv-card>
        <nv-card size="xs">
          <div class="inline-flex space-x-2">
            <nv-button size="sm" icon-name="setting" />
          </div>
        </nv-card>
        <nv-card size="sm" class="inline-flex">
          <div class="inline-flex space-x-2">
            <!-- <nv-button size="xs" type="plain" icon-name="minus"/>
            <nv-button size="xs" type="plain" icon-name="square-full"/> -->
            <nv-button size="xs" type="plain" icon-name="times" @click="hide" />
          </div>
        </nv-card>
      </div>
    </div>

    <!-- Middle -->
    <div class="flex justify-between">
      <nv-card size="sm" class="inline-flex items-center space-x-3">
        <nv-button size="sm" icon-name="setting" />
        <nv-divider direction="vertical" class="h-3" />
        <nv-select class="w-12" size="sm" icon-name="direction" placeholder="TTS API"></nv-select>
        <nv-select class="w-12" size="sm" icon-name="direction" placeholder="API Voice"></nv-select>
        <nv-divider direction="vertical" class="h-3" />
        <nv-button size="sm" icon-name="direction">Outputs</nv-button>
        <nv-button size="sm" icon-name="direction">Input</nv-button>
        <nv-divider direction="vertical" class="h-3" />
        <nv-button size="sm" icon-name="question-circle" />
      </nv-card>
      <nv-card size="sm" class="inline-flex items-center space-x-3">
        <nv-button size="sm" type="plain">Sentence</nv-button>
        <nv-button size="sm">Word</nv-button>
        <nv-divider direction="vertical" class="h-3" />
        <nv-button size="sm" icon-name="question-circle" />
      </nv-card>
    </div>

    <!-- Bottom -->
    <div>
      <nv-card size="sm" class="flex space-x-3">
        <nv-input
          placeholder="So, said the angel to the child who, divided, broke the knife.."
          size="lg"
          class="w-full"
          v-model="inputValue"
          @keydown.enter="inputValue = ''"
        />
        <nv-button size="lg" icon-name="message" @click="inputValue = ''" />
      </nv-card>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { NvCard, NvButton, NvSelect } from '@/core/components'
import NvDivider from '@/core/components/Divider/NvDivider.vue'
import NvInput from '@/core/components/Input/NvInput.vue'

const { ElectronMessengerWindow } = window

export default defineComponent({
  name: 'nv-messenger',
  components: {
    NvInput,
    NvDivider,
    NvCard,
    NvButton,
    NvSelect,
  },
  setup() {
    return {
      inputValue: ref(''),
      openDevTools() {
        ElectronMessengerWindow.openDevTools()
      },
      hide() {
        ElectronMessengerWindow.hide()
      },
      reload() {
        window.location.reload()
      },
    }
  },
})
</script>
<style lang="scss" scoped>
.messenger {
  min-width: 768px;
}
</style>
