<template>
  <ThemeProvider :theme="$store.getters['theme']">
    <template v-if="ready">
      <div class="h-0">
        <Messenger
          :min-width="768"
          :transform="$store.getters['messenger/persisted'].position.transform"
          class="w-full h-full"
        />
      </div>
      <SpeechListener :key="$store.getters['settings/persisted'].audioInputDevice" />
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
import Messenger from '@/entities/messenger/components/Messenger.vue'
import SpeechListener from '@/entities/speech/components/SpeechListener.vue'

export default {
  name: 'app',
  components: {
    Messenger,
    ThemeProvider,
    SpeechListener,
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
