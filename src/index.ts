#!/usr/bin/env node

import { Command } from 'commander'
import { init } from '@/commands/init'
import { getPackageInfo } from '@/utils/get-package-info'

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

function main() {
  const packageInfo = getPackageInfo()

  const program = new Command()
    .name('amino-ui')
    .description('add components and dependencies to your project')
    .version(packageInfo.version || '0.1.0', '-v, --version', 'display the version number')

  program.addCommand(init)

  program.parse()
}

main()
