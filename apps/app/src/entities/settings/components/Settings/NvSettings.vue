<template>
  <div class="settings bg-gray-10/90 rounded p-4 flex flex-col space-y-4">
    <!-- Top -->
    <div class="flex justify-between space-x-4">
      <div></div>
      <nv-card size="sm" class="inline-flex">
        <div class="inline-flex space-x-2">
          <nv-button size="xs" type="plain" icon-name="times" />
        </div>
      </nv-card>
    </div>
    <div class="flex-1 relative">
      <div class="absolute inset-0">
        <div class="flex h-full">
          <div class="settings__sidebar">
            <!-- Side Nav -->
          </div>
          <div class="settings__content flex-1">
            <!-- View -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { NvCard, NvButton } from '@/core/components'

export default defineComponent({
  name: 'nv-settings',
  components: {
    NvCard,
    NvButton,
  },
  methods: {
    toggleSettings() {
      console.log('hello')
    },
  },
})
</script>
<style lang="scss" scoped>
.settings {
  width: 768px;
  height: 500px;

  .settings__sidebar {
    width: 150px;
  }
}
</style>
<style lang="scss">
.tippy-box[data-theme='settings'] {
  background-color: transparent;

  .tippy-content {
    padding: 0;
  }
}
</style>
