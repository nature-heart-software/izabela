<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">About</NvText>
      <NvCard>
        <NvStack spacing="5">
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Monitor</NvText>
            </NvStack>
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Monitor</NvText>
            </NvStack>
          </NvGroup>
        </NvStack>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvDivider, NvGroup, NvStack, NvText } from '@packages/ui'
</script>
