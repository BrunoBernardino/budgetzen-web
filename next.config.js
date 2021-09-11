const path = require('path');
const withSass = require('@zeit/next-sass');
const withCss = require('@zeit/next-css');
const withPWA = require('next-pwa');

module.exports = withPWA({
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
  ...withCss(
    withSass({
      target: 'serverless',
      sassLoaderOptions: {
        includePaths: [
          path.join(__dirname, 'styles'),
          path.join(__dirname, 'node_modules'),
        ],
      },
      webpack(config) {
        config.resolve.alias.pages = path.join(__dirname, 'pages');
        config.resolve.alias.components = path.join(__dirname, 'components');
        config.resolve.alias.modules = path.join(__dirname, 'modules');
        config.resolve.alias.lib = path.join(__dirname, 'lib');
        config.resolve.alias.styles = path.join(__dirname, 'styles');
        return config;
      },
    }),
  ),
});
