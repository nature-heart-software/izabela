import { build } from 'vite'
// Type fixtures must not discover local environment files.
await build({ envFile: false })
