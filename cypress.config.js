const {defineConfig} = require('cypress');

module.exports = defineConfig({
  experimentalWebKitSupport: true,
  chromeWebSecurity: false,
  experimentalStudio: true,
  video: true,
  trashAssetsBeforeRuns: false,
  videoUploadOnPasses: false,
  screenshotOnRunFailure: true,

  env: {
    THEME_URL: 'http://127.0.0.1:9000',
    STOREFRONT_PASSWORD: 'password',
  },

  reporter: 'mochawesome',

  reporterOptions: {
    overwrite: false,
    html: false,
    json: true,
  },

  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl: 'http://127.0.0.1:9000/',
    experimentalSessionAndOrigin: true,
    specPattern: 'cypress/e2e/**/*.spec.*',
    excludeSpecPattern: ['**/*.unit.spec.*', '**/__snapshots__/*', '**/__image_snapshots__/*'],
  },
});
