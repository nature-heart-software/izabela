<template>
  <NvDialog
    v-model:open="open"
    :initial-focus-el="getSearchInput"
    portal-target="#settings"
  >
    <template #reference>
      <NvButton size="sm" :aria-label="`Browse processes for ${listName}`">
        Browse processes
      </NvButton>
    </template>
    <template #title>{{ listName }} processes</template>
    <template #footer>
      <NvStack spacing="4">
        <NvGroup no-wrap spacing="2">
          <NvInput
            ref="searchInput"
            v-model="query"
            :class="css({ flex: '1', minWidth: 0 })"
            size="sm"
            role="searchbox"
            aria-label="Search processes"
            placeholder="Search processes"
          />
          <NvButton size="sm" :disabled="!query" @click="clearSearch">
            Clear
          </NvButton>
          <NvButton size="sm" type="plain" :disabled="loading" @click="reload">
            Reload
          </NvButton>
        </NvGroup>
        <div
          v-if="loading"
          v-loading="true"
          data-loading-label="Loading processes"
          :class="css({ height: '15rem' })"
        />
        <div v-else :class="css({ maxHeight: '15rem', overflow: 'auto' })">
          <NvTable
            :data="rows"
            :show-header="false"
            :empty-text="emptyText"
            aria-label="Running processes"
            row-key="pattern"
          >
            <NvTableColumn prop="name" />
            <NvTableColumn align="right" :width="96">
              <template #default="{ row }">
                <NvButton
                  type="plain"
                  size="sm"
                  :aria-label="`${row.listed ? 'Remove' : 'Add'} ${row.name}`"
                  @click="toggle(row.pattern)"
                  >{{ row.listed ? 'Remove' : 'Add' }}</NvButton
                >
              </template>
            </NvTableColumn>
          </NvTable>
        </div>
      </NvStack>
    </template>
  </NvDialog>
</template>

<script lang="ts" setup>
import type { RunningOverlayProgram } from '@/modules/electron-resources'
import { css } from '@/styled-system/css'
import {
  NvButton,
  NvDialog,
  NvGroup,
  NvInput,
  NvStack,
  NvTable,
  NvTableColumn,
  loadingDirective as vLoading,
} from '@packages/ui'
import { computed, ref, watch } from 'vue'

defineProps<{ listName: 'Allowlist' | 'Denylist' }>()
const patterns = defineModel<string[]>({ required: true })

const open = ref(false)
const query = ref('')
const searchInput = ref<InstanceType<typeof NvInput>>()
const getSearchInput = () => searchInput.value?.input ?? null
const processes = ref<RunningOverlayProgram[]>([])
const loading = ref(false)
const loadFailed = ref(false)
const patternKey = (pattern: string) =>
  pattern.replaceAll('\\', '/').toLowerCase()
const listed = computed(() => new Set(patterns.value.map(patternKey)))

const rows = computed(() => {
  const search = query.value.trim().toLowerCase()
  return processes.value
    .filter(
      ({ name, executable }) =>
        name.toLowerCase().includes(search) ||
        executable.toLowerCase().includes(search),
    )
    .map(({ name, executable }) => {
      const pattern = `**/${executable}`
      return { name, pattern, listed: listed.value.has(patternKey(pattern)) }
    })
})

const emptyText = computed(() => {
  if (loadFailed.value) return 'Could not load running processes.'
  return query.value.trim()
    ? 'No matching processes.'
    : 'No running processes found.'
})

function clearSearch() {
  query.value = ''
  getSearchInput()?.focus()
}

async function reload() {
  if (loading.value) return
  loading.value = true
  loadFailed.value = false
  try {
    processes.value = await window.ElectronResources.getRunningOverlayPrograms()
  } catch {
    processes.value = []
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

watch(open, (isOpen) => {
  if (!isOpen) return
  query.value = ''
  void reload()
})

function toggle(pattern: string) {
  const key = patternKey(pattern)
  patterns.value = listed.value.has(key)
    ? patterns.value.filter((item) => patternKey(item) !== key)
    : [pattern, ...patterns.value]
}
</script>
