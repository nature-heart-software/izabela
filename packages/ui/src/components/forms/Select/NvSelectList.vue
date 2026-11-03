<template>
  <NvVirtualListContainer
    v-bind="combobox.getContentProps()"
    class="autocomplete__list"
  >
    <NvVirtualList
      ref="list"
      :count="rows.length"
      :options="{ getItemKey: (index: number) => rows[index].key }"
      @visible="emit('visible')"
    >
      <template #items="{ items }">
        <template v-for="section in visibleSections(items)" :key="section.key">
          <component
            :is="section.group ? Combobox.ItemGroup : 'div'"
            :role="section.group ? 'group' : undefined"
          >
            <Combobox.ItemGroupLabel
              v-if="section.group"
              role="presentation"
              as-child
            >
              <StSelectGroupLabel
                :hidden="!section.heading"
                :style="section.heading && rowStyle(section.heading)"
              >
                <span>{{ section.group.label }}</span>
              </StSelectGroupLabel>
            </Combobox.ItemGroupLabel>
            <Combobox.Item
              v-for="entry in section.items"
              :key="entry.item.key"
              :item="entry.item"
              :class="virtualListItem()"
              :style="rowStyle(entry.virtual)"
            >
              <slot
                :item="entry.item"
                :active="
                  combobox.getItemState({ item: entry.item }).highlighted
                "
              />
            </Combobox.Item>
          </component>
        </template>
      </template>
    </NvVirtualList>
  </NvVirtualListContainer>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Combobox, useComboboxContext } from '@ark-ui/vue'
import type { VirtualItem } from '@tanstack/virtual-core'
import NvVirtualList from '@/components/miscellaneous/VirtualList/NvVirtualList.vue'
import NvVirtualListContainer from '@/components/miscellaneous/VirtualList/NvVirtualListContainer.vue'
import { virtualListItem } from '@/components/miscellaneous/VirtualList/virtual-list.panda'
import { StSelectGroupLabel } from './select.panda'
import type { SelectOption } from './select.shared'

const props = defineProps<{ rows: SelectOption[] }>()
const emit = defineEmits<{ visible: [] }>()
const combobox = useComboboxContext()
const list = ref<InstanceType<typeof NvVirtualList>>()
defineExpose({
  scrollToIndex: (index: number) => list.value?.scrollToIndex(index),
})

// Keep the flat measurement indices, but nest each group's actual options under
// Ark's group. A label remains available to aria-labelledby when scrolled away.
const sections = computed(() => {
  const result: {
    key: string
    group?: SelectOption
    index: number
    indices: number[]
  }[] = []
  let current: (typeof result)[number] | undefined
  let childKeys = new Set<string>()
  props.rows.forEach((row, index) => {
    if (row.children) {
      current = { key: row.key, group: row, index, indices: [] }
      childKeys = new Set(row.children.map((child) => child.key))
      result.push(current)
    } else if (current && childKeys.has(row.key)) {
      current.indices.push(index)
    } else {
      current = undefined
      result.push({ key: row.key, index, indices: [index] })
    }
  })
  return result
})
function visibleSections(items: VirtualItem[]) {
  const byIndex = new Map(items.map((item) => [item.index, item]))
  return sections.value
    .map((section) => ({
      ...section,
      heading: section.group ? byIndex.get(section.index) : undefined,
      items: section.indices.flatMap((index) => {
        const virtual = byIndex.get(index)
        return virtual ? [{ item: props.rows[index], virtual }] : []
      }),
    }))
    .filter((section) => section.heading || section.items.length)
}
function rowStyle(item: VirtualItem) {
  return { height: `${item.size}px`, transform: `translateY(${item.start}px)` }
}
</script>
