<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Game Overlay</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack :class="css({ width: '100%' })">
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
            <NvGroup v-if="gameOverlayStore.enableExperimentalGameOverlay">
              <NvButton
                size="sm"
                :loading="defenderBusy"
                :disabled="defenderBusy"
                data-overlay-defender-exclusions
                @click="configureDefender"
                >Add Windows Defender exclusions</NvButton
              >
            </NvGroup>
            <NvDialog v-model:open="defenderOpen" portal-target="#settings">
              <template #title>Windows Defender exclusions</template>
              <template #description>
                <NvText data-overlay-defender-dialog
                  >The game overlay injector may be flagged as malware by
                  Microsoft Defender. Would you like to add its files to
                  Microsoft Defender’s exclusion list?</NvText
                >
              </template>
              <template #footer>
                <NvGroup justify="right">
                  <NvButton
                    type="plain"
                    autofocus
                    data-overlay-defender-cancel
                    @click="defenderOpen = false"
                    >Cancel</NvButton
                  >
                  <NvButton
                    data-overlay-defender-confirm
                    :disabled="defenderBusy || !defenderPlan"
                    @click="confirmDefender"
                    >Add exclusions</NvButton
                  >
                </NvGroup>
              </template>
            </NvDialog>
            <NvText v-if="defenderMessage" role="status">{{
              defenderMessage
            }}</NvText>
          </NvStack>
        </NvCard>
        <div :class="css({ paddingLeft: '8' })">
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
                  <NvGroup spacing="4">
                    <NvButton size="sm" @click="addToAllowlist('')"
                      >Add path
                    </NvButton>
                    <NvOverlayProcessPicker
                      v-model="allowlist"
                      list-name="Allowlist"
                    />
                  </NvGroup>
                  <NvDivider v-if="allowlist.length" direction="horizontal" />
                  <template v-for="(path, i) in allowlist" :key="i">
                    <NvGroup :class="css({ width: '100%' })" grow>
                      <NvInput
                        :modelValue="path"
                        @update:modelValue="
                          (value) => updateAllowlistItem(i, value)
                        "
                      />
                      <NvButton
                        :class="css({ flexGrow: '0 !important' })"
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
                    <NvGroup :class="css({ width: '100%' })" grow>
                      <NvInput :modelValue="path" />
                    </NvGroup>
                  </template>
                </NvStack>
              </NvCard>
              <NvCard>
                <NvStack spacing="5">
                  <NvText type="label">Denylist</NvText>
                  <NvDivider direction="horizontal" />
                  <NvGroup spacing="4">
                    <NvButton size="sm" @click="addToDenylist('')"
                      >Add path
                    </NvButton>
                    <NvOverlayProcessPicker
                      v-model="denylist"
                      list-name="Denylist"
                    />
                  </NvGroup>
                  <NvDivider v-if="denylist.length" direction="horizontal" />
                  <template v-for="(path, i) in denylist" :key="i">
                    <NvGroup :class="css({ width: '100%' })" grow>
                      <NvInput
                        :modelValue="path"
                        @update:modelValue="
                          (value) => updateDenylistItem(i, value)
                        "
                      />
                      <NvButton
                        :class="css({ flexGrow: '0 !important' })"
                        icon-name="times"
                        size="xs"
                        type="plain"
                        @click="removeFromDenylist(i)"
                      />
                    </NvGroup>
                  </template>
                  <template
                    v-for="(path, i) in gameOverlayDenylistData"
                    :key="`database-deny-${i}`"
                  >
                    <NvGroup :class="css({ width: '100%' })" grow>
                      <NvInput :modelValue="path" readonly />
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
import { css } from '@/styled-system/css'
import {
  NvButton,
  NvCard,
  NvDivider,
  NvDialog,
  NvGroup,
  NvInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { storeToRefs } from 'pinia'
import { useGameOverlayStore } from '@/features/game-overlay/store'
import { useDatabasesStore } from '@/features/databases/store'
import { computed, ref, watch } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import { useConfirmAdmin } from '@/hooks/use-confirm-admin.ts'
import { useMessengerStateStore } from '@/teams/messenger/store'
import NvOverlayProcessPicker from './NvOverlayProcessPicker.vue'

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
const gameOverlayDenylistData = computed(
  () => data.value['game-overlay-denylist'] || [],
)

const confirmAdmin = useConfirmAdmin()
const settingsStore = useSettingsStore()
const messengerStateStore = useMessengerStateStore()
const defenderBusy = ref(false)
const defenderMessage = ref('')
const defenderOpen = ref(false)
const defenderPlan = ref<{ token: string }>()
watch(defenderOpen, (open) => {
  if (!open) defenderPlan.value = undefined
})
const configureDefender = async () => {
  if (defenderBusy.value || defenderOpen.value) return
  defenderBusy.value = true
  defenderMessage.value = ''
  try {
    const result =
      await window.ElectronResources.prepareOverlayInjectorDefenderExclusions()
    if (result.status === 'ready') {
      defenderPlan.value = result
      defenderOpen.value = true
    } else defenderMessage.value = result.message
  } catch {
    defenderMessage.value =
      'Windows Defender exclusions could not be configured.'
  } finally {
    defenderBusy.value = false
  }
}
const confirmDefender = async () => {
  if (defenderBusy.value || !defenderPlan.value) return
  const { token } = defenderPlan.value
  defenderBusy.value = true
  defenderOpen.value = false
  try {
    const result =
      await window.ElectronResources.addOverlayInjectorDefenderExclusions(token)
    defenderMessage.value = result.message || ''
  } catch {
    defenderMessage.value =
      'Windows Defender exclusions could not be configured.'
  } finally {
    defenderBusy.value = false
  }
}

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
  gameOverlayStore.$patch({
    enableExperimentalGameOverlay: value,
    ...(value ? { enableGameOverlay: false } : {}),
  })
  messengerStateStore.$patch({ markForRestart: true })
}
</script>
