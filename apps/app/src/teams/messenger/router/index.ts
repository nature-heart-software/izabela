import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    name: 'settings',
    path: '/settings',
    component: import('@/teams/messenger/views/NvSettings.vue'),
    children: [
      {
        name: 'settings-overview',
        path: 'overview',
        component: import('@/teams/messenger/views/NvSettingsOverview.vue')
      },
      {
        name: 'settings-speech',
        path: 'speech',
        component: import('@/teams/messenger/views/NvSettingsSpeech.vue')
      },
      {
        name: 'settings-audio',
        path: 'audio',
        component: import('@/teams/messenger/views/NvSettingsAudio.vue')
      },
      {
        name: 'settings-dictionary',
        path: 'dictionary',
        component: import('@/teams/messenger/views/NvSettingsDictionary.vue')
      },
      {
        name: 'settings-startup',
        path: 'startup',
        component: import('@/teams/messenger/views/NvSettingsStartup.vue')
      },
      {
        name: 'settings-update',
        path: 'update',
        component: import('@/teams/messenger/views/NvSettingsUpdate.vue')
      },
    ]
  },
  {
    path: '/',
    redirect: {name: 'settings'}
  }
]

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
})

export default router
