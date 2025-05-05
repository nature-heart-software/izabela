<template>
  <NvGoogleCloudCredentialsFormPart>
    Izabela uses Google Cloud Speech for speech recognition which requires a
    <a
      href="https://github.com/nature-heart-software/izabela/wiki/How-to-get-Google-Cloud-service-account-credentials"
      target="_blank"
      >Google Cloud service account credentials</a
    >
    file to be imported
  </NvGoogleCloudCredentialsFormPart>
  <NvAccessBlocker
    :allowed="!!googleCloudSpeechCredentialsPath"
    reason="Google Cloud credentials required"
  >
    <NvStack :spacing="5">
      <NvDivider direction="horizontal" />
      <NvGroup justify="apart" no-wrap spacing="5">
        <NvStack>
          <NvText type="label">Filter profanities</NvText>
        </NvStack>
        <NvSwitch
          :modelValue="store.getProperty('profanityFilter')"
          class="shrink-0"
          @update:modelValue="
            (value) => store.getProperty('profanityFilter', value)
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
  NvGroup,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import NvGoogleCloudCredentialsFormPart from '@/features/settings/components/NvGoogleCloudCredentialsFormPart.vue'
import { useGetGoogleCloudSpeechCredentialsPath } from '@/features/settings/hooks'
import { store } from './store'
const { data: googleCloudSpeechCredentialsPath } =
  useGetGoogleCloudSpeechCredentialsPath()
</script>
