const { withPayload } = require('@payloadcms/next-payload')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
}

module.exports = withPayload(nextConfig, { configPath: './src/payload.config.ts' })
