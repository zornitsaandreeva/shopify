/* eslint-disable require-await */
/* eslint-disable compat/compat */
const path = require('path');
const {spawn} = require('child_process');
const {readFileSync, existsSync} = require('fs');
const {cp} = require('fs/promises');

const yargs = require('yargs');
const {parse} = require('yaml');
const log = require('fancy-log');
const colors = require('ansi-colors');

// Start shopify theme serve in a new process
exports.startShopifyDevProcesses = async function (done) {
  const {env: envs = 'development', _: rest} = yargs(process.argv.slice(3)).parserConfiguration({'unknown-options-as-args': true}).string('env').alias('e', 'env').argv;

  const yaml = loadConfigFiles();

  let basePort = 9000;

  for (const [index, env] of envs.split(',').entries()) {
    const {[env]: configuration} = yaml;

    if (!configuration) {
      log(colors.red(`Could not find environment configuration for ${env} in config.yml`));
      process.exit(1);
    }

    const portArg = basePort + index;

    await startShopifyDevProcess(env, configuration, portArg, rest);
  }

  done();
};

// Start shopify theme serve in a new process
exports.deployShopifyStores = async function (done) {
  // Extract "env" arg, and collect the rest to pass directly to shopify CLI
  const {env: envs = 'development', _: rest} = yargs(process.argv.slice(3)).parserConfiguration({'unknown-options-as-args': true}).string('env').alias('e', 'env').argv;

  const yaml = loadConfigFiles();

  for (const env of envs.split(',')) {
    const {[env]: configuration} = yaml;

    if (!configuration) {
      log(colors.red(`Could not find environment configuration for ${env} in config.yml`));
      process.exit(1);
    }

    await copyEnvironmentConfigToDist(env);
    await deployShopifyStore(env, configuration, rest);
  }

  done();
};

async function deployShopifyStore(_env, configuration, initialArgs = []) {
  return new Promise((resolve, reject) => {
    const options = serializeConfigurationToCliArgs(configuration);
    const args = ['theme', 'push', '--path=dist', ...options, ...initialArgs].filter(Boolean);

    log(colors.white(`Deploying ${configuration.store} with ${configuration.theme || 'development theme'}`));
    log(colors.grey(['shopify', ...args].join(' ')));

    let shopifyProcess = spawn('shopify', args, {stdio: ['inherit', 'inherit', 'inherit']});

    shopifyProcess.on('error', (error) => {
      log(colors.red(error.message));
      reject(error.message);
    });

    shopifyProcess.on('close', (code) => {
      if (code == 0) {
        resolve();
      } else {
        reject(`child process exited with code ${code}`);
      }
    });

    shopifyProcess.on('message', (message) => {
      console.log(`child process message ${message}`);
      resolve();
    });

    process.on('SIGINT', function () {
      // Make sure we kill shopify process when main gulp process dies
      if (shopifyProcess) {
        console.log(`Stopping PID...`);
        shopifyProcess.kill('SIGKILL');
      }
      process.exit(0);
    });

    return shopifyProcess;
  });
}

async function startShopifyDevProcess(_env, configuration, port, initialArgs) {
  return new Promise((resolve, reject) => {
    const options = serializeConfigurationToCliArgs(configuration);
    const args = ['theme', 'dev', '--path=dist', `--port=${port}`, ...options, ...initialArgs].filter(Boolean);

    log(colors.white(`Starting shopify theme dev with ${configuration.store} and ${configuration.theme || 'development theme'} on port ${port}`));
    log(colors.grey(['shopify', ...args].join(' ')));

    let shopifyProcess = spawn('shopify', args, {stdio: ['inherit', 'pipe', 'inherit']});

    shopifyProcess.stdout.on('data', (data) => {
      const stringData = data.toString();

      if (stringData.match(/Use Ctrl-C to stop/)) {
        // Once theme has been deployed, resolve to allow the next shopify process to start
        resolve();
      }

      process.stdout.write(data);
    });

    shopifyProcess.on('error', (error) => {
      log(colors.red(error.message));
      reject();
    });

    shopifyProcess.on('close', (code) => {
      if (code == 0) {
        resolve();
      } else {
        reject(`child process exited with code ${code}`);
      }
    });

    process.on('SIGINT', function () {
      // Make sure we kill shopify process when main gulp process dies
      if (shopifyProcess) {
        console.log(`Stopping PID ${shopifyProcess.pid}...`);
        shopifyProcess.kill('SIGKILL');
      }
      process.exit(0);
    });

    return shopifyProcess;
  });
}

/**
 * Serialize an environment configuration from config.yml into command line args
 * @param {*} configuration Configuration for an environment from config.yml
 * @returns
 */
function serializeConfigurationToCliArgs(configuration) {
  return Object.keys(configuration).reduce((commands, key) => {
    const value = configuration[key];

    if (Array.isArray(value)) {
      return [...commands, ...value.map((v) => `--${key}=${v}`)];
    } else if (typeof value === 'string' || typeof value === 'number') {
      return [...commands, `--${key}=${value}`];
    } else {
      throw new Error(`Value ${JSON.stringify(value)} is not supported`);
    }
  }, []);
}

async function copyEnvironmentConfigToDist(env) {
  const sourcePath = path.join(__dirname, '..', '..', 'environments', env);
  const destPath = path.join(__dirname, '..', '..', 'dist');

  if (existsSync(sourcePath)) {
    // TODO: wip config / templates first

    log(colors.white(`Copying environment config files from ${path.relative(path.join(__dirname, '..', '..'), sourcePath)} to ${path.relative(path.join(__dirname, '..', '..'), destPath)}`));
    return cp(sourcePath, destPath, {force: true, recursive: true});
  }
}

/**
 *  Loads config.yml and overrides it with config.dev.yaml
 */
function loadConfigFiles() {
  const configGlobal = readFileSync(path.join(__dirname, '..', '..', 'config.yml')).toString();
  let yaml = parse(configGlobal);

  // dev can override defaults locally in a gitignored file
  const configDev = path.join(__dirname, '..', '..', 'config.dev.yml');
  if (existsSync(configDev)) {
    log(colors.white(`Found config.dev.yml overrides`));
    const yamlOverrides = parse(readFileSync(configDev).toString());
    yaml = {...yaml, ...yamlOverrides};
  }

  checkConfigYmlForPasswords(yaml);
  return yaml;
}

/**
 *  Warns uses if their config.yml contains passwords
 */
function checkConfigYmlForPasswords(yaml) {
  let envsWithPasswords = [];

  Object.keys(yaml).forEach((key) => {
    if (yaml[key].password) {
      envsWithPasswords = [...envsWithPasswords, key];
    }
  });

  if (envsWithPasswords.length) {
    log(
      colors.red(
        `️💀 Uh oh, looks like the following environments in config.yml contains passwords: \n` +
          envsWithPasswords.join('\n') +
          `\n` +
          `These are no longer supported by Shopofy and are a security risk, please remove them before continuing`
      )
    );

    process.exit(1);
  }
}
