import { app } from 'electron'
import { usePlayingMessageStore } from '@/features/messages/store'
import robot from '@jitsi/robotjs'
import { watch } from 'vue'

export default () =>
  app.whenReady().then(() => {
    const playingMessageStore = usePlayingMessageStore()
    robot.setKeyboardDelay(0)
    watch(
      () => playingMessageStore.isPlaying,
      (isPlaying) => {
        console.log('isPlaying', isPlaying)
        if (isPlaying) {
          robot.keyToggle('f3', 'down')
        } else {
          robot.keyToggle('f3', 'up')
        }
      },
    )
  })
