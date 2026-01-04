// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  content: {
    highlight: {
      theme: {
        default: 'github-light',
        dark: 'github-dark'
      },
      langs: [
        'bash',
        'shell',
        'dockerfile',
        'yaml',
        'json',
        'python',
        'javascript',
        'typescript',
        'html',
        'css',
        'sql',
        'ini',
        'nginx',
        'toml',
        'xml',
        'diff',
        'markdown',
        'properties'
      ]
    },
    markdown: {
      toc: {
        depth: 3,
        searchDepth: 3
      }
    }
  },

  app: {
    head: {
      title: 'Docker 학습 사이트',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Docker 이론과 실습을 학습할 수 있는 사이트' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap'
        }
      ]
    }
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  }
})
