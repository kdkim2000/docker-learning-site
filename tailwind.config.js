/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './content/**/*.md',
    './app.vue'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        docker: {
          blue: '#2496ED',
          dark: '#1D63ED',
          light: '#E5F3FF'
        }
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            'p, li': {
              wordBreak: 'keep-all',
              overflowWrap: 'break-word'
            },
            'pre': {
              backgroundColor: theme('colors.gray.900'),
              padding: theme('spacing.4'),
              borderRadius: theme('borderRadius.lg'),
              overflow: 'auto'
            },
            'code::before': {
              content: '""'
            },
            'code::after': {
              content: '""'
            },
            'code': {
              backgroundColor: theme('colors.gray.100'),
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400'
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0'
            },
            'table': {
              width: '100%',
              tableLayout: 'auto',
              borderCollapse: 'collapse'
            },
            'th': {
              backgroundColor: theme('colors.gray.100'),
              padding: theme('spacing.2'),
              border: `1px solid ${theme('colors.gray.300')}`,
              fontWeight: '600'
            },
            'td': {
              padding: theme('spacing.2'),
              border: `1px solid ${theme('colors.gray.200')}`
            },
            'blockquote': {
              fontStyle: 'normal',
              borderLeftWidth: '4px'
            }
          }
        },
        dark: {
          css: {
            color: theme('colors.gray.200'),
            'code': {
              backgroundColor: theme('colors.gray.800'),
              color: theme('colors.gray.200')
            },
            'th': {
              backgroundColor: theme('colors.gray.800'),
              borderColor: theme('colors.gray.600')
            },
            'td': {
              borderColor: theme('colors.gray.700')
            }
          }
        }
      })
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}
