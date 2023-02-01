<template>
  <div class="settings bg-gray-10/95 rounded p-4 flex flex-col space-y-4">
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
                  <NvText v-if="category.name" class="mx-3" type="subtitle">
                    {{ category.name }}
                  </NvText>
                  <NvStack spacing="2">
                    <template v-for="entry in category.children" :key="entry.name">
                      <router-link :to="entry.to || { name: 'settings' }" class="w-full">
                        <NvButton
                          :selected="currentRoute.name === entry.to?.name"
                          class="w-full"
                          size="sm"
                          type="ghost-alt"
                          >{{ entry.name }}
                        </NvButton>
                      </router-link>
                    </template>
                  </NvStack>
                </NvStack>
              </template>
            </NvStack>
          </div>
          <div class="settings__content flex-1 pl-4">
            <div class="h-full relative">
              <!-- View -->
              <router-view v-slot="{ Component }">
                <Transition class="transition">
                  <div :key="Component" class="absolute inset-0 overflow-y-auto">
                    <component :is="Component" />
                  </div>
                </Transition>
              </router-view>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvStack, NvText } from '@packages/ui'
import { useRoute } from 'vue-router'

const navigation = [
  {
    name: 'Application',
    children: [
      {
        name: 'General',
        to: { name: 'settings-general' },
      },
    ],
  },
  {
    name: 'Speech',
    children: [
      {
        name: 'Engine',
        to: { name: 'settings-engine' },
      },
      {
        name: 'Audio',
        to: { name: 'settings-audio' },
      },
      {
        name: 'Dictionary',
        to: { name: 'settings-dictionary' },
      },
      {
        name: 'Commands',
        to: { name: 'settings-commands' },
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
const currentRoute = useRoute()
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
