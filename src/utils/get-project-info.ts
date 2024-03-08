import path from 'path'
import fs from 'fs-extra'

export async function getProjectInfo(cwd: string) {
  const nextConfigPaths = [
    'next.config.js',
    'next.config.ts',
    'next.config.mjs',
  ]

  const nextConfig = nextConfigPaths.some((pth) => fs.existsSync(path.resolve(cwd, pth)))

  if (!nextConfig) {
    return null
  }

  try {
    const tsconfig = await getTsConfig(cwd)

    if (!tsconfig) {
      return null
    }

    return {
      srcDir: fs.existsSync(path.resolve(cwd, './src')),
      appDir: fs.existsSync(path.resolve(cwd, './app')) || fs.existsSync(path.resolve(cwd, './src/app')),
      pathPrefix: Object.keys(tsconfig.compilerOptions?.paths).find((key) => key.endsWith('/*'))?.slice(0, -2),
      tsx: await hasTsConfig(cwd),
      tailwindConfig: fs.existsSync(path.resolve(cwd, 'tailwind.config.ts'))
        ? 'tailwind.config.ts'
        : 'tailwind.config.js',
    }
  } catch (error) {
    return null
  }
}

export async function getTsConfig(cwd: string) {
  try {
    if (await hasTsConfig(cwd)) {
      const tsconfigPath = path.resolve(cwd, 'tsconfig.json')
      const tsconfig = await fs.readJSON(tsconfigPath)

      if (!tsconfig) {
        throw new Error('tsconfig.json is missing')
      }

      return tsconfig
    }

    const jsconfigPath = path.resolve(cwd, 'jsconfig.json')

    if (jsconfigPath) {
      const jsconfig = await fs.readJSON(jsconfigPath)

      if (!jsconfig) {
        throw new Error('jsconfig.json is missing')
      }

      return jsconfig
    }
  } catch (error) {
    return null
  }
}

async function hasTsConfig(cwd: string) {
  return await fs.pathExists(path.resolve(cwd, 'tsconfig.json'))
}
