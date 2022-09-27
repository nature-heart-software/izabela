import { watchHitbox } from '@/modules/vue-hitboxes'

watchHitbox('.el-select-dropdown')
watchHitbox('.tippy-box')
watchHitbox('.autocomplete')

function requireAll(r: __WebpackModuleApi.RequireContext) {
  r.keys().forEach(r)
}

requireAll(require.context('./', true, /register\.ts$/))
