<template>
  <DomBoundary class="settings bg-gray-10/95 rounded p-4 flex flex-col space-y-4">
    <!-- Top -->
    <div class="flex justify-between space-x-4">
      <div></div>
      <NvCard class="inline-flex" size="sm">
        <div class="inline-flex space-x-2">
          <NvButton icon-name="times" size="xs" type="plain" @click="$emit('close')" />
        </div>
      </NvCard>
    </div>
    <div class="flex-1 relative">
      <div class="absolute inset-0">
        <div class="flex h-full">
          <div class="settings__sidebar">
            <!-- Side Nav -->
            <NvStack spacing="6">
              <template v-for="category in navigation" :key="category.name">
                <NvStack>
                  <NvText class="mx-3" type="subtitle">
                    {{ category.name }}
                  </NvText>
                  <NvStack spacing="2">
                    <template v-for="entry in category.children" :key="entry.name">
                      <NvButton
                        :selected="selectedEntry === entry.name"
                        size="sm"
                        type="ghost-alt"
                        @click="selectedEntry = entry.name"
                        >{{ entry.name }}
                      </NvButton>
                    </template>
                  </NvStack>
                </NvStack>
              </template>
            </NvStack>
          </div>
          <div class="settings__content flex-1 pl-4">
            <div class="h-full relative">
              <!-- View -->
              <Transition class="transition">
                <div
                  v-if="currentEntry.component"
                  :key="currentEntry.component"
                  class="absolute inset-0 overflow-y-auto"
                >
                  <component :is="currentEntry.component" />
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DomBoundary>
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NvButton, NvCard, NvStack, NvText } from '@/core/components'
import DomBoundary from '@/modules/vue-dom-boundaries/DomBoundary.vue'
import SettingsOverview from '@/entities/settings/components/NvSettingsOverview.vue'
import SettingsAudio from '@/entities/settings/components/NvSettingsAudio.vue'
import SettingsSpeech from '@/entities/settings/components/NvSettingsSpeech.vue'

const navigation = [
  {
    name: 'Application',
    children: [
      {
        name: 'Overview',
        component: SettingsOverview,
      },
      {
        name: 'Speech',
        component: SettingsSpeech,
      },
      {
        name: 'Audio',
        component: SettingsAudio,
      },
      {
        name: 'Overlay',
      },
      {
        name: 'Dictionary',
      },
      {
        name: 'Keybindings',
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
const selectedEntry = ref('Overview')
const currentEntry = computed(() =>
  navigation.flatMap((i) => i.children).find((i) => i.name === selectedEntry.value),
)
</script>
<style lang="scss" scoped>
.settings {
  width: 768px;
  height: 500px;

  .settings__sidebar {
    width: 150px;
  }

  .settings__content {
    overflow-y: auto;
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
