const transform = require('gulp-transform');

// Strips data-test-id from templates
function stripDataTestId() {
  return transform('utf8', (content) => {
    return content.replace(/([\n\r\s]*)data-test-id=['"][^"']*['"]/gm, '');
  });
}

// Causes theme not to be indexed by search engines.
// WARNING: make sure this is only used for demo stores!!!!
function insertNoIndexHeader() {
  return transform('utf8', (content) => {
    return content.replace(/<head>/m, '  <head>\n<meta name="robots" content="noindex, nofollow">');
  });
}

exports.stripDataTestId = stripDataTestId;
exports.insertNoIndexHeader = insertNoIndexHeader;
