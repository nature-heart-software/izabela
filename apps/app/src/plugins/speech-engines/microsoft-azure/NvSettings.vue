<template>
  <NvStack spacing="5">
    <NvFormItem label="API Key">
      <NvInput
        :modelValue="decrypt(store.getters['settings/persisted'].MATTSApiKey)"
        show-password
        type="password"
        @update:modelValue="
          (value) =>
            store.dispatch('settings/setProperty', [
              'persisted.MATTSApiKey',
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
        :modelValue="store.getters['settings/persisted'].MATTSRegion"
        @update:modelValue="
          (value) =>
            store.dispatch('settings/setProperty', ['persisted.MATTSRegion', value])
        "
      />
    </NvFormItem>
  </NvStack>
  <NvDivider direction="horizontal"/>
  <NvAccessBlocker
    :allowed="
      [
        decrypt(store.getters['settings/persisted'].MATTSApiKey),
        store.getters['settings/persisted'].MATTSRegion,
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
const engine = getEngineById('matts')
</script>
