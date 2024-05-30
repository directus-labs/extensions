# Contributing

Hello! Thanks for your interest in contributing to this project. 🐰 💕

We welcome issues being submitted for bugs or small tweaks in existing extensions, but not requests or contributions for new extensions.

Similarly, community contributions (Pull Requests) are welcome for small enhancements and bug fixes. Please make sure your contributions follow our standard [Pull Request Process](https://docs.directus.io/contributing/pull-request-process). This requires an issue being submitted and triaged before a PR can be opened for review.

## Getting Started

A couple of important notes before continuing:

* Please see our docs on [how to publish an extension to the Marketplace](//docs.directus.io/extensions/marketplace/publishing.html) if you would like to publish your own extension
* You will need to review the [Contributor License Agreement](https://github.com/directus-labs/extensions/blob/main/cla.md) (CLA) for this project and sign it by adding your GitHub username to [the contributors.yml file](https://github.com/directus-labs/extensions/blob/main/contributors.yml) in your first Pull Request
  * If you have contributed to the core [@directus/directus](https://github.com/directus/directus) project before, the CLA is the same for both projects
* Any Pull Request that is opened without a relevant approved issue will be closed without further comment
* All contributors are subject to our [Code of Conduct](https://docs.directus.io/contributing/code-of-conduct.html)

There are plenty of other ways to contribute to the Directus project as well if you'd like to help. Please see our [contributing guidelines](https://docs.directus.io/contributing/introduction) to learn more.

### Download the project

```sh
git clone git@github.com:directus-labs/extensions.git
cd extensions && pnpm install
```

### Start the development environment

A development environment has been provided in the project repo. To use it, make sure you have mkcert and Docker (with Compose) installed on your development system.

1. Add `127.0.0.1 extensions.directus.labs` to your `/etc/hosts` file
2. Run `pnpm mkcert` in the project directory to generate TLS files
3. Run `docker compose up -d` in the project directory

You can navigate to <https://extensions.directus.labs> and login with `admin@directus.dev` and `password` for the credentials.

If you are developing a new extension, you will need to have the extension created and the branch with the new extension checkout before starting the containers. After the initial load, extensions will be automatically be reloaded when the code changes. You may need to hard refresh the browser for changes to show.

## Add a New Extension

> Note: Only core team members and contracted Extension Experts can submit new extensions.

Developing ...
