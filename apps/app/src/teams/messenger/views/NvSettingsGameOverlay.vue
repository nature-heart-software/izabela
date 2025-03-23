<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Game Overlay</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack class="w-full">
              <NvGroup justify="apart">
                <NvText type="label">Enable Game Overlay</NvText>
                <NvSwitch
                    :modelValue="gameOverlayStore.enableGameOverlay"
                    @update:modelValue='
                    (value) => {
                      if (value) {
                        confirm({
                          title: "Action required",
                          description: `This feature requires Administrator rights to function properly. Enabling this feature will also enable "Run as Administrator" and a restart will be required. Do you want to continue?`,
                          actions: [
                              {
                                type: "cancel",
                                label: "Cancel"
                              },
                              {
                                buttonProps: {
                                  type: "plain"
                                },
                                type: "confirm",
                                label: "Confirm"
                              },
                          ]
                        })
                          .then(({ type, close }) => {
                            if (type === "confirm") {
                              gameOverlayStore.$patch({
                                enableGameOverlay: value
                              })
                              settingsStore.enableRunAsAdmin()
                            }
                            close()
                          })
                        } else {
                          gameOverlayStore.$patch({
                            enableGameOverlay: value
                          })
                        }
                      }
                  '
                />
              </NvGroup>
              <NvText>Open an overlay instead of a window whenever a game is focused</NvText>
            </NvStack>
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvStack spacing="4">
            <template v-if="gameOverlayStore.enableGameOverlay">
              <NvCard>
                <NvStack spacing="5">
                  <NvText type="label">Allowlist</NvText>
                  <NvDivider direction="horizontal"/>
                  <div>
                    <NvButton size="sm" @click="addToAllowlist('')">Add path</NvButton>
                  </div>
                  <NvDivider v-if="allowlist.length" direction="horizontal"/>
                  <template v-for="(path, i) in allowlist" :key="i">
                    <NvGroup class="w-full" grow>
                      <NvInput
                          :modelValue="path"
                          @update:modelValue="(value) => updateAllowlistItem(i, value)"
                      />
                      <NvButton
                          class="!grow-0"
                          icon-name="times"
                          size="xs"
                          type="plain"
                          @click="removeFromAllowlist(i)"
                      />
                    </NvGroup>
                  </template>
                  <template v-for="(path, i) in gameOverlayAllowlistData" :key="i">
                    <NvGroup class="w-full" grow>
                      <NvInput
                          :modelValue="path"
                      />
                    </NvGroup>
                  </template>
                </NvStack>
              </NvCard>
              <NvCard>
                <NvStack spacing="5">
                  <NvText type="label">Denylist</NvText>
                  <NvDivider direction="horizontal"/>
                  <div>
                    <NvButton size="sm" @click="addToDenylist('')">Add path</NvButton>
                  </div>
                  <NvDivider v-if="denylist.length" direction="horizontal"/>
                  <template v-for="(path, i) in denylist" :key="i">
                    <NvGroup class="w-full" grow>
                      <NvInput
                          :modelValue="path"
                          @update:modelValue="(value) => updateDenylistItem(i, value)"
                      />
                      <NvButton
                          class="!grow-0"
                          icon-name="times"
                          size="xs"
                          type="plain"
                          @click="removeFromDenylist(i)"
                      />
                    </NvGroup>
                  </template>
                </NvStack>
              </NvCard>
            </template>
          </NvStack>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvDivider, NvGroup, NvInput, NvStack, NvSwitch, NvText } from '@packages/ui'
import { storeToRefs } from 'pinia'
import { useGameOverlayStore } from '@/features/game-overlay/store'
import { useDatabasesStore } from '@/features/databases/store'
import { computed } from 'vue'
import { useConfirmStore } from '@/store/use-confirm-store.ts'
import { useSettingsStore } from '@/features/settings/store'

const gameOverlayStore = useGameOverlayStore()
const databasesStore = useDatabasesStore()
const {
  addToAllowlist,
  removeFromAllowlist,
  updateAllowlistItem,
  addToDenylist,
  removeFromDenylist,
  updateDenylistItem,
} = gameOverlayStore
const { allowlist, denylist } = storeToRefs(gameOverlayStore)
const { data } = storeToRefs(databasesStore)
const gameOverlayAllowlistData = computed(() => data.value['game-overlay-allowlist'] || [])
const { confirm } = useConfirmStore()
const settingsStore = useSettingsStore()
</script>
