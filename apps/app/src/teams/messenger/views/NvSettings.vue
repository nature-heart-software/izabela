<template>
  <NvCard
    variant="transparent"
    id="settings"
    ref="settings"
    class="settings relative rounded p-4 overflow-hidden"
  >
    <div class="flex flex-col space-y-4 h-full">
      <!-- Top -->
      <div class="flex justify-between space-x-4">
        <div class="grow">
          <template v-if="messengerStateStore.markForRestart && !isGameOverlay">
            <NvCard class="settings__message pl-2" size="xs">
              <div class="pl-4">
                <NvMarkForRestartMessage />
              </div>
            </NvCard>
          </template>
        </div>
        <NvCard class="inline-flex" size="sm">
          <div class="inline-flex space-x-2">
            <NvTooltip>
              <NvText>Close</NvText>
              <template #reference>
                <NvButton
                  icon-name="times"
                  size="xs"
                  type="plain"
                  @click="$emit('close')"
                />
              </template>
            </NvTooltip>
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
                      <template
                        v-for="entry in category.children"
                        :key="entry.name"
                      >
                        <router-link
                          :to="entry.to || { name: 'settings' }"
                          class="w-full"
                        >
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
              <NvPortalTarget class="h-full relative overflow-hidden">
                <div class="h-full relative">
                  <!-- View -->
                  <router-view v-slot="{ Component }">
                    <Transition class="transition">
                      <div
                        :key="Component"
                        class="absolute inset-0 overflow-y-auto"
                      >
                        <component :is="Component" />
                      </div>
                    </Transition>
                  </router-view>
                </div>
              </NvPortalTarget>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template v-for="instance in instances" :key="instance.id">
      <NvStoreDialog :instance="instance" />
    </template>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvStack, NvText, NvTooltip } from '@packages/ui'
import NvStoreDialog from '@/teams/messenger/components/NvStoreDialog.vue'
import { useRoute } from 'vue-router'
import { useConfirmStore } from '@/store/use-confirm-store.ts'
import { useMessengerStateStore } from '@/teams/messenger/store'
import { useSettingsStore } from '@/features/settings/store'
import NvMarkForRestartMessage from '@/teams/messenger/components/NvMarkForRestartMessage.vue'
import { isGameOverlay } from '@/consts.ts'
import { useGetAppInfoQuery } from '@/features/app/queries.ts'
import NvPortalTarget from '@/teams/messenger/components/NvPortalTarget.vue'
import { ref } from 'vue'

const settings = ref()
const settingsStore = useSettingsStore()
const navigation = [
  {
    name: 'Application',
    children: [
      {
        name: 'General',
        to: { name: 'settings-general' },
      },
      {
        name: 'Game Overlay',
        to: { name: 'settings-game-overlay' },
      },
    ],
  },
  {
    name: 'Speech',
    children: [
      {
        name: 'Speech Engine',
        to: { name: 'settings-engine' },
      },
      {
        name: 'Profiles',
        to: { name: 'settings-profiles' },
      },
      {
        name: 'Audio Ouputs',
        to: { name: 'settings-audio-outputs' },
      },
      {
        name: 'Audio Input',
        to: { name: 'settings-audio-input' },
      },
      {
        name: 'Translation',
        to: { name: 'settings-translation' },
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
        to: { name: 'settings-about' },
      },
      {
        name: settingsStore.theme === 'light' ? '🖤' : '🤍',
        to: { name: 'settings-support' },
      },
    ],
  },
]
const currentRoute = useRoute()
const { instances } = useConfirmStore()
const messengerStateStore = useMessengerStateStore()
</script>
<style lang="scss" scoped>
.settings {
  width: 768px;
  height: 500px;

  .settings__sidebar {
    width: 150px;
  }

  .settings__message {
    margin-left: 162px;
  }

  .settings__content {
    overflow-y: auto;
  }
}
</style>
