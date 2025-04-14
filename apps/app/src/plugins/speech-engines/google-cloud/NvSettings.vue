<template>
  <NvAccessBlocker
    :allowed="
      (speechStore.hasUniversalApiCredentials &&
        !getProperty('useLocalCredentials')) ||
      !!getProperty('apiKey', true)
    "
    reason="Credentials required"
  >
    <NvStack spacing="5">
      <NvFormItem label="Voice">
        <NvVoiceSelect />
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Speaking Rate">
        <NvGroup>
          <NvRangeInput
            :max="4"
            :min="0.25"
            :step="0.01"
            class="!grow"
            v-bind="{
              modelValue: getProperty('speakingRate'),
              'onUpdate:modelValue': (value) =>
                setProperty('speakingRate', value),
            }"
          />
          <NvNumberInput
            :max="4"
            :min="0.25"
            :step="0.01"
            v-bind="{
              modelValue: getProperty('speakingRate'),
              'onUpdate:modelValue': (value) =>
                setProperty('speakingRate', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Pitch">
        <NvGroup>
          <NvRangeInput
            :max="20"
            :min="-20"
            :step="0.1"
            class="!grow"
            v-bind="{
              modelValue: getProperty('pitch'),
              'onUpdate:modelValue': (value) => setProperty('pitch', value),
            }"
          />
          <NvNumberInput
            :max="20"
            :min="-20"
            :step="0.1"
            v-bind="{
              modelValue: getProperty('pitch'),
              'onUpdate:modelValue': (value) => setProperty('pitch', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Volume Gain (dB)">
        <NvGroup>
          <NvRangeInput
            :max="16"
            :min="-96"
            :step="0.1"
            class="!grow"
            v-bind="{
              modelValue: getProperty('volumeGainDb'),
              'onUpdate:modelValue': (value) =>
                setProperty('volumeGainDb', value),
            }"
          />
          <NvNumberInput
            :max="20"
            :min="-20"
            :step="0.1"
            v-bind="{
              modelValue: getProperty('volumeGainDb'),
              'onUpdate:modelValue': (value) =>
                setProperty('volumeGainDb', value),
            }"
          />
        </NvGroup>
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
      <NvFormItem label="API Key">
        <NvInput
          :modelValue="getProperty('apiKey', true)"
          show-password
          type="password"
          @update:modelValue="(value) => setProperty('apiKey', value, true)"
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
  NvNumberInput,
  NvRangeInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'

const speechStore = useSpeechStore()
</script>
