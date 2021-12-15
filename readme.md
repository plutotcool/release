# Release Action

> GitHub Action to automatically release packages using lerna or semantic-release.

- Automatically bump packages version using [semantic-release](https://github.com/semantic-release/semantic-release) (or [lerna](https://github.com/lerna/lerna) which also relies on semantic-release)
- Create releases on GitHub
- Publish to GitHub and NPM registries

Publishing on package registries is skipped if there is not any `package.json` or if its `private` field is set to true.

Publishing on GitHub registry is skipped if the package name is not [scoped with the GitHub owner name](https://docs.github.com/en/free-pro-team@latest/packages/using-github-packages-with-your-projects-ecosystem/configuring-npm-for-use-with-github-packages#publishing-a-package).

Publishing on NPM registry is skipped if no [NPM token](https://docs.npmjs.com/about-access-tokens) is provided.

## Usage

In `.github/workflows/release.yml`:

```yaml
on:
  push:
    branches:
    - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v1
      with:
        node-version: 14
    - run: yarn
    - run: yarn build
    - uses: plutotcool/release@v1
      with:
        github_token:  ${{ secrets.GITHUB_TOKEN }}
        npm_token: ${{ secrets.NPM_TOKEN }}
```

## Inputs

### `github_token`

`string` *(required)*

[GitHub Token](https://docs.github.com/en/free-pro-team@latest/actions/reference/authentication-in-a-workflow#about-the-github_token-secret) used to create the release on GitHub and publish on GitHub registry.

### `npm_token`

`string` *(optional)*

[NPM token](https://docs.npmjs.com/about-access-tokens) with publish permission. If not provided, publishing to npm registry will be skipped.

### `publish`

`string` *(optional, default `true`)*

Enable or disable publishing to package registries. When set to false, only releases are created on GitHub.
