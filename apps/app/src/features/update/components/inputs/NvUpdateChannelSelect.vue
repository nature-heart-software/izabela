<template>
  <NvSelect :options="options">
    <!--    <NvOption label="Latest" value="latest">Latest</NvOption>-->
    <!--    <NvOption label="Pre-release" value="rc">Pre-release</NvOption>-->
    <!--    <NvOption label="Beta" value="beta">Beta</NvOption>-->
    <!--    <NvOption label="Alpha" value="alpha">Alpha</NvOption>-->
  </NvSelect>
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'

const options = [
  {
    label: 'Latest',
    value: 'latest',
  },
  {
    label: 'Pre-release',
    value: 'rc',
  },
  {
    label: 'Beta',
    value: 'beta',
  },
  {
    label: 'Alpha',
    value: 'alpha',
  },
]
</script>
