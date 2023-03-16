const path = require('path');

const argv = require('yargs').argv;
const log = require('fancy-log');
const colors = require('ansi-colors');

const isProduction = process.env.NODE_ENV === 'production';
let pkg = {};
let env = 'development';
let noIndex = false;
let stripTestIds = isProduction;

if ((argv.env && argv.env !== 'undefined') || (argv.e && argv.e !== 'undefined')) {
  log(`Using environment(s): ${env}`);
}

if ('index' in argv && argv.index === 'false') {
  noIndex = !argv.index;
  log(colors.red(`️==============================================`));
  log(colors.white(`️Found '--index:false' in your command,`));
  log(colors.white(`️disabling search engine indexing for theme.`));
  log(colors.white(`️<meta name="robots" content="noindex, nofollow">`));
  log(colors.white(`️has been added to the <head> of your theme.`));
  log(colors.red(`️==============================================`));
  log(colors.red(`️==== USE INDEX:FALSE FOR THEME DEMOS ONLY ====`));
  log(colors.red(`️==============================================`));
}

if ('stripTestIds' in argv) {
  stripTestIds = argv.stripTestIds !== 'false';

  if (stripTestIds) {
    log(colors.red(`️Stripping test ids`));
  }
}

try {
  pkg = require(path.join(__dirname, '..', 'package.json'));
} catch (err) {
  log(colors.red(err));
}

module.exports = {
  packageJson: pkg,
  tkConfig: 'config.yml',
  noIndex,
  stripTestIds,

  src: {
    root: 'src',
    json: 'src/**/*.json',
    js: 'src/**/*.{js,js.liquid}',
    css: 'src/**/*.{css,scss,css.liquid,scss.liquid}',
    jsTemplates: 'src/**/*.js.liquid',
    cssTheme: 'src/css/theme.scss',
    cssTemplates: 'src/**/*.{css,scss}.liquid',
    svgTemplates: 'src/**/*.svg.liquid',
    assets: 'src/assets/**/*',
    nonLiquidAssets: 'src/assets/**/!(*.liquid)',
    icons: 'src/icons/**/*.svg',
    templates: 'src/templates/**/*.{liquid,json}',
    partials: 'src/partials/*',
    snippets: 'src/snippets/**/*.{liquid,json}',
    sections: 'src/sections/**/*.{liquid,json}',
    locales: 'src/locales/*',
    config: 'src/config/*',
    layout: 'src/layout/*',
    notes: 'src/release-notes.md',
    shopifyIgnore: 'src/.shopifyignore',
  },

  dist: {
    root: 'dist',
    assets: 'dist/assets',
    snippets: 'dist/snippets',
    render: 'dist/render',
    sections: 'dist/sections',
    layout: 'dist/layout',
    templates: 'dist/templates',
    locales: 'dist/locales',
    content: 'dist/content',
  },

  upload: {
    root: 'upload/',
  },

  plugins: {
    cheerio: {
      run: require('./build/utilities.js').processSvg,
    },
    svgmin: {
      plugins: ['removeTitle', 'removeDesc', {removeViewBox: false}],
    },
  },
};
