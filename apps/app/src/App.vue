<template>
  <template v-if="$store.state['electron-vuex'].persistedStateReady">
    <div class="h-0">
      <nv-messenger-wrapper
        class="h-0"
        :min-width="768"
        :width="$store.getters['messenger/persisted'].position.width"
        :transform="$store.getters['messenger/persisted'].position.transform"
      >
        <nv-messenger class="w-full h-full" />
      </nv-messenger-wrapper>
    </div>
  </template>
</template>
<style lang="scss">
body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

/* This is necessary to make click-through work with hardware acceleration */
body {
  pointer-events: none;
}

* {
  pointer-events: all;
}
</style>
<script>
import NvMessenger from '@/entities/messenger/components/Messenger/NvMessenger.vue'
import NvMessengerWrapper from '@/entities/messenger/components/Messenger/NvMessengerWrapper.vue'

export default {
  name: 'app',
  components: {
    NvMessenger,
    NvMessengerWrapper,
  },
}
</script>
