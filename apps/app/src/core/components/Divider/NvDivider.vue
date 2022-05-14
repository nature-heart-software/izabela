<template>
  <StDivider v-bind="$props" />
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StDivider } from './divider.styled'
import { props } from './divider.shared'

defineProps(props)
</script>
