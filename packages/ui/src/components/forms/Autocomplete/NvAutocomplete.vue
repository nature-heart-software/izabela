<template>
  <StAutocomplete v-bind="props">
    <DynamicScroller
      ref="scroller"
      :emitUpdate="true"
      :items="props.data"
      :keyField="props.valueKey"
      :min-item-size="props.minItemSize"
      class="autocomplete__scroller"
      @update="(start, end) => (visibleItems = [start, end])"
      @visible="onVisible"
    >
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :active="active" :data-index="index" :item="item">
          <slot
            v-bind="{
              item,
              index,
              visible: active,
              active: selection === index,
            }"
          />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </StAutocomplete>
</template>
<script lang="ts" setup>
import { defineProps, ref, watch } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { StAutocomplete } from './autocomplete.styled'
import { props as propsDefinition } from './autocomplete.shared'
import { get } from 'lodash'

const props = defineProps(propsDefinition)
const scroller = ref()
const visibleItems = ref<[number, number]>([-1, -1])
const selection = ref(-1)
watch(
  () => props.data,
  () => {
    scroller.value.scrollToItem(0)
  },
)
const onVisible = () => {
  console.log(scroller.value)
  if (props.autoScrollValue) {
    const index = props.data.findIndex(
      (item) => get(item, props.valueKey, item) === props.autoScrollValue,
    )
    if (index > -1) {
      scroller.value.scrollToItem(index)
    }
  }
}
</script>
