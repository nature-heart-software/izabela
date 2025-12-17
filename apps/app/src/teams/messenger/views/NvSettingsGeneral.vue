<template>
  <NvStack :spacing="6">
    <NvStack>
      <NvText type="subtitle">General</NvText>
      <NvCard>
        <NvStack :spacing="5">
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Monitor</NvText>
            </NvStack>
            <NvDisplaySelect />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Hide window after sending a message</NvText>
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.hideWindowOnMessage"
              @update:modelValue="
                (value) => settingsStore.$patch({ hideWindowOnMessage: value })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Hide window when clicking outside</NvText>
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.hideWindowOnClickOutside"
              @update:modelValue="
                (value) =>
                  settingsStore.$patch({ hideWindowOnClickOutside: value })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label"
                >Clear text input when the window hides</NvText
              >
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.clearMessageOnWindowHide"
              @update:modelValue="
                (value) =>
                  settingsStore.$patch({ clearMessageOnWindowHide: value })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Background dim opacity</NvText>
            </NvStack>
            <NvGroup>
              <NvRangeInput
                :modelValue="settingsStore.backgroundDimOpacity"
                max="100"
                min="0"
                step="1"
                @update:modelValue="
                  (value) =>
                    settingsStore.$patch({ backgroundDimOpacity: value })
                "
              />
              <NvNumberInput
                :modelValue="settingsStore.backgroundDimOpacity"
                max="100"
                min="0"
                step="1"
                @update:modelValue="
                  (value) =>
                    settingsStore.$patch({ backgroundDimOpacity: value })
                "
              />
            </NvGroup>
          </NvGroup>
        </NvStack>
      </NvCard>
    </NvStack>
    <NvStack>
      <NvText type="subtitle">Shortcuts</NvText>
      <NvCard>
        <NvStack :spacing="5">
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Show Messenger window</NvText>
            </NvStack>
            <NvKeybinding
              :modelValue="settingsStore.keybindings.toggleMessengerWindow"
              multiple
              @update:modelValue="
                (value) =>
                  settingsStore.$patch({
                    keybindings: { toggleMessengerWindow: value },
                  })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" align="start" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Show Messenger window (alternative)</NvText>
              <NvText
                >Alternate shortcut if the foreground application is preventing
                the window from showing normally
              </NvText>
            </NvStack>
            <NvKeybinding
              :modelValue="settingsStore.keybindings.toggleMessengerWindowAlt"
              multiple
              @update:modelValue="
                (value) =>
                  settingsStore.$patch({
                    keybindings: { toggleMessengerWindowAlt: value },
                  })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" align="start" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Enable Overlay window</NvText>
              <NvText
                >Allow to open a window that doesn't take focus away from the
                foreground application
              </NvText>
              <NvText type="caption"
                ><strong>NOTE:</strong> Keyboard support is limited.
              </NvText>
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.enableOverlayWindow"
              class="shrink-0"
              @update:modelValue="
                (value) => {
                  if (value) {
                    confirmAdmin().then(({ type, close }) => {
                      if (type === 'confirm') {
                        settingsStore.$patch({ enableOverlayWindow: value })
                        settingsStore.enableRunAsAdmin()
                      }
                      close()
                    })
                  } else {
                    settingsStore.$patch({ enableOverlayWindow: value })
                  }
                }
              "
            />
          </NvGroup>
          <template v-if="settingsStore.enableOverlayWindow">
            <NvDivider direction="horizontal" />
            <NvGroup :spacing="5" class="pl-6" justify="apart" no-wrap>
              <NvStack>
                <NvText type="label">Show Overlay window</NvText>
              </NvStack>
              <NvKeybinding
                :modelValue="settingsStore.keybindings.toggleOverlayWindow"
                multiple
                @update:modelValue="
                  (value) =>
                    settingsStore.$patch({
                      keybindings: { toggleOverlayWindow: value },
                    })
                "
              />
            </NvGroup>
          </template>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Cancel playing message</NvText>
            </NvStack>
            <NvKeybinding
              :modelValue="settingsStore.keybindings.cancelCurrentMessage"
              multiple
              @update:modelValue="
                (value) =>
                  settingsStore.$patch({
                    keybindings: { cancelCurrentMessage: value },
                  })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Cancel playing and queued messages</NvText>
            </NvStack>
            <NvKeybinding
              :modelValue="settingsStore.keybindings.cancelAllMessages"
              multiple
              @update:modelValue="
                (value) =>
                  settingsStore.$patch({
                    keybindings: { cancelAllMessages: value },
                  })
              "
            />
          </NvGroup>
        </NvStack>
      </NvCard>
    </NvStack>
    <NvStack>
      <NvText type="subtitle">Application</NvText>
      <NvCard>
        <NvStack :spacing="5">
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Theme</NvText>
            </NvStack>
            <NvSelect
              :modelValue="settingsStore.theme"
              :options="[
                {
                  label: 'Light',
                  value: 'light',
                },
                {
                  label: 'Dark',
                  value: 'dark',
                },
              ]"
              @update:modelValue="
                (value) => {
                  settingsStore.$patch({ theme: value })
                  messengerStateStore.$patch({
                    markForRestart: true,
                  })
                }
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Run as Administrator</NvText>
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.runAsAdmin"
              @update:modelValue="
                (value) => {
                  if (value) {
                    settingsStore.enableRunAsAdmin()
                  } else {
                    settingsStore.disableRunAsAdmin()
                  }
                }
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Launch on startup</NvText>
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.launchOnStartup"
              @update:modelValue="
                (value) => settingsStore.$patch({ launchOnStartup: value })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Enable Auto-update</NvText>
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.enableAutoUpdate"
              @update:modelValue="
                (value) =>
                  settingsStore.$patch({
                    enableAutoUpdate: value,
                  })
              "
            />
          </NvGroup>
          <template v-if="settingsStore.enableAutoUpdate">
            <NvDivider direction="horizontal" />
            <NvGroup :spacing="5" class="pl-6" justify="apart" no-wrap>
              <NvStack>
                <NvText type="label">Update channel</NvText>
              </NvStack>
              <NvUpdateChannelSelect
                :modelValue="settingsStore.updateChannel"
                @update:modelValue="
                  (value) => settingsStore.$patch({ updateChannel: value })
                "
              />
            </NvGroup>
          </template>
          <NvDivider direction="horizontal" />
          <NvGroup :spacing="5" justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Cache</NvText>
            </NvStack>
            <NvButton :loading="isClearingCache" @click="clearCache">
              <template v-if="isClearCacheSuccess">Cache cleared</template>
              <template v-else>Clear cache</template>
            </NvButton>
          </NvGroup>
        </NvStack>
      </NvCard>
    </NvStack>
    <NvStack>
      <NvText type="subtitle">Development</NvText>
      <NvCard>
        <NvGroup :spacing="5" justify="apart" no-wrap>
          <NvStack>
            <NvText type="label">Debug mode</NvText>
          </NvStack>
          <NvSwitch
            :modelValue="settingsStore.debugMode"
            @update:modelValue="
              (value) => settingsStore.$patch({ debugMode: value })
            "
          />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvCard,
  NvDivider,
  NvGroup,
  NvNumberInput,
  NvRangeInput,
  NvSelect,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
import NvDisplaySelect from '@/features/display/components/inputs/DisplaySelect.vue'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import NvUpdateChannelSelect from '@/features/update/components/inputs/NvUpdateChannelSelect.vue'
import { useConfirmAdmin } from '@/hooks/use-confirm-admin.ts'
import { useClearCacheMutation } from '@/features/app/queries.ts'
import { useMessengerStateStore } from '@/teams/messenger/store'

const confirmAdmin = useConfirmAdmin()
const settingsStore = useSettingsStore()
const messengerStateStore = useMessengerStateStore()

const {
  mutateAsync: clearCacheMutation,
  isSuccess: isClearCacheSuccess,
  isLoading: isClearingCache,
  reset: resetClearCache,
} = useClearCacheMutation()
const { setTimeout } = window
const clearCache = async () => {
  return clearCacheMutation().then(() =>
    setTimeout(resetClearCache.value, 3000),
  )
}
</script>
