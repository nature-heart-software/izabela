<template>
  <st-card v-bind="$props">
    <slot />
  </st-card>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { StCard } from './card.styled';
import { props } from './card.shared';

export default defineComponent({
  name: 'nv-card',
  components: {
    StCard,
  },
  props,
});
</script>
