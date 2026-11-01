import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'

// Compile the actual SFC graph with the library's @ alias and client renderers.
// Keeping this local avoids changing resolution for unrelated workspace suites.
export async function buildClient() {
  const packageRoot = fileURLToPath(new URL('..', import.meta.url))
  await build({
    configFile: false,
    envFile: false,
    root: packageRoot,
    logLevel: 'error',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../src', import.meta.url)),
        '@packages/design-tokens': fileURLToPath(
          new URL('../../design-tokens/src/main.ts', import.meta.url),
        ),
        '@packages/icons': fileURLToPath(
          new URL('../../icons/src/main.ts', import.meta.url),
        ),
      },
    },
    build: {
      outDir: fileURLToPath(
        new URL('../../../coverage/ui-client', import.meta.url),
      ),
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('./client-entry.ts', import.meta.url)),
        formats: ['es'],
        fileName: () => 'test-client.js',
      },
      rollupOptions: {
        external: (id) =>
          id === 'vue' ||
          id.startsWith('vue/') ||
          id === 'vue3-styled-components',
      },
    },
  })
}
await buildClient()
