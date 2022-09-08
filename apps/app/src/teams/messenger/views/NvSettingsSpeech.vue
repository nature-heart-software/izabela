<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Speech</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Speech Engine</NvText>
              <NvText>Select the speech engine used for Izabela's speech</NvText>
            </NvStack>
            <SpeechEngineSelect
              :modelValue="speechStore.selectedSpeechEngine"
              @update:modelValue="
                (value) => {
                  selectedEngineTab = value
                  settingsStore.$patch({ speech: { selectedSpeechEngine: value } })
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
  </NvStack>
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { NvButton, NvCard, NvDivider, NvGroup, NvStack, NvText } from '@packages/ui'
import SpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import { useSpeechEngineManager } from '@/modules/speech-engine-manager'
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { useSettingsStore } from '@/features/settings/store'
import { useSpeechStore } from '@/features/speech/store'

const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
const store = useStore()
const selectedEngineTab = ref<SpeechEngine['id']>(speechStore.selectedSpeechEngine)
const { engines } = useSpeechEngineManager()
const currentEngineSettingsComponent = computed(
  () => engines.value.find((e) => e.id === selectedEngineTab.value)?.settingsComponent,
)
</script>
