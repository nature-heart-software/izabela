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
                  @update:modelValue="
                    (value) =>
                      gameOverlayStore.$patch({
                        enableGameOverlay: value
                      })
                  "
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
                  <NvDivider direction="horizontal" />
                  <div>
                    <NvButton size="sm" @click="addToAllowlist('')">Add path</NvButton>
                  </div>
                  <NvDivider v-if="allowlist.length" direction="horizontal" />
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
                </NvStack>
              </NvCard>
              <NvCard>
                <NvStack spacing="5">
                  <NvText type="label">Denylist</NvText>
                  <NvDivider direction="horizontal" />
                  <div>
                    <NvButton size="sm" @click="addToDenylist('')">Add path</NvButton>
                  </div>
                  <NvDivider v-if="denylist.length" direction="horizontal" />
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

const gameOverlayStore = useGameOverlayStore()
const {
  addToAllowlist,
  removeFromAllowlist,
  updateAllowlistItem,
  addToDenylist,
  removeFromDenylist,
  updateDenylistItem,
} = gameOverlayStore
const { allowlist, denylist } = storeToRefs(gameOverlayStore)
</script>
