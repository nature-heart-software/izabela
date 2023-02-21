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
              <template v-if="settingsStore.enableTranslation">
                <NvDivider direction="horizontal"/>
                <NvGoogleCloudCredentialsFormPart>
                  Izabela uses Google Cloud Translation AI for translation which requires
                  Google Cloud Credentials to be imported
                </NvGoogleCloudCredentialsFormPart>
                <template v-if="googleCloudSpeechCredentialsPath">
                  <NvDivider direction="horizontal"/>
                  <NvGroup justify="apart" no-wrap spacing="5">
                    <NvStack>
                      <NvText type="label">From</NvText>
                    </NvStack>
                    <NvSelect
                      :modelValue="settingsStore.textInputLanguage"
                      :options="options"
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
                </template>
              </template>
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
import { useGetGoogleCloudSpeechCredentialsPath } from '@/features/settings/hooks'
import NvGoogleCloudCredentialsFormPart
  from '@/features/settings/components/NvGoogleCloudCredentialsFormPart.vue'

const settingsStore = useSettingsStore()
const isoCodes = getAll639_1()
const options = [
  {
    label: 'Auto',
    value: null,
  },
  ...isoCodes.map((code) => ({ label: getName(code, 'en'), value: code })),
]


const { data: googleCloudSpeechCredentialsPath } = useGetGoogleCloudSpeechCredentialsPath()
</script>
