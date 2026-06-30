import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(async () => {
  const localUiRoot = path.resolve(__dirname, '../taqseet-ui/packages/react')
  const localViteSharedPath = path.join(localUiRoot, 'vite.shared.js')
  const localUiCssPath = path.join(localUiRoot, 'dist/index.css')

  const aliasEntries: Array<{ find: string; replacement: string }> = []

  if (existsSync(localUiCssPath)) {
    aliasEntries.push({
      find: '@idalovkh/taqseet-ui-react/dist/index.css',
      replacement: localUiCssPath,
    })
  }

  if (existsSync(localViteSharedPath)) {
    const sharedModule = await import(localViteSharedPath)
    const createTaqseetUiAliases = sharedModule.createTaqseetUiAliases as (
      rootDir: string,
      options: { mode: 'full' | 'styles-only' }
    ) => Record<string, string>
    aliasEntries.push(
      ...Object.entries(createTaqseetUiAliases(__dirname, { mode: 'full' })).map(
        ([find, replacement]) => ({ find, replacement }),
      ),
    )
  }

  return {
    plugins: [react()],
    resolve: {
      alias: [
        ...aliasEntries,
        { find: '@', replacement: path.resolve(__dirname, './src') },
      ],
    },
    server: {
      port: 3005,
      proxy: {
        '/api': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        },
        '/oauth2': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        },
        '/.well-known': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
