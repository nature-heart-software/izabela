<template>
  <NvAccessBlocker
    :allowed="speechStore.hasUniversalApiCredentials"
    reason="Universal credentials required"
  >
    <NvStack :spacing="5">
      <NvFormItem label="Voice">
        <NvVoiceSelect />
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvGroup :spacing="5" align="start" justify="apart" no-wrap>
        <NvStack>
          <NvText type="label">Stream audio</NvText>
          <NvText
            >Allows for faster audio playback, may cause audio artifacts
          </NvText>
        </NvStack>
        <NvSwitch
          :modelValue="getProperty('streamAudio')"
          class="shrink-0"
          @update:modelValue="(value) => setProperty('streamAudio', value)"
        />
      </NvGroup>
      <NvDivider direction="horizontal" />
      <NvGroup :spacing="5" justify="apart" no-wrap>
        <NvStack>
          <NvText type="label">Prefer cache on every message</NvText>
        </NvStack>
        <NvSwitch
          :modelValue="getProperty('useCacheOnEveryRequest')"
          @update:modelValue="
            (value) => setProperty('useCacheOnEveryRequest', value)
          "
        />
      </NvGroup>
    </NvStack>
  </NvAccessBlocker>
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
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import {
  getProperty,
  setProperty,
} from '@/plugins/speech-engines/custom/store.ts'

const speechStore = useSpeechStore()
</script>
