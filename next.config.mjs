import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force every import of “styled-components” to use the ONE copy
  // that lives at  node_modules/styled-components  (v 6.1.17)
  webpack: (config) => {
    config.resolve.alias['styled-components'] = path.resolve(
      process.cwd(),        // project root
      'node_modules',
      'styled-components'
    )
    return config
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
  },
}

export default nextConfig