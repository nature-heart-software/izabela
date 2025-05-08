<template>
  <NvStack :spacing="size === 'sm' ? 4 : 5">
    <NvGroup justify="apart" no-wrap>
      <NvStack>
        <NvText type="label">Enable audio input</NvText>
      </NvStack>
      <NvSwitch
        :modelValue="settingsStore.enableSTTTS"
        class="shrink-0"
        @update:modelValue="
          (value) => settingsStore.$patch({ enableSTTTS: value })
        "
      />
    </NvGroup>
    <NvDivider direction="horizontal" />
    <NvAccessBlocker
      :allowed="settingsStore.enableSTTTS"
      :reason="'Audio input needs to be enabled'"
    >
      <NvStack :spacing="size === 'sm' ? 4 : 5">
        <NvFormItem label="Speech recognition engine">
          <NvSpeechRecognitionEngineSelect
            :modelValue="settingsStore.selectedSpeechRecognitionEngine"
            @update:modelValue="
              (value) => {
                settingsStore.$patch({
                  selectedSpeechRecognitionEngine: value,
                })
              }
            "
          />
        </NvFormItem>
        <NvDivider direction="horizontal" />
        <NvAccessBlocker
          :allowed="engine ? engine.hasCredentials() : true"
          reason="Credentials required"
        >
          <NvStack :spacing="size === 'sm' ? 4 : 5">
            <NvFormItem label="Speech recognition language">
              <NvSpeechInputLanguageSelect />
            </NvFormItem>
            <NvDivider direction="horizontal" />
            <NvFormItem label="Recording device">
              <NvSoxAudioInputSelect class="!w-full" />
            </NvFormItem>
            <NvDivider direction="horizontal" />
            <NvFormItem label="Speech recognition strategy">
              <NvSpeechRecognitionStrategySelect />
            </NvFormItem>
          </NvStack>
        </NvAccessBlocker>
      </NvStack>
    </NvAccessBlocker>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvAccessBlocker,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import NvSpeechInputLanguageSelect from '@/features/speech/components/inputs/NvSpeechInputLanguageSelect.vue'
import NvSoxAudioInputSelect from '@/features/audio/components/inputs/NvSoxAudioInputSelect.vue'
import NvSpeechRecognitionStrategySelect from '@/features/speech/components/inputs/NvSpeechRecognitionStrategySelect.vue'
import NvSpeechRecognitionEngineSelect from '@/features/speech/components/inputs/NvSpeechRecognitionEngineSelect.vue'
import { useSettingsStore } from '@/features/settings/store'
import { computed, PropType } from 'vue'
import speechRecognitionEngineManager from '@/modules/speech-recognition-engine-manager'

const settingsStore = useSettingsStore()
const engine = computed(() => {
  return speechRecognitionEngineManager.getEngineById(
    settingsStore.selectedSpeechRecognitionEngine,
  )
})
const props = defineProps({
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md',
  },
})
</script>
