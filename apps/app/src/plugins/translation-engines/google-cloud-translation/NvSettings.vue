<template>
  <NvAccessBlocker
    :allowed="!!googleCloudSpeechCredentialsPath"
    reason="Google Cloud credentials required"
  >
    <NvStack :spacing="size === 'sm' ? 4 : 5">
      <NvFormItem label="From">
        <NvTranslateFromSelect
          v-bind="{
            ...(form
              ? {
                  modelValue: form[store.getPropertyPath('translateFrom')],
                  'onUpdate:modelValue': (value) =>
                    (form[store.getPropertyPath('translateFrom')] = value),
                }
              : {
                  modelValue: store.getProperty('translateFrom'),
                  'onUpdate:modelValue': (value) =>
                    store.setProperty('translateFrom', value),
                }),
          }"
        />
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="To">
        <NvTranslateToSelect
          v-bind="{
            ...(form
              ? {
                  modelValue: form[store.getPropertyPath('translateTo')],
                  'onUpdate:modelValue': (value) =>
                    (form[store.getPropertyPath('translateTo')] = value),
                }
              : {
                  modelValue: store.getProperty('translateTo'),
                  'onUpdate:modelValue': (value) =>
                    store.setProperty('translateTo', value),
                }),
          }"
        />
      </NvFormItem>
    </NvStack>
  </NvAccessBlocker>
  <template v-if="!form && size === 'md'">
    <NvDivider direction="horizontal" />
    <NvGoogleCloudCredentialsFormPart>
      Izabela uses Google Cloud Translation AI for translation which requires a
      <a
        href="https://github.com/nature-heart-software/izabela/wiki/How-to-get-Google-Cloud-service-account-credentials"
        target="_blank"
        >Google Cloud service account credentials</a
      >
      file to be imported
    </NvGoogleCloudCredentialsFormPart>
  </template>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { NvAccessBlocker, NvDivider, NvFormItem, NvStack } from '@packages/ui'
import NvTranslateFromSelect from './NvTranslateFromSelect.vue'
import NvTranslateToSelect from './NvTranslateToSelect.vue'
import { useGetGoogleCloudSpeechCredentialsPath } from '@/features/settings/hooks'
import { store } from './store.ts'
import NvGoogleCloudCredentialsFormPart from '@/features/settings/components/NvGoogleCloudCredentialsFormPart.vue'

const props = defineProps({
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md',
  },
  form: Object,
})
const { data: googleCloudSpeechCredentialsPath } =
  useGetGoogleCloudSpeechCredentialsPath()
</script>
