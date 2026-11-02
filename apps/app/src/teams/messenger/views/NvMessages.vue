<template>
  <NvCard
    variant="transparent"
    class="settings"
    :class="
      css({
        borderRadius: 'md',
        padding: '4',
        display: 'flex',
        flexDirection: 'column',
        '& > :not([hidden]) ~ :not([hidden])': {
          marginTop: '4',
          marginBottom: '0',
        },
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
      <div></div>
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
                  <NvText :class="css({ marginInline: '3' })" type="subtitle">
                    {{ category.name }}
                  </NvText>
                  <NvStack spacing="2">
                    <template
                      v-for="entry in category.children"
                      :key="entry.name"
                    >
                      <router-link
                        :to="entry.to || { name: 'messages' }"
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
                      :key="Component"
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
  </NvCard>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
import { NvButton, NvStack, NvText, NvCard, NvTooltip } from '@packages/ui'
import { useRoute } from 'vue-router'
import NvPortalTarget from '@/teams/messenger/components/NvPortalTarget.vue'

const navigation = [
  {
    name: 'Messages',
    children: [
      {
        name: 'History',
        to: { name: 'messages-history' },
      },
      {
        name: 'Shortcuts',
        to: { name: 'messages-shortcuts' },
      },
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
