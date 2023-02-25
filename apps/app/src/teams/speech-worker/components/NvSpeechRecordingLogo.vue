<template>
  <div class="animation-wrapper bg-gray-0 opacity-50 rounded">
    <div id="outer-circle" class="circle"></div>
    <div id="inner-circle" class="circle"></div>
  </div>
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
  border: 8px solid #444444;
  animation: outer-border ease-out 1s infinite;
}

#inner-circle {
  width: 24px;
  height: 24px;
  background-color: #0E0E2C;
  animation: inner-border ease-out 1s infinite;
  animation-delay: 0.25s;
}
</style>
