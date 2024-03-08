import path from 'path'
import fs from 'fs-extra'
import { type PackageJson } from 'type-fest'
import { logger } from '@/utils/logger'

export function getPackageInfo(): PackageJson {
  const packageJsonPath = path.join('package.json')

  if (!fs.existsSync(packageJsonPath)) {
    logger.error(`No package.json found at ${packageJsonPath}. Are you in the right directory?`)
    process.exit(1)
  }

  return fs.readJSONSync(packageJsonPath) as PackageJson
}
