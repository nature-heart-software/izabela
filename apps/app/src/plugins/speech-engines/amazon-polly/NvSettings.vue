<template>
  <NvStack spacing="5">
    <NvFormItem label="Identity pool ID">
      <NvInput
        :modelValue="decrypt(store.getters['settings/persisted'].APTTSIdentityPoolId)"
        show-password
        type="password"
        @update:modelValue="
          (value) =>
            store.dispatch('settings/setProperty', [
              'persisted.APTTSIdentityPoolId',
              encrypt(value),
            ])
        "
      />
    </NvFormItem>
  </NvStack>
  <NvDivider direction="horizontal"/>
  <NvStack spacing="5">
    <NvFormItem label="Region">
      <NvInput
        :modelValue="store.getters['settings/persisted'].APTTSRegion"
        @update:modelValue="
          (value) =>
            store.dispatch('settings/setProperty', ['persisted.APTTSRegion', value])
        "
      />
    </NvFormItem>
  </NvStack>
  <NvDivider direction="horizontal"/>
  <NvAccessBlocker
    :allowed="
      [
        decrypt(store.getters['settings/persisted'].APTTSIdentityPoolId),
        store.getters['settings/persisted'].APTTSRegion,
      ].every(Boolean)
    "
    reason="Credentials required"
  >
    <NvFormItem label="Voice">
      <NvVoiceSelect/>
    </NvFormItem>
  </NvAccessBlocker>
</template>
<script lang="ts" setup>
import { NvAccessBlocker, NvDivider, NvFormItem, NvInput, NvStack } from '@/core/components'
import { useStore } from 'vuex'
import { decrypt, encrypt } from '@/utils/security'
import NvVoiceSelect from './NvVoiceSelect'

const store = useStore()
</script>
