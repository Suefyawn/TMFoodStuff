const { withPayload } = require('@payloadcms/next/withPayload')
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'media.barakatfresh.ae' },
      { protocol: 'https', hostname: '*.barakatfresh.ae' },
    ],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data: https: blob:;",
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Ensure @payload-config alias resolves correctly
    config.resolve.alias['@payload-config'] = path.resolve(__dirname, 'src/payload.config.ts')
    return config
  },
}

module.exports = withPayload(nextConfig, {
  configPath: path.resolve(__dirname, 'src/payload.config.ts'),
})
