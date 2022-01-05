<template>
  <ThemeProvider :theme="$store.getters['theme']">
    <template v-if="ready">
      <div class="h-0">
        <nv-messenger
          class="w-full h-full"
          :min-width="768"
          :transform="$store.getters['messenger/persisted'].position.transform"
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
<script>
import { ref } from 'vue'
import { ThemeProvider } from 'vue3-styled-components'
import NvMessenger from '@/entities/messenger/components/Messenger/NvMessenger.vue'

export default {
  name: 'app',
  components: {
    NvMessenger,
    ThemeProvider,
  },
  setup() {
    return {
      ready: ref(false),
    }
  },
  mounted() {
    this.$store.state['electron-vuex'].ready().then(() => {
      this.ready = true
    })
  },
}
</script>
