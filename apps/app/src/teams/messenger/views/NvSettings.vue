<template>
  <NvCard
    variant="transparent"
    id="settings"
    ref="settings"
    class="settings"
    :class="
      css({
        position: 'relative',
        borderRadius: 'md',
        padding: '4',
        overflow: 'hidden',
      })
    "
  >
    <div
      :class="
        css({
          display: 'flex',
          flexDirection: 'column',
          '& > :not([hidden]) ~ :not([hidden])': {
            marginTop: '4',
            marginBottom: '0',
          },
          height: '100%',
        })
      "
    >
      <!-- Top -->
      <div
        :class="
          css({
            display: 'flex',
            justifyContent: 'space-between',
            '& > :not([hidden]) ~ :not([hidden])': {
              marginLeft: '4',
              marginRight: '0',
            },
          })
        "
      >
        <div :class="css({ flexGrow: 1 })">
          <template v-if="messengerStateStore.markForRestart && !isGameOverlay">
            <NvCard
              class="settings__message"
              :class="css({ paddingLeft: '2' })"
              size="xs"
            >
              <div :class="css({ paddingLeft: '4' })">
                <NvMarkForRestartMessage />
              </div>
            </NvCard>
          </template>
        </div>
        <NvCard :class="css({ display: 'inline-flex' })" size="sm">
          <div
            :class="
              css({
                display: 'inline-flex',
                '& > :not([hidden]) ~ :not([hidden])': {
                  marginLeft: '2',
                  marginRight: '0',
                },
              })
            "
          >
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
      <div :class="css({ flex: '1 1 0%', position: 'relative' })">
        <div :class="css({ position: 'absolute', inset: '0' })">
          <div :class="css({ display: 'flex', height: '100%' })">
            <div class="settings__sidebar">
              <!-- Side Nav -->
              <NvStack spacing="6">
                <template v-for="category in navigation" :key="category.name">
                  <NvStack>
                    <NvText
                      v-if="category.name"
                      :class="css({ marginInline: '3' })"
                      type="subtitle"
                    >
                      {{ category.name }}
                    </NvText>
                    <NvStack spacing="2">
                      <template
                        v-for="entry in category.children"
                        :key="entry.name"
                      >
                        <router-link
                          :to="entry.to || { name: 'settings' }"
                          :class="css({ width: '100%' })"
                        >
                          <NvButton
                            :selected="currentRoute.name === entry.to?.name"
                            :class="css({ width: '100%' })"
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
            <div
              class="settings__content"
              :class="css({ flex: '1 1 0%', paddingLeft: '4' })"
            >
              <NvPortalTarget
                :class="
                  css({
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                  })
                "
              >
                <div :class="css({ height: '100%', position: 'relative' })">
                  <!-- View -->
                  <router-view v-slot="{ Component }">
                    <Transition
                      :class="
                        css({
                          transitionProperty:
                            'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
                          transitionTimingFunction:
                            'cubic-bezier(0.4, 0, 0.2, 1)',
                          transitionDuration: '150ms',
                        })
                      "
                    >
                      <div
                        :key="currentRoute.path"
                        :class="
                          css({
                            position: 'absolute',
                            inset: '0',
                            overflowY: 'auto',
                          })
                        "
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
      <NvStoreDialog :instance="instance" portal-target="#settings" />
    </template>
  </NvCard>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
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
