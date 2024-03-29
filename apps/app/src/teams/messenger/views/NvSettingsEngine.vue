<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Speech engine</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup align="start" justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Speech engine</NvText>
              <NvText>Select the speech engine to use</NvText>
            </NvStack>
            <SpeechEngineSelect
              :modelValue="speechStore.selectedSpeechEngine"
              @update:modelValue="
                (value) => {
                  settingsStore.$patch({ selectedSpeechEngine: value })
                }
              "
            />
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvStack spacing="5">
              <NvGroup grow>
                <template v-for="engine in engines" :key="engine.id">
                  <NvButton
                    :selected="selectedEngineTab === engine.id"
                    align="center"
                    type="ghost"
                    @click="selectedEngineTab = engine.id"
                    >{{ engine.name }}
                  </NvButton>
                </template>
              </NvGroup>
              <NvDivider direction="horizontal" />
              <template v-if="currentEngineSettingsComponent">
                <component :is="currentEngineSettingsComponent" />
              </template>
            </NvStack>
          </NvCard>
        </div>
      </NvStack>
    </NvStack>
    <NvStack>
      <NvText type="subtitle">Universal credentials</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvStack spacing="5">
            <NvStack>
              <NvText type="label">Universal credentials</NvText>
              <NvText
                >Gain access to multiple text-to-speech engines using a universal API key <br />You
                can obtain a universal API key by being a
                <a href="https://ko-fi.com/woowee/tiers" target="_blank">Ko-fi supporter</a></NvText
              >
            </NvStack>
          </NvStack>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvUniversalApiForm />
          </NvCard>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { NvButton, NvCard, NvDivider, NvGroup, NvStack, NvText } from '@packages/ui'
import SpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import { useSpeechEngineManager } from '@/modules/speech-engine-manager'
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { useSettingsStore } from '@/features/settings/store'
import { useSpeechStore } from '@/features/speech/store'
import NvUniversalApiForm from '@/features/speech/components/forms/NvUniversalApiForm.vue'

const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()

const selectedEngineTab = ref<SpeechEngine['id']>(speechStore.selectedSpeechEngine)
watch(
  () => speechStore.selectedSpeechEngine,
  (value) => {
    selectedEngineTab.value = value
  },
)
const { engines } = useSpeechEngineManager()
const currentEngineSettingsComponent = computed(
  () => engines.value.find((e) => e.id === selectedEngineTab.value)?.settingsComponent,
)
</script>
