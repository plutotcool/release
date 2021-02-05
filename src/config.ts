import * as core from '@actions/core'
import path from 'path'
import { promises as fs } from 'fs'

const npmrc = path.resolve(
  process.env['RUNNER_TEMP'] || process.cwd(),
  '.npmrc'
)

export async function npmConfigRegistry(
  registryUrl: string, 
  token: string
): Promise<NodeJS.ProcessEnv> {
  if (!registryUrl.endsWith('/')) {
    registryUrl += '/'
  }

  core.info(`Setup NPM registry URL: ${registryUrl} on ${npmrc}`)

  registryUrl = registryUrl.replace(/(^\w+:|^)/, '') + ':_authToken=${NODE_AUTH_TOKEN}'
  await fs.writeFile(npmrc, registryUrl, 'utf-8')

  return {
    NPM_CONFIG_USERCONFIG: npmrc,
    NODE_AUTH_TOKEN: token
  }
}