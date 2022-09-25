import { watchBoundary } from '@/modules/vue-dom-boundaries'

watchBoundary('.el-select-dropdown')
watchBoundary('.tippy-box')
watchBoundary('.autocomplete')

function requireAll(r: __WebpackModuleApi.RequireContext) {
  r.keys().forEach(r)
}

requireAll(require.context('./', true, /register\.ts$/))
