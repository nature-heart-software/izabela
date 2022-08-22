import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import NvSettings from '@/teams/messenger/views/NvSettings.vue'
import NvSettingsOverview from '@/teams/messenger/views/NvSettingsOverview.vue'
import NvSettingsSpeech from '@/teams/messenger/views/NvSettingsSpeech.vue'
import NvSettingsAudio from '@/teams/messenger/views/NvSettingsAudio.vue'
import NvSettingsDictionary from '@/teams/messenger/views/NvSettingsDictionary.vue'
import NvSettingsStartup from '@/teams/messenger/views/NvSettingsStartup.vue'
import NvSettingsUpdate from '@/teams/messenger/views/NvSettingsUpdate.vue'

const routes: Array<RouteRecordRaw> = [
  {
    name: 'settings',
    path: '/settings',
    component: NvSettings,
    children: [
      {
        name: 'settings-overview',
        path: 'overview',
        component: NvSettingsOverview,
      },
      {
        name: 'settings-speech',
        path: 'speech',
        component: NvSettingsSpeech,
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
        name: 'settings-startup',
        path: 'startup',
        component: NvSettingsStartup,
      },
      {
        name: 'settings-update',
        path: 'update',
        component: NvSettingsUpdate,
      },
    ],
  },
  {
    path: '/',
    redirect: { name: 'settings' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
