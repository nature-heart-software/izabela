<template>
  <NvAccessBlocker
    :allowed="
      (speechStore.hasUniversalApiCredentials &&
        !getProperty('useLocalCredentials')) ||
      [getProperty('identityPoolId', true), getProperty('region')].every(
        Boolean,
      )
    "
    reason="Credentials required"
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
      <NvDivider direction="horizontal" />
      <NvGroup :spacing="5" justify="apart" no-wrap>
        <NvStack>
          <NvText type="label">Provide timestamps to WebSocket events</NvText>
        </NvStack>
        <NvSwitch
          :modelValue="getProperty('includeTimestamps')"
          class="shrink-0"
          @update:modelValue="
            (value) => setProperty('includeTimestamps', value)
          "
        />
      </NvGroup>
    </NvStack>
  </NvAccessBlocker>
  <template v-if="speechStore.hasUniversalApiCredentials">
    <NvDivider direction="horizontal" />
    <NvGroup justify="apart" no-wrap spacing="5">
      <NvStack>
        <NvText type="label">Use my own credentials</NvText>
      </NvStack>
      <NvSwitch
        :modelValue="getProperty('useLocalCredentials')"
        @update:modelValue="
          (value) => setProperty('useLocalCredentials', value)
        "
      />
    </NvGroup>
  </template>
  <template
    v-if="
      getProperty('useLocalCredentials') ||
      !speechStore.hasUniversalApiCredentials
    "
  >
    <NvDivider direction="horizontal" />
    <NvStack spacing="5">
      <NvFormItem label="Identity Pool ID">
        <NvInput
          :modelValue="getProperty('identityPoolId', true)"
          show-password
          type="password"
          @update:modelValue="
            (value) => setProperty('identityPoolId', value, true)
          "
        />
      </NvFormItem>
    </NvStack>
    <NvDivider direction="horizontal" />
    <NvStack spacing="5">
      <NvFormItem label="Region">
        <NvInput
          :modelValue="getProperty('region')"
          @update:modelValue="(value) => setProperty('region', value)"
        />
      </NvFormItem>
    </NvStack>
  </template>
</template>
<script lang="ts" setup>
import {
  NvAccessBlocker,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'

const speechStore = useSpeechStore()
</script>
