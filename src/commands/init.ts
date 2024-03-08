import path from 'path'
import fs from 'fs-extra'
import { Command } from 'commander'
import ora from 'ora'
import * as z from 'zod'
import { logger } from '@/utils/logger'
import { transform } from '@/utils/transformers'
import { getProjectInfo } from '@/utils/get-project-info'
import {
  getConfig,
  rawConfigSchema,
  resolveConfigPaths,
  type Config,
} from '@/utils/get-config'

const isDev = process.env.NODE_ENV === 'development'

const initOptionsSchema = z.object({ cwd: z.string() })

export const init = new Command()
  .name('init')
  .description('initialize your project and install dependencies')
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory', process.cwd())
  .action(async (opts) => {
    try {
      const options = initOptionsSchema.parse(opts)
      const cwd = path.resolve(isDev ? path.join(options.cwd, 'test') : options.cwd)

      if (!fs.existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`)
        process.exit(1)
      }

      const existingConfig = await getConfig(cwd)

      if (existingConfig) {
        logger.error(`The path ${cwd} already contains a components.json file. Please try again.`)
        process.exit(1)
      }

      const config = await promptForConfig(cwd)

      if (!config) {
        logger.error(`The amino-ui CLI only supports Next.js projects for now. If you're using a different framework, you can copy and paste the component code into your app.`)
        process.exit(1)
      }

      const configPaths = await resolveConfigPaths(cwd, config)

      logger.info('')

      const spinner = ora(`Writing components.json...`).start()
      const targetPath = path.resolve(cwd, 'components.json')
      
      await fs.writeFile(targetPath, JSON.stringify(config, null, 2), 'utf8')

      spinner.succeed()

      await runInit(configPaths)

      // logger.info('')
      // logger.info(
      //   `${chalk.green('Success!')} Project initialization completed.`
      // )
      // logger.info('')
    } catch (error) {
      // handleError(error)
    }
  })

export async function promptForConfig(cwd: string) {
  const options = await getProjectInfo(cwd)

  if (!options) {
    return null
  }

  const pathDir = options.srcDir ? 'src/' : ''

  return rawConfigSchema.parse({
    $schema: 'https://amino-ui.com/schema.json',
    style: 'default',
    rsc: options.appDir,
    tsx: options.tsx,
    tailwind: {
      config: options.tailwindConfig,
      css: options.appDir ? `${pathDir}app/globals.css` : `${pathDir}styles/globals.css`,
      baseColor: 'slate',
      cssVariables: false,
    },
    aliases: {
      utils: `${options.pathPrefix}/lib/utils`,
      components: `${options.pathPrefix}/components`,
    },
  })
}

export async function runInit(config: Config) {
  const spinner = ora(`Initializing project...`)?.start()

  for (const [key, resolvedPath] of Object.entries(config.resolvedPaths)) {
    let dirname = path.extname(resolvedPath)
      ? path.dirname(resolvedPath)
      : resolvedPath

    if (key === 'utils' && resolvedPath.endsWith('/utils')) {
      dirname = dirname.replace(/\/utils$/, '')
    }

    if (!fs.existsSync(dirname)) {
      await fs.mkdir(dirname, { recursive: true })
    }
  }

  const extension = config.tsx ? 'ts' : 'js'
  const tailwindConfigRaw = await fs.promises.readFile(config.resolvedPaths.tailwindConfig, 'utf8')
  
  const L = await transform(
    {
      filename: config.resolvedPaths.tailwindConfig,
      raw: tailwindConfigRaw,
      config
    }
  )

  // // Write tailwind config.
  // await fs.writeFile(
  //   config.resolvedPaths.tailwindConfig,
  //   template(tailwindConfigTemplate)({
  //     extension,
  //     prefix: config.tailwind.prefix,
  //   }),
  //   'utf8'
  // )

  // // Write css file.
  // const baseColor = await getRegistryBaseColor(config.tailwind.baseColor)
  // if (baseColor) {
  //   await fs.writeFile(
  //     config.resolvedPaths.tailwindCss,
  //     config.tailwind.cssVariables
  //       ? config.tailwind.prefix
  //         ? applyPrefixesCss(baseColor.cssVarsTemplate, config.tailwind.prefix)
  //         : baseColor.cssVarsTemplate
  //       : baseColor.inlineColorsTemplate,
  //     'utf8'
  //   )
  // }

  // // Write cn file.
  // await fs.writeFile(
  //   `${config.resolvedPaths.utils}.${extension}`,
  //   extension === 'ts' ? templates.UTILS : templates.UTILS_JS,
  //   'utf8'
  // )

  // spinner?.succeed()

  // // Install dependencies.
  // const dependenciesSpinner = ora(`Installing dependencies...`)?.start()
  // const packageManager = await getPackageManager(cwd)

  // // TODO: add support for other icon libraries.
  // const deps = [
  //   ...PROJECT_DEPENDENCIES,
  //   config.style === 'new-york' ? '@radix-ui/react-icons' : 'lucide-react',
  // ]

  // await execa(
  //   packageManager,
  //   [packageManager === 'npm' ? 'install' : 'add', ...deps],
  //   {
  //     cwd,
  //   }
  // )
  // dependenciesSpinner?.succeed()
}
