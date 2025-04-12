<template>
  <NvAccessBlocker
    :allowed="!!getProperty('endpoint')"
    reason="Endpoint and/or credentials required"
  >
    <NvStack :spacing="5">
      <NvFormItem label="Voice">
        <NvVoiceSelect placeholder="Select a voice" />
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
  <NvDivider direction="horizontal" />
  <NvFormItem label="API Endpoint">
    <NvInput
      :modelValue="getProperty('endpoint')"
      @update:modelValue="(value) => setProperty('endpoint', value)"
    />
  </NvFormItem>
  <NvDivider direction="horizontal" />
  <NvFormItem label="API Key">
    <NvInput
      :modelValue="getProperty('apiKey', true)"
      show-password
      type="password"
      @update:modelValue="(value) => setProperty('apiKey', value, true)"
    />
  </NvFormItem>
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
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'
</script>
