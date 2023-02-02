<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">About</NvText>
      <NvCard>
        <NvStack spacing="5">
          <template v-for="(value, key, i) in info" :key="key">
            <NvDivider v-if="i > 0" direction="horizontal"/>
            <NvGroup no-wrap>
              <NvText class="w-1/2" type="label">{{ key }}</NvText>
              <NvText class="w-1/2">{{ value }}</NvText>
            </NvGroup>
          </template>
        </NvStack>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvDivider, NvGroup, NvStack, NvText } from '@packages/ui'
import { onMounted, ref } from 'vue'

const { ElectronSI } = window
const info = ref({})
onMounted(() => {
  ElectronSI.getInfo().then((data) => {
    info.value = data
  })
})
</script>
