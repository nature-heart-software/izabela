<template>
  <NvFormItem label="Voice">
    <NvVoiceSelect
      :modelValue="getProperty('selectedVoice')"
      @update:modelValue="(value) => setProperty('selectedVoice', value)"
    />
  </NvFormItem>
  <NvDivider direction="horizontal" />
  <NvAccessBlocker
    :allowed="getProperty('selectedVoice')?.name === 'Custom'"
    reason='Only available for the "Custom" voice'
  >
    <NvStack spacing="5">
      <NvFormItem label="Pitch">
        <NvGroup>
          <NvRangeInput
            :max="255"
            :min="0"
            class="!grow"
            v-bind="{
              modelValue: getProperty('pitch'),
              'onUpdate:modelValue': (value) => setProperty('pitch', value),
            }"
          />
          <NvNumberInput
            :max="255"
            :min="0"
            v-bind="{
              modelValue: getProperty('pitch'),
              'onUpdate:modelValue': (value) => setProperty('pitch', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Speed">
        <NvGroup>
          <NvRangeInput
            :max="255"
            :min="0"
            class="!grow"
            v-bind="{
              modelValue: getProperty('speed'),
              'onUpdate:modelValue': (value) => setProperty('speed', value),
            }"
          />
          <NvNumberInput
            :max="255"
            :min="0"
            v-bind="{
              modelValue: getProperty('speed'),
              'onUpdate:modelValue': (value) => setProperty('speed', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Mouth">
        <NvGroup>
          <NvRangeInput
            :max="255"
            :min="0"
            class="!grow"
            v-bind="{
              modelValue: getProperty('mouth'),
              'onUpdate:modelValue': (value) => setProperty('mouth', value),
            }"
          />
          <NvNumberInput
            v-bind="{
              modelValue: getProperty('mouth'),
              'onUpdate:modelValue': (value) => setProperty('mouth', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Throat">
        <NvGroup>
          <NvRangeInput
            :max="255"
            :min="0"
            class="!grow"
            v-bind="{
              modelValue: getProperty('throat'),
              'onUpdate:modelValue': (value) => setProperty('throat', value),
            }"
          />
          <NvNumberInput
            v-bind="{
              modelValue: getProperty('throat'),
              'onUpdate:modelValue': (value) => setProperty('throat', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
    </NvStack>
  </NvAccessBlocker>
  <template v-if="!form">
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
  </template>
</template>
<script lang="ts" setup>
import {
  NvAccessBlocker,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvNumberInput,
  NvRangeInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import NvVoiceSelect from './NvVoiceSelect'
import { store } from './store'

const props = defineProps({
  form: Object,
})
const { getProperty, setProperty } = store.useStoreOrForm(props.form)
</script>
