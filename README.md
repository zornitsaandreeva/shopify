# Broadcast Theme

### [🏷️ Releases](https://github.com/invisiblethemes/broadcast/projects?type=classic)&nbsp;&nbsp;&nbsp;⎯⎯&nbsp;&nbsp;&nbsp;[💬 Discussions](https://github.com/invisiblethemes/broadcast/discussions)

Demos: [Clean](https://broadcast-clean.myshopify.com) // [Modern](https://broadcast-modern.myshopify.com) // [Bold](https://broadcast-bold.myshopify.com)

## Installation

#### Clone the repo:

```
git clone git@github.com:invisiblethemes/broadcast.git
```

#### Install packages

```
yarn install
```

⚠️ The recommended node version for running broadcast is Node v19.4.x

Our build process uses `fs.cp` to copy files from src to dist. This node library requires node `v19.1` or higher.
If you are running an older version of node, use `nvm install 19` then `nvm use 19` to upgrade to the latest stable node 14 build.


#### Setup Shopify CLI3

Install Shopify CLI with instructions [here](https://shopify.dev/themes/tools/cli/installation#macos)

⚠️ If you have version 2 of the CLI, check [here](https://shopify.dev/themes/tools/cli/migrate) for upgrade instructions



## Development

Start dev env:

```
yarn start
```

This will:
- Build the app using Gulp/Rollup
- Start `shopify theme dev` watching the `dist` folder
- Ask you to login to the specified store
- Open a browser window pointed to theme URL
- Watch for changes and rebuild which will trigger shopify CLI to push changes

### Config files

During development, it's useful to be able to quickly switch between different combos of themes, stores and settings.

To setup different environments create a checked in a `config.yml` file and a gitignored `config.dev.yml` file in the root directory, and add entries like

```yml
my-env:
  theme: 1234567890
  store: my-store.myshopify.com
  ignore:
    - some-file.json
```

The checked in `config.yml` file is meant for stores that will sync automatically. The `config.dev.yml` is used for personal development stores. 

### Development commands

Start your dev environment with `yarn start --env=my-env` or  `yarn start -e my-env`. This will effectively just call `shopify theme dev dist --store=my-store.myshopify.com --theme=12345` You can see this in the package.json file. Our live-sync is all handled by Shopify CLI3. Any command you add to the config file will be added as an arguments to the command line. This is what allows us to pass environment variables like `--store` and `--ignore` into the command. 

You can start multiple shopify processes for multiple dev environments with `yarn start --env=my-env,my-other-env`

This is useful for QA - you can sync code to a breaking QA store and a duplicate demo store at the same time, viewing changes to both environments in two browser windows.

## Deployment

### Deploying stores

You can To deploy to one or more stores for environment(s) listed in `config.yml` or `config.dev.yml` simple use the `deploy` command with the `--env` option

`yarn deploy --env my-store1`

The env command has a shorthand version of `-e` and can accept a comma-separated list of entries from `config.yml` or `config.dev.yml`:

`yarn deploy -e dev,qa,staging`

### Deploying demo stores

When we deploy to a Shopify Theme Store demo, we need to add `<meta name="robots" content="noindex, nofollow">` to the head. This is tedious to add manually. We must add this line of code to prevent the demo stores from being indexed by Google and other search engines. 

To make this Shopify requirement easy, our build process has a special command that will add "noindex/nofollow" to the head. You can turn it on by adding `--index=false` to the deploy command.

`yarn deploy -e my-store1 --no-index`

A command to deploy to all the demos might look something like this:
```
"NODE_ENV=production gulp deploy --index=false --env clothing-demo,skin-demo,shoes-demo,swim-demo",
```

🚨 Never use the `--index=false` flag on a merchant store. This command exists strictly for Shopify Theme Store demo stores. This line of code would *destroy* the SEO of a merchant store.


## Partials

Our build process sues Liquid JS to combine files locally.

Use a folder called `partials` in your local dev environment.  

Use the tag `[% render 'partials/product-form' %]`
