const path = require('path')
const fs = require('fs')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
module.exports = {
  publicRuntimeConfig: {
    origin: 'https://cfde-gene-pages.maayanlab.cloud',
    gaId: 'G-J69H7NSWHW',
  },
  webpack: process.env.NEXTJS_BUILD_SERVICES ? (config, { isServer }) => {
    if (isServer) {
      return {
        ...config,
        entry() {
          return config.entry().then(entry => {
            const _entry = { ...entry }
            for (const file of fs.readdirSync(path.resolve('services'))) {
              if (file.endsWith('.js')) {
                _entry[path.basename(file, '.js')] = path.resolve('services', file)
              }
            }
            return _entry
          })
        }
      }
    } else {
      return config
    }
  } : undefined,
}