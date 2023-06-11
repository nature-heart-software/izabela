<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">General</NvText>
      <NvCard>
        <NvStack spacing="5">
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Monitor</NvText>
            </NvStack>
            <NvDisplaySelect />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Hide window after sending a message</NvText>
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.hideWindowOnMessage"
              @update:modelValue="(value) => settingsStore.$patch({ hideWindowOnMessage: value })"
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap spacing="5">
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
                  (value) => settingsStore.$patch({ backgroundDimOpacity: value })
                "
              />
              <NvNumberInput
                :modelValue="settingsStore.backgroundDimOpacity"
                max="100"
                min="0"
                step="1"
                @update:modelValue="
                  (value) => settingsStore.$patch({ backgroundDimOpacity: value })
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
        <NvStack spacing="5">
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Show Messenger window</NvText>
            </NvStack>
            <NvKeybinding
              :modelValue="settingsStore.keybindings.toggleMessengerWindow"
              multiple
              @update:modelValue="
                (value) => settingsStore.$patch({ keybindings: { toggleMessengerWindow: value } })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup align="start" justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Show Messenger window (alternative)</NvText>
              <NvText
                >If an application is preventing the window from showing with the shortcut above,
                try this one
              </NvText>
            </NvStack>
            <NvKeybinding
              :modelValue="settingsStore.keybindings.toggleMessengerWindowAlt"
              multiple
              @update:modelValue="
                (value) =>
                  settingsStore.$patch({ keybindings: { toggleMessengerWindowAlt: value } })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup align="start" justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Show Overlay window</NvText>
              <NvText>todo </NvText>
            </NvStack>
            <NvKeybinding
              :modelValue="settingsStore.keybindings.toggleOverlayWindow"
              multiple
              @update:modelValue="
                (value) => settingsStore.$patch({ keybindings: { toggleOverlayWindow: value } })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Cancel playing message</NvText>
            </NvStack>
            <NvKeybinding
              :modelValue="settingsStore.keybindings.cancelCurrentMessage"
              multiple
              @update:modelValue="
                (value) => settingsStore.$patch({ keybindings: { cancelCurrentMessage: value } })
              "
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Cancel playing and queued messages</NvText>
            </NvStack>
            <NvKeybinding
              :modelValue="settingsStore.keybindings.cancelAllMessages"
              multiple
              @update:modelValue="
                (value) => settingsStore.$patch({ keybindings: { cancelAllMessages: value } })
              "
            />
          </NvGroup>
        </NvStack>
      </NvCard>
    </NvStack>
    <NvStack>
      <NvText type="subtitle">Application</NvText>
      <NvCard>
        <NvStack spacing="5">
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Launch on startup</NvText>
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.launchOnStartup"
              @update:modelValue="(value) => settingsStore.$patch({ launchOnStartup: value })"
            />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Update channel</NvText>
            </NvStack>
            <NvUpdateChannelSelect
              :modelValue="settingsStore.updateChannel"
              @update:modelValue="(value) => settingsStore.$patch({ updateChannel: value })"
            />
          </NvGroup>
          <!--          <NvDivider direction="horizontal" />-->
          <!--          <NvGroup justify="apart" no-wrap spacing="5">-->
          <!--            <NvStack>-->
          <!--              <NvText type="label">Enable background dim</NvText>-->
          <!--            </NvStack>-->
          <!--            <NvSwitch-->
          <!--              :modelValue="settingsStore.enableBackgroundDim"-->
          <!--              @update:modelValue="(value) => settingsStore.$patch({ enableBackgroundDim: value })"-->
          <!--            />-->
          <!--          </NvGroup>-->
        </NvStack>
      </NvCard>
    </NvStack>
    <NvStack>
      <NvText type="subtitle">Development</NvText>
      <NvCard>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Debug mode</NvText>
          </NvStack>
          <NvSwitch
            :modelValue="settingsStore.debugMode"
            @update:modelValue="(value) => settingsStore.$patch({ debugMode: value })"
          />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvCard,
  NvDivider,
  NvGroup,
  NvNumberInput,
  NvRangeInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
import NvDisplaySelect from '@/features/display/components/inputs/DisplaySelect.vue'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import NvUpdateChannelSelect from '@/features/update/components/inputs/NvUpdateChannelSelect.vue'

const settingsStore = useSettingsStore()
</script>
