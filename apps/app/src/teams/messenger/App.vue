<template>
  <ThemeProvider :theme="$store.getters['theme']">
    <template v-if="ready">
      <div class="h-0">
        <NvMessenger
          :min-width="768"
          :transform="$store.getters['messenger/persisted'].position.transform"
          class="w-full h-full"
        />
      </div>
    </template>
  </ThemeProvider>
</template>
<style lang="scss">
body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}
</style>
<script lang="ts" setup>
import { ref } from 'vue'
import { ThemeProvider } from 'vue3-styled-components'
import NvMessenger from '@/teams/messenger/components/NvMessenger.vue'
import { useStore } from 'vuex'

const store = useStore()
const ready = ref(false)
store.state['electron-vuex'].ready().then(() => {
  ready.value = true
})
</script>
