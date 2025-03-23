<template>
  <NvGroup class="h-[24px]" justify="between">
    <NvGroup>
      <NvIcon name="exclamation-triangle" size="3"></NvIcon>
      <NvText class="text-red-500" type="body-small">A restart is required</NvText>
    </NvGroup>
    <NvButton size="sm" type="plain" @click="ElectronMessengerWindow.restart">Restart now</NvButton>
  </NvGroup>
</template>
<script lang="ts" setup>
import { NvButton, NvGroup, NvIcon, NvText } from '@packages/ui'

const { ElectronMessengerWindow } = window
</script>