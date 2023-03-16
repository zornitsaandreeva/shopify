const path = require('path');

const transform = require('gulp-transform');
const {Liquid} = require('liquidjs');

const config = require('../config');

// Renders templates using [[...]] and [%...%] liquid delimiters. These delimiters
// are useful in cases where we want to break templates into smaller files during
// theme development, but have them combined back together when pushing to shopify
function renderDevelopmentLiquid() {
  const liquid = new Liquid({
    outputDelimiterLeft: '[[',
    outputDelimiterRight: ']]',
    tagDelimiterLeft: '[%',
    tagDelimiterRight: '%]',
    root: [config.src.root],
    extname: '.liquid',
  });

  return transform('utf8', (content, file) => {
    switch (path.extname(file.path)) {
      case '.liquid':
        return liquid.parseAndRenderSync(
          content,
          {},
          {
            strictVariables: true,
          }
        );

      default:
        return content;
    }
  });
}
exports.renderDevelopmentLiquid = renderDevelopmentLiquid;
