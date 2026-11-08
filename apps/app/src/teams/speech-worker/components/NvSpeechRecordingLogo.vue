<template>
  <ThemeProvider :theme="theme">
    <GlobalStyles
      class="animation-wrapper"
      :class="
        css({
          backgroundColor: 'loading.default.pending.background',
          opacity: 0.5,
          borderRadius: 'md',
        })
      "
    >
      <div
        id="outer-circle"
        class="circle"
        :class="
          css({ border: '8px solid {colors.loading.default.pending.spinner}' })
        "
      ></div>
      <div
        id="inner-circle"
        class="circle"
        :class="css({ backgroundColor: 'loading.default.pending.spinner' })"
      ></div>
    </GlobalStyles>
  </ThemeProvider>
</template>
<style lang="scss">
@keyframes outer-border {
  0% {
    width: 48px;
    height: 48px;
  }
  /* 15% {
    width: 56px;
    height: 56px;
  } */
  50% {
    width: 56px;
    height: 56px;
  }
  100% {
    width: 48px;
    height: 48px;
  }
}

@keyframes inner-border {
  0% {
    width: 16px;
    height: 16px;
  }
  /* 35% {
    width: 32px;
    height: 32px;
  } */
  50% {
    width: 24px;
    height: 24px;
  }
  100% {
    width: 16px;
    height: 16px;
  }
}

* {
  box-sizing: border-box;
}

.animation-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
}

.circle {
  border-radius: 9999px;
  position: absolute;
}

#outer-circle {
  width: 56px;
  height: 56px;
  animation: outer-border ease-out 1s infinite;
}

#inner-circle {
  width: 24px;
  height: 24px;
  animation: inner-border ease-out 1s infinite;
  animation-delay: 0.25s;
}
</style>

<script setup lang="ts">
import { css } from '@/styled-system/css'
import { computed } from 'vue'
import { GlobalStyles, resolveTheme, ThemeProvider } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
const theme = computed(() => resolveTheme(settingsStore.theme))
</script>
