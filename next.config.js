const path = require('path');
const withPWA = require('next-pwa');

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self' https://*.userbase.com wss://*.userbase.com https://*.stripe.com data: blob:; child-src 'self' data: blob: https://*.stripe.com; img-src 'self' https://*.usefathom.com data: blob: https://*.stripe.com; style-src 'self' 'unsafe-inline' https://*.stripe.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.usefathom.com https://*.stripe.com",
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

module.exports = withPWA({
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
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
  async headers() {
    return [
      {
        source: '/',
        headers: securityHeaders,
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
});
