<template>
  <dom-boundary class="settings bg-gray-10/90 rounded p-4 flex flex-col space-y-4">
    <!-- Top -->
    <div class="flex justify-between space-x-4">
      <div></div>
      <nv-card size="sm" class="inline-flex">
        <div class="inline-flex space-x-2">
          <nv-button @click="$emit('close')" size="xs" type="plain" icon-name="times"/>
        </div>
      </nv-card>
    </div>
    <div class="flex-1 relative">
      <div class="absolute inset-0">
        <div class="flex h-full">
          <div class="settings__sidebar">
            <!-- Side Nav -->
            <nv-stack spacing="6">
              <template v-for="category in navigation" :key="category.name">
                <nv-stack>
                  <nv-text type="subtitle" class="mx-3">
                    {{ category.name }}
                  </nv-text>
                  <nv-stack spacing="2">
                    <template v-for="entry in category.children" :key="entry.name">
                      <nv-button size="sm" type="ghost-alt" :selected="selectedEntry === entry.name"
                                 @click="selectedEntry = entry.name">{{
                          entry.name
                        }}
                      </nv-button>
                    </template>
                  </nv-stack>
                </nv-stack>
              </template>
            </nv-stack>
          </div>
          <div class="settings__content flex-1">
            <!-- View -->
          </div>
        </div>
      </div>
    </div>
  </dom-boundary>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { NvCard, NvButton, NvStack, NvText } from '@/core/components'
import DomBoundary from '@/modules/vue-dom-boundaries/DomBoundary.vue'

export default defineComponent({
  name: 'nv-settings',
  components: {
    NvCard,
    NvButton,
    NvStack,
    NvText,
    DomBoundary,
  },
  methods: {
    toggleSettings() {
      console.log('hello')
    },
  },
  setup() {
    const selectedEntry = ref('Overview')
    const navigation = [
      {
        name: 'Application',
        children: [
          {
            name: 'Overview',
          },
          {
            name: 'Speech',
          },
          {
            name: 'Audio',
          },
          {
            name: 'Overlay',
          },
          {
            name: 'Dictionary',
          },
          {
            name: 'Keybinds',
          },
          {
            name: 'Startup',
          },
          {
            name: 'Performance',
          },
        ],
      },
      {
        name: 'Other',
        children: [
          {
            name: 'About',
          },
          { name: 'Support' },
        ],
      },
    ]
    return {
      navigation,
      selectedEntry,
    }
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
  color: inherit;
  background-color: transparent;

  .tippy-content {
    padding: 0;
  }
}
</style>
