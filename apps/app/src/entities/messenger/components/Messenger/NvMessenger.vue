<template>
  <div class="messenger bg-gray-10/90 rounded grid p-3 gap-3 grid-rows-3 grid-rows-none">
    <div class="flex space-x-3">
      <nv-button type="plain" icon-name="info"/>
      <nv-card>
          <div class="inline-flex space-x-2 -m-1">
            <nv-button size="sm" icon-name="github-alt"/>
            <nv-button size="sm" icon-name="twitter-alt"/>
            <nv-button size="sm" icon-name="discord"/>
          </div>
      </nv-card>
      <div class="flex flex-1 justify-end space-x-3">
        <nv-card class="flex-1 min-h-8">
          <div class="inline-flex space-x-2">
          </div>
        </nv-card>
        <nv-card class="inline-flex">
          <div class="inline-flex space-x-2">
            <nv-button size="xs" type="plain" icon-name="minus"/>
            <nv-button size="xs" type="plain" icon-name="square-full"/>
            <nv-button size="xs" type="plain" icon-name="times"/>
          </div>
        </nv-card>
      </div>
    </div>
    <div class="flex justify-between">
      <nv-card class="inline-flex space-x-3">
        <nv-button size="sm" icon-name="setting" />
        <nv-button size="sm">TTS API</nv-button>
        <nv-button size="sm">API Voice</nv-button>
        <nv-button size="sm">Output</nv-button>
        <nv-button size="sm" icon-name="question-circle" />
      </nv-card>
      <nv-card class="inline-flex space-x-3">
        <nv-button size="sm" type="plain">Sentence</nv-button>
        <nv-button size="sm">Word</nv-button>
        <nv-button size="sm" icon-name="question-circle" />
      </nv-card>
    </div>
    <div>
      <nv-card>
        <nv-button class="w-full" size="lg">So, said the angel to the child who,
           divided, broke the knife..</nv-button>
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

export default defineComponent({
  name: 'nv-messenger',
  components: {
    NvCard,
    NvButton,
  },
})
</script>
<style lang="scss" scoped>
.messenger {
  min-width: 768px;
}
</style>
