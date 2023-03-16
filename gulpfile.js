const path = require('path');

const plumber = require('gulp-plumber');
const svgmin = require('gulp-svgmin');
const rename = require('gulp-rename');
const cheerio = require('gulp-cheerio');
const del = require('del');
const gulpZip = require('gulp-zip');
const cssimport = require('gulp-cssimport');
const size = require('gulp-size');
const postcss = require('gulp-postcss');
const {series, parallel, dest, src, watch} = require('gulp');
const rollup = require('rollup');
const log = require('fancy-log');
const colors = require('ansi-colors');
const loadConfigFile = require('rollup/loadConfigFile');
const sass = require('gulp-dart-sass');
const gulpIf = require('gulp-if');
const autoprefixer = require('autoprefixer');

const config = require('./lib/config');
const {startShopifyDevProcesses, deployShopifyStores} = require('./lib/build/shopify.js');
const {renderDevelopmentLiquid} = require('./lib/build/liquid.js');
const {stripDataTestId, insertNoIndexHeader} = require('./lib/build/html.js');

const configPath = path.join(__dirname, 'rollup.config.js');

/*
Command functions
*/

// Compile and outut assets to dist folder
function compileAssets() {
  log(colors.white('Compiling assets'));

  // Copy assets to dist
  src([config.src.nonLiquidAssets, config.src.notes, config.src.shopifyIgnore], {
    base: config.src.root,
    allowEmpty: true,
  })
    .pipe(plumber(handleError))
    .pipe(size({showFiles: true, pretty: true}))
    .pipe(dest(config.dist.root));

  // Render files in "official" shopify folders with liquid and then copy to their respective folders in dist/
  src([config.src.snippets, config.src.sections, config.src.templates, config.src.locales, config.src.config, config.src.layout], {
    base: config.src.root,
    allowEmpty: true,
  })
    .pipe(plumber(handleError))
    .pipe(size({showFiles: true, pretty: true}))
    .pipe(renderDevelopmentLiquid())
    .pipe(gulpIf(config.stripTestIds, stripDataTestId()))
    .pipe(gulpIf(config.noIndex, insertNoIndexHeader()))
    .pipe(dest(config.dist.root));

  // Render all other assets liquid then copy to to assets/
  return src([config.src.cssTemplates, config.src.jsTemplates, config.src.svgTemplates], {base: config.src.root, allowEmpty: true})
    .pipe(plumber(handleError))
    .pipe(size({showFiles: true, pretty: true}))
    .pipe(
      rename({
        dirname: '',
      })
    )
    .pipe(renderDevelopmentLiquid())
    .pipe(dest(config.dist.assets));
}

// Minify SVGs, replace .liquid extension, and output to dist/snippets
function compileIcons() {
  log(colors.white('Processing SVGs'));

  return src(config.src.icons)
    .pipe(svgmin(config.plugins.svgmin))
    .pipe(cheerio(config.plugins.cheerio))
    .pipe(
      size({
        showFiles: true,
        pretty: true,
      })
    )
    .pipe(
      rename({
        extname: '.liquid',
      })
    )
    .pipe(plumber(handleError))
    .pipe(dest(config.dist.snippets));
}

// Compile JS assets using rollup and output to dist
function compileJS() {
  log(colors.white('Compiling JS'));

  // load the config file next to the current script;
  // the provided config object has the same effect as passing "--format es"
  // on the command line and will override the format of all outputs
  return loadConfigFile(configPath)
    .then(async ({options, warnings}) => {
      log(colors.cyan('Rollup 🍣'), 'Loaded', colors.white('config loaded'), 'from', colors.white(configPath));

      // // "warnings" wraps the default `onwarn` handler passed by the CLI.
      // // This prints all warnings up to this point:
      log(`We currently have ${warnings.count} warnings`);

      // This prints all deferred warnings
      warnings.flush();

      // options is an array of "inputOptions" objects with an additional "output"
      // property that contains an array of "outputOptions".
      // The following will generate all outputs for all inputs, and write them to disk the same
      // way the CLI does it:
      for (const optionsObj of options) {
        const bundle = await rollup.rollup(optionsObj);
        await Promise.all(optionsObj.output.map(bundle.write));
      }
    })
    .catch(handleError);
}

// Process CSS with PostCSS and copy to dist/assets
function compileCss() {
  return src([config.src.cssTheme])
    .pipe(plumber(handleError))
    .pipe(
      cssimport({
        extensions: ['scss'],
      })
    )
    .pipe(sass().on('error', handleError))
    .pipe(postcss([autoprefixer]))
    .pipe(
      // Move all nested css into toplevel assets folder
      rename((path) => ({
        ...path,
        dirname: '/',
      }))
    )
    .pipe(dest(config.dist.assets));
}

// Zip theme and output to dist
function zip() {
  return src(path.join(config.dist.root, '**', '*'))
    .pipe(plumber(handleError))
    .pipe(gulpZip(`${config.packageJson.name}-${config.packageJson.version}.zip` || 'theme.zip'))
    .pipe(size({showFiles: true, pretty: true}))
    .pipe(dest(config.upload.root));
}

// Delete config.yml from dist, very important that this does not end up in the theme store!!!
function cleanConfig() {
  return del(path.join(config.dist.root, config.tkConfig));
}

// Clean dist folder
function cleanAll() {
  return del(path.join(config.dist.root, '**/*'));
}

const buildAll = parallel(compileCss, compileJS, compileAssets, compileIcons);

// Watch all theme assets and rebuild when changed
async function watchAll(done) {
  // Rebuild JS and hot reload when JS changes
  watch(config.src.js, compileJS);

  // Rebuild CSS and hot reload when JS changes
  watch(config.src.css, compileCss);

  // Compile assets (.liquid files, etc) when they change
  watch(path.join('src', '**', '!(*.{js,scss,css})'), series(compileAssets));

  // Process SVGs when they change
  watch(config.src.icons, compileIcons);

  done();
}

/*
Command configuration
*/

exports.compileCss = series(cleanAll, compileCss);
exports.compileAssets = series(cleanAll, compileAssets);
exports.watch = series(cleanAll, buildAll, parallel(watchAll, startShopifyDevProcesses));
exports.deploy = series(cleanAll, buildAll, deployShopifyStores);
exports.build = series(cleanAll, buildAll);
exports.zip = series(cleanAll, buildAll, cleanConfig /* <- VERY IMPORTANT, DO NOT REMOVE */, zip);
exports.default = series(cleanAll, buildAll);

function handleError(err) {
  log(colors.red(err));
  throw err;
}
