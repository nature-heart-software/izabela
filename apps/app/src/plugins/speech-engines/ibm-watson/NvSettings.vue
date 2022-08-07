<template>
  <NvStack spacing="5">
    <NvFormItem label="API Key">
      <NvInput
        :modelValue="decrypt(store.getters['settings/persisted'].IWTTSApiKey)"
        show-password
        type="password"
        @update:modelValue="
          (value) =>
            store.dispatch('settings/setProperty', [
              'persisted.IWTTSApiKey',
              encrypt(value),
            ])
        "
      />
    </NvFormItem>
  </NvStack>
  <NvDivider direction="horizontal"/>
  <NvStack spacing="5">
    <NvFormItem label="Url">
      <NvInput
        :modelValue="store.getters['settings/persisted'].IWTTSUrl"
        @update:modelValue="
          (value) =>
            store.dispatch('settings/setProperty', ['persisted.IWTTSUrl', value])
        "
      />
    </NvFormItem>
  </NvStack>
  <NvDivider direction="horizontal"/>
  <NvAccessBlocker
    :allowed="
      [
        decrypt(store.getters['settings/persisted'].IWTTSApiKey),
        store.getters['settings/persisted'].IWTTSUrl,
      ].every(Boolean)
    "
    reason="Credentials required"
  >
    <NvFormItem label="Voice">
      <template v-if="engine">
        <component :is="engine.voiceSelectComponent"/>
      </template>
    </NvFormItem>
  </NvAccessBlocker>
</template>
<script lang="ts" setup>
import { NvAccessBlocker, NvDivider, NvFormItem, NvInput, NvStack } from '@/core/components'
import { getEngineById } from '@/entities/speech/modules/speech-engine-manager'
import { useStore } from 'vuex'
import { decrypt, encrypt } from '@/utils/security'

const store = useStore()
const engine = getEngineById('iwtts')
</script>
