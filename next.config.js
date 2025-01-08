const { PHASE_PRODUCTION_SERVER } = require('next/constants')

module.exports = (phase, { defaultConfig }) => {
  return {
    ...defaultConfig,
    images: {
      domains: ['firebasestorage.googleapis.com']
    },
    async redirects() {
      return [
        {
          source: '/info.html',
          destination:
            'https://docs.google.com/document/d/e/2PACX-1vTBdvrqaIkgl8WD-W9T3vZ2yPyL48aQYIik1aXKJeZ3HIpPKyCEKwnTYhKJGeo0ylXzAEJPkccG0B-I/pub',
          permanent: false
        }
      ]
    }
  }
}
