import { defineConfig } from 'tsup'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  target: 'esnext',
  sourcemap: isDev,
  dts: isDev,
  onSuccess: isDev ? 'pnpm start' : undefined,
  format: 'esm',
  clean: !isDev,
  minify: !isDev,
})
