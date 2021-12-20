import * as core from '@actions/core'
import path from 'path'
import { promises as fs } from 'fs'

const npmrc = path.resolve(
  process.env['RUNNER_TEMP'] || process.cwd(),
  '.npmrc'
)

export async function npmConfig(
  registryUrl: string,
  token: string,
  message: string
): Promise<NodeJS.ProcessEnv> {
  if (!registryUrl.endsWith('/')) {
    registryUrl += '/'
  }

  core.info(`Setup NPM registry URL: ${registryUrl} on ${npmrc}`)

  await fs.writeFile(npmrc, (
    `${registryUrl.replace(/(^\w+:|^)/, '')}:_authToken=\${NODE_AUTH_TOKEN}\n` +
    `message=${message}\n`
  ), 'utf-8')

  return {
    NPM_CONFIG_USERCONFIG: npmrc,
    NODE_AUTH_TOKEN: token
  }
}
