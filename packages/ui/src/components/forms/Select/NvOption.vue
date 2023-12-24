<template>
  <StSelectOption v-bind="props">
    <div>
      <slot />
    </div>
  </StSelectOption>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StSelectOption } from './select.styled'
import { optionProps as propsDefinition } from './select.shared'

const props = defineProps(propsDefinition)
</script>
