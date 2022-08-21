<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Update</NvText>
      <NvCard>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Update Channel</NvText>
          </NvStack>
          <NvUpdateChannelSelect
            :modelValue="store.getters['settings/persisted'].updateChannel"
            @update:modelValue="
              (value) => store.dispatch('settings/setProperty', ['persisted.updateChannel', value])
            "
          />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvText } from '@packages/ui'
import NvUpdateChannelSelect from '@/entities/update/components/inputs/NvUpdateChannelSelect.vue'
import { useStore } from 'vuex'

const store = useStore()
</script>
