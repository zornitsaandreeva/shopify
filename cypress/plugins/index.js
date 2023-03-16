const {startDevServer} = require('@cypress/webpack-dev-server');

module.exports = (on) => {
  on('dev-server:start', async (options) =>
    startDevServer({
      options,
    })
  );
};
