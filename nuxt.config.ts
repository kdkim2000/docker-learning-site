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

  // GitHub Pages 배포를 위한 base URL 설정
  // 환경 변수 NUXT_APP_BASE_URL이 설정되어 있으면 사용, 없으면 기본값 '/'
  // GitHub Pages에서 repository 이름을 base로 사용하려면:
  // 예: repository 이름이 'docker-learning-site'인 경우 '/docker-learning-site/'
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    buildAssetsDir: '/_nuxt/',
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
