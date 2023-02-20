<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Translation</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Translation</NvText>
              <NvText>Translate messages before speaking</NvText>
            </NvStack>
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvStack spacing="5">
              <NvGroup justify="apart" no-wrap spacing="5">
                <NvStack>
                  <NvText type="label">Enable translation</NvText>
                </NvStack>
                <NvSwitch
                  :modelValue="settingsStore.enableTranslation"
                  class="shrink-0"
                  @update:modelValue="(value) => settingsStore.$patch({ enableTranslation: value })"
                />
              </NvGroup>
              <NvDivider direction="horizontal"/>
              <NvGroup justify="apart" no-wrap spacing="5">
                <NvStack>
                  <NvText type="label">From</NvText>
                </NvStack>
                <NvSelect
                  :modelValue="settingsStore.textInputLanguage"
                  :options="[
                      {
                      label: 'Auto',
                      value: null,
                    },
                    ...options
                    ]"
                  class="shrink-0"
                  @update:modelValue="(value) => settingsStore.$patch({ textInputLanguage: value })"
                />
              </NvGroup>
              <NvDivider direction="horizontal"/>
              <NvGroup justify="apart" no-wrap spacing="5">
                <NvStack>
                  <NvText type="label">To</NvText>
                </NvStack>
                <NvSelect
                  :modelValue="settingsStore.textOutputLanguage"
                  :options="options"
                  class="shrink-0"
                  @update:modelValue="(value) => settingsStore.$patch({ textOutputLanguage: value })"
                />
              </NvGroup>
            </NvStack>
          </NvCard>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvDivider, NvGroup, NvSelect, NvStack, NvSwitch, NvText } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
// eslint-disable-next-line camelcase
import { getAll639_1, getName } from 'all-iso-language-codes'

const settingsStore = useSettingsStore()
const isoCodes = getAll639_1()
const options = isoCodes.map((code) => ({ label: getName(code, 'en'), value: code }))
</script>
