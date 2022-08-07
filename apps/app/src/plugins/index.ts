function requireAll(r: __WebpackModuleApi.RequireContext) {
  r.keys().forEach(r)
}

requireAll(require.context('./', true, /register\.ts$/))
