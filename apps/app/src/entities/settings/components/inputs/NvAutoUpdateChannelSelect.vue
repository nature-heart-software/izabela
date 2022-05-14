<template>
  <NvSelect>
    <NvOption label="Latest" value="latest">Latest</NvOption>
    <NvOption label="Beta" value="beta">Beta</NvOption>
    <NvOption label="Alpha" value="alpha">Alpha</NvOption>
  </NvSelect>
</template>
<script lang="ts" setup>
import { NvOption, NvSelect } from '@/core/components'
</script>
