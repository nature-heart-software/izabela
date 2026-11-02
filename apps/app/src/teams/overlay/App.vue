<template>
  <ThemeProvider :theme="theme">
    <GlobalStyles>
      <div
        :style="{
          opacity: settingsStore.backgroundDimOpacity / 100,
          zIndex: -1,
        }"
        :class="
          css({
            position: 'fixed',
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
          })
        "
      ></div>
      <NvOverlayInput
        :class="
          css({
            width: '720px',
            position: 'fixed',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
          })
        "
      />
    </GlobalStyles>
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
import { css } from '@/styled-system/css'
import { useSettingsStore } from '@/features/settings/store'
import NvOverlayInput from '@/teams/overlay/components/NvOverlayInput.vue'
import { GlobalStyles, themes, tokens } from '@packages/ui'
import { ThemeProvider } from '@packages/ui'
import { computed } from 'vue'

const settingsStore = useSettingsStore()

const theme = computed(() => ({
  ...tokens,
  ...themes.get(settingsStore.theme),
}))
</script>
