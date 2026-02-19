const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:8000'
const supabaseClientUrl = process.env.SUPABASE_CLIENT_URL
  || process.env.NUXT_PUBLIC_SUPABASE_CLIENT_URL
  || process.env.NUXT_PUBLIC_SUPABASE_URL
  || supabaseUrl
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY || ''

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
  ],

  app: {
    head: {
      title: 'Fit & Fun Familien Lager',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Fit & Fun Familien Skilager in Brigels' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
      ],
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  runtimeConfig: {
    supabase: {
      url: supabaseUrl, // SSR/Server interne URL (z.B. kong im Docker-Netz)
      key: supabaseAnonKey,
      clientUrl: supabaseClientUrl,
    },
    public: {
      supabase: {
        url: supabaseClientUrl,
        key: supabaseAnonKey,
        clientUrl: supabaseClientUrl,
      },
    },
  },

  supabase: {
    url: supabaseUrl,
    key: supabaseAnonKey,
    redirect: false,
    redirectOptions: {
      login: '/admin/login',
      callback: '/admin',
      exclude: ['/', '/lager', '/archiv', '/archiv/*', '/lagerhaus', '/sponsoren', '/kontakt'],
    },
  },

  alias: {
    '@': '.',
  },

  components: [
    {
      path: '~/components/ui',
      extensions: ['.vue'],
      prefix: '',
    },
    {
      path: '~/components',
      extensions: ['.vue'],
      prefix: '',
    },
  ],
})
