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
                  role="switch"
                  aria-label="Enable Game Overlay"
                  :aria-checked="gameOverlayStore.enableGameOverlay"
                  :modelValue="gameOverlayStore.enableGameOverlay"
                  @update:modelValue="setGameOverlay"
                  @keydown.space.prevent="
                    setGameOverlay(!gameOverlayStore.enableGameOverlay)
                  "
                  @keydown.enter.prevent="
                    setGameOverlay(!gameOverlayStore.enableGameOverlay)
                  "
                />
              </NvGroup>
              <NvText
                >Open an overlay instead of a window whenever a game is focused
              </NvText>
            </NvStack>
          </NvGroup>
        </NvCard>
        <NvCard>
          <NvStack>
            <NvGroup justify="apart">
              <NvText type="label">Enable Experimental Game Overlay</NvText>
              <NvSwitch
                role="switch"
                aria-label="Enable Experimental Game Overlay"
                :aria-checked="gameOverlayStore.enableExperimentalGameOverlay"
                :modelValue="gameOverlayStore.enableExperimentalGameOverlay"
                @update:modelValue="setExperimentalGameOverlay"
                @keydown.space.prevent="
                  setExperimentalGameOverlay(
                    !gameOverlayStore.enableExperimentalGameOverlay,
                  )
                "
                @keydown.enter.prevent="
                  setExperimentalGameOverlay(
                    !gameOverlayStore.enableExperimentalGameOverlay,
                  )
                "
              />
            </NvGroup>
          </NvStack>
        </NvCard>
        <div class="pl-8">
          <NvStack spacing="4">
            <template
              v-if="
                gameOverlayStore.enableGameOverlay ||
                gameOverlayStore.enableExperimentalGameOverlay
              "
            >
              <NvCard>
                <NvStack spacing="5">
                  <NvText type="label">Allowlist</NvText>
                  <NvDivider direction="horizontal" />
                  <div>
                    <NvButton size="sm" @click="addToAllowlist('')"
                      >Add path
                    </NvButton>
                  </div>
                  <NvDivider v-if="allowlist.length" direction="horizontal" />
                  <template v-for="(path, i) in allowlist" :key="i">
                    <NvGroup class="w-full" grow>
                      <NvInput
                        :modelValue="path"
                        @update:modelValue="
                          (value) => updateAllowlistItem(i, value)
                        "
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
                  <template
                    v-for="(path, i) in gameOverlayAllowlistData"
                    :key="i"
                  >
                    <NvGroup class="w-full" grow>
                      <NvInput :modelValue="path" />
                    </NvGroup>
                  </template>
                </NvStack>
              </NvCard>
              <NvCard>
                <NvStack spacing="5">
                  <NvText type="label">Denylist</NvText>
                  <NvDivider direction="horizontal" />
                  <div>
                    <NvButton size="sm" @click="addToDenylist('')"
                      >Add path
                    </NvButton>
                  </div>
                  <NvDivider v-if="denylist.length" direction="horizontal" />
                  <template v-for="(path, i) in denylist" :key="i">
                    <NvGroup class="w-full" grow>
                      <NvInput
                        :modelValue="path"
                        @update:modelValue="
                          (value) => updateDenylistItem(i, value)
                        "
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
import {
  NvButton,
  NvCard,
  NvDivider,
  NvGroup,
  NvInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { storeToRefs } from 'pinia'
import { useGameOverlayStore } from '@/features/game-overlay/store'
import { useDatabasesStore } from '@/features/databases/store'
import { computed } from 'vue'
import { useConfirmStore } from '@/store/use-confirm-store.ts'
import { useSettingsStore } from '@/features/settings/store'
import { useConfirmAdmin } from '@/hooks/use-confirm-admin.ts'
import { useMessengerStateStore } from '@/teams/messenger/store'

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
const gameOverlayAllowlistData = computed(
  () => data.value['game-overlay-allowlist'] || [],
)

const confirmAdmin = useConfirmAdmin()
const settingsStore = useSettingsStore()
const messengerStateStore = useMessengerStateStore()

const setGameOverlay = (value: boolean) => {
  if (value) {
    confirmAdmin().then(({ type, close }) => {
      if (type === 'confirm') {
        gameOverlayStore.$patch({
          enableGameOverlay: value,
          enableExperimentalGameOverlay: false,
        })
        messengerStateStore.$patch({ markForRestart: true })
        settingsStore.enableRunAsAdmin()
      }
      close()
    })
  } else {
    gameOverlayStore.$patch({ enableGameOverlay: value })
    messengerStateStore.$patch({ markForRestart: true })
  }
}

const setExperimentalGameOverlay = (value: boolean) => {
  if (value) settingsStore.disableRunAsAdmin()
  gameOverlayStore.$patch({
    enableExperimentalGameOverlay: value,
    ...(value ? { enableGameOverlay: false } : {}),
  })
  messengerStateStore.$patch({ markForRestart: true })
}
</script>
