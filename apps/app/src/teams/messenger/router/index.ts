import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import NvSettings from '@/teams/messenger/views/NvSettings.vue'
import NvSettingsGeneral from '@/teams/messenger/views/NvSettingsGeneral.vue'
import NvSettingsEngine from '@/teams/messenger/views/NvSettingsEngine.vue'
import NvSettingsAudio from '@/teams/messenger/views/NvSettingsAudio.vue'
import NvSettingsDictionary from '@/teams/messenger/views/NvSettingsDictionary.vue'
import NvMessages from '@/teams/messenger/views/NvMessages.vue'
import NvMessagesHistory from '@/teams/messenger/views/NvMessagesHistory.vue'
import NvMessagesShortcuts from '@/teams/messenger/views/NvMessagesShortcuts.vue'
import NvSettingsCommands from '@/teams/messenger/views/NvSettingsCommands.vue'

const routes: Array<RouteRecordRaw> = [
  {
    name: 'settings',
    path: '/settings',
    component: NvSettings,
    children: [
      {
        name: 'settings-general',
        path: 'general',
        component: NvSettingsGeneral,
      },
      {
        name: 'settings-engine',
        path: 'engine',
        component: NvSettingsEngine,
      },
      {
        name: 'settings-audio',
        path: 'audio',
        component: NvSettingsAudio,
      },
      {
        name: 'settings-dictionary',
        path: 'dictionary',
        component: NvSettingsDictionary,
      },
      {
        name: 'settings-commands',
        path: 'commands',
        component: NvSettingsCommands,
      },
    ],
  },
  {
    name: 'messages',
    path: '/messages',
    component: NvMessages,
    children: [
      {
        name: 'messages-history',
        path: 'history',
        component: NvMessagesHistory,
      },
      {
        name: 'messages-shortcuts',
        path: 'shortcuts',
        component: NvMessagesShortcuts,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
