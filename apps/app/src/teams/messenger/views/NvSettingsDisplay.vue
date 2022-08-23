<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Display</NvText>
      <NvCard>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Monitor</NvText>
          </NvStack>
          <NvDisplaySelect />
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvGroup, NvStack, NvText } from '@packages/ui'
import { useStore } from 'vuex'
import NvDisplaySelect from '@/entities/display/components/inputs/DisplaySelect.vue'

const store = useStore()
</script>
