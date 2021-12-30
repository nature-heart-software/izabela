<template>
  <div class="messenger bg-gray-10/90 rounded grid p-3 gap-3 grid-rows-3 grid-rows-none">
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
        <nv-button size="sm">TTS API</nv-button>
        <nv-button size="sm">API Voice</nv-button>
        <nv-button size="sm">Output</nv-button>
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
      <nv-card size="sm">
        <nv-button class="w-full" size="lg"
          >So, said the angel to the child who, divided, broke the knife..
        </nv-button>
        <!-- <label for="input">
          <input id="input" ref="input" @click="$event.target.focus()" />
        </label> -->
      </nv-card>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { NvCard, NvButton } from '@/core/components'
import NvDivider from '@/core/components/Divider/NvDivider.vue'

const { ElectronMessengerWindow } = window

export default defineComponent({
  name: 'nv-messenger',
  components: {
    NvDivider,
    NvCard,
    NvButton,
  },
  setup() {
    return {
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
