import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import NvSettings from '@/teams/messenger/views/NvSettings.vue'
import NvSettingsGeneral from '@/teams/messenger/views/NvSettingsGeneral.vue'
import NvSettingsEngine from '@/teams/messenger/views/NvSettingsEngine.vue'
import NvSettingsAudioInput from '@/teams/messenger/views/NvSettingsAudioInput.vue'
import NvSettingsAudioOutputs from '@/teams/messenger/views/NvSettingsAudioOutputs.vue'
import NvSettingsDictionary from '@/teams/messenger/views/NvSettingsDictionary.vue'
import NvMessages from '@/teams/messenger/views/NvMessages.vue'
import NvMessagesHistory from '@/teams/messenger/views/NvMessagesHistory.vue'
import NvMessagesShortcuts from '@/teams/messenger/views/NvMessagesShortcuts.vue'
import NvSettingsCommands from '@/teams/messenger/views/NvSettingsCommands.vue'
import NvSettingsAbout from '@/teams/messenger/views/NvSettingsAbout.vue'
import NvSettingsSupport from '@/teams/messenger/views/NvSettingsSupport.vue'
import NvSettingsTranslation from '@/teams/messenger/views/NvSettingsTranslation.vue'

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
        name: 'settings-audio-outputs',
        path: 'audio-outputs',
        component: NvSettingsAudioOutputs,
      },
      {
        name: 'settings-audio-input',
        path: 'audio-input',
        component: NvSettingsAudioInput,
      },
      {
        name: 'settings-translation',
        path: 'translation',
        component: NvSettingsTranslation,
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
      {
        name: 'settings-about',
        path: 'about',
        component: NvSettingsAbout,
      },
      {
        name: 'settings-support',
        path: 'support',
        component: NvSettingsSupport,
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
