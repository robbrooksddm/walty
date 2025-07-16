// next.config.mjs
import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    /* ──────────────────────────────────────────────────────────────
       1.  Force every import of "styled-components" to resolve to
           the one copy in node_modules (your original rule)
    ────────────────────────────────────────────────────────────── */
    config.resolve.alias['styled-components'] = path.resolve(
      process.cwd(),
      'node_modules',
      'styled-components'
    )

    /* ──────────────────────────────────────────────────────────────
       2.  Let Webpack understand pre-compiled native addons (*.node)
           The tiny "node-loader" simply copies the file and makes the
           bundle call  require('./canvas.node')  at runtime.
           ▸  npm i -D node-loader
    ────────────────────────────────────────────────────────────── */
    config.module.rules.push({
      test: /\.node$/,
      loader: 'node-loader',
    })

    /* ──────────────────────────────────────────────────────────────
       3.  (Optional) On the server bundle, keep *.node binaries
           external so they’re not inlined into JavaScript. This
           regex catches  build/Release/canvas.node  and anything
           similar from other native deps.
    ────────────────────────────────────────────────────────────── */
    if (isServer) {
      config.externals.push(({ request }, cb) => {
        if (/\.node$/.test(request)) {
          return cb(null, 'commonjs ' + request)       // let Node load it
        }
        cb()
      })
    }

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
