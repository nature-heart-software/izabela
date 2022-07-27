<template>
  <StOption v-bind="props">
    <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope || {}"/>
    </template>
  </StOption>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StOption } from './select.styled'
import { props as propsDefinition } from './select.shared'

const props = defineProps(propsDefinition)
</script>
