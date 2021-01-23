import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { promises as fs } from 'fs'

(async () => {
  try {
    const owner: string = github.context.repo.owner
    const ownerScope: string = `@${owner}`
    const npmToken: string = core.getInput('npm_token')
    const githubToken: string = core.getInput('github_token', { required: true })
    const publish: boolean = core.getInput('publish') !== 'false'

    let publishToGithub: boolean
    let publishToNPM: boolean
    let privatePackage: boolean
    let scope: string
    let cli: string
    let cliPath: string
    let release: (
      path: string,
      release: boolean,
      publish: boolean,
      env?: { [variable: string]: string }
    ) => Promise<void>

    try {
      await fs.access('lerna.json')
      cli = 'lerna'
      release = lernaRelease

      core.info(
        'Lerna detected, releasing using lerna'
      )
    } catch(_) {
      cli = 'semantic-release'
      release = semanticRelease

      core.info(
        'Lerna not detected, releasing using semantic-release'
      )
    }

    try {
      const pkg = JSON.parse((await fs.readFile('package.json')).toString())
      privatePackage = cli !== 'lerna' && pkg.private
      scope = pkg.name.slice(0, pkg.name.indexOf('/'))
      publishToGithub = publish && !privatePackage && scope === ownerScope
      publishToNPM = publish && !privatePackage && !!npmToken
    } catch (_) {
      privatePackage = true
      scope = ownerScope
      publishToGithub = false
      publishToNPM = false
    }

    if (!publish) {
      core.info(
        'Publishing disabled, skipping publishing to package registries'
      )
    } else if (privatePackage) {
      core.info(
        'Private package detected, skipping publishing to package registries'
      )
    } else {
      scope !== ownerScope && core.warning(
        `Package not scoped with ${ownerScope}, skipping publishing to GitHub registry`
      )

      !npmToken && core.warning(
        'NPM token not provided, skipping publishing to NPM registry'
      )
    }

    try {
      await fs.access(`node_modules/${cli}/package.json`)
    } catch (_) {
      core.info(
        `Installing ${cli}...`
      )

      await exec.exec('npm', [
        'install',
        cli,
        '--no-save',
        '--no-package-lock'
      ])

      core.info(
        `Installed ${cli}`
      )
    }

    cliPath = `node_modules/${cli}/${JSON
      .parse((await fs.readFile(`node_modules/${cli}/package.json`)).toString())
      .bin[cli]
    }`

    core.info(
      `Creating release on GitHub${publishToGithub ? ' and publishing to GitHub registry' : ''}...`
    )

    await release(cliPath, true, publishToGithub, {
      ...process.env,
      NPM_CONFIG_REGISTRY: `https://npm.pkg.github.com/${owner}`,
      NPM_TOKEN: githubToken,
      GITHUB_TOKEN: githubToken
    })

    core.info(
      'Release available on GitHub'
    )

    publishToGithub && core.info(
      'Package available on GitHub registry'
    )

    publishToNPM && core.info(
      'Publishing to NPM registry...'
    )

    await release(cliPath, false, publishToNPM, {
      ...process.env,
      NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org',
      NPM_TOKEN: npmToken
    })

    publishToNPM && core.info(
      'Package available on NPM registry'
    )
  } catch (error) {
    core.setFailed(error.message)
  }
})()

async function lernaRelease(
  path: string,
  release: boolean,
  publish: boolean,
  env: { [variable: string]: string } = {}
): Promise<void> {
  if (release) {
    await exec.exec('node', [
      path,
      'version',
      '--yes',
      '--conventional-commits'
    ], { env })
  }

  if (publish) {
    await fs.writeFile('.npmrc', `//${
      env.NPM_CONFIG_REGISTRY
    }/:_authToken=${
      env.NPM_TOKEN
    }`)

    console.log(`//${
      env.NPM_CONFIG_REGISTRY
    }/:_authToken=${
      env.NPM_TOKEN
    }`)

    await exec.exec('node', [
      path,
      'publish',
      'from-package',
      '--yes'
    ], { env })
  }
}

async function semanticRelease(
  path: string,
  release: boolean,
  publish: boolean,
  env: { [variable: string]: string } = {}
): Promise<void> {
  if (release) {
    await exec.exec('node', [
      path,
      '--no-ci',
      '--extends',
      `${__dirname}/../release.config.js`,
      '--plugins',
      '@semantic-release/commit-analyzer,' +
      '@semantic-release/release-notes-generator,' +
      '@semantic-release/github'
    ], { env })
  }

  if (publish) {
    await exec.exec('node', [
      path,
      '--no-ci',
      '--extends',
      `${__dirname}/../release.config.js`
    ], { env })
  }
}
