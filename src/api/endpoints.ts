export const ENDPOINTS = {
  auth: {
    register:       '/auth/register-cliente',
    login:          '/auth/login',
    me:             '/auth/me',
    logout:         '/auth/logout',
    changePassword: '/auth/change-password',
  },
  songs: {
    generate:     '/songs/generate',
    jobs:         (id: string) => `/songs/jobs/${id}`,
    library:      '/songs/library',
    detail:       (id: string) => `/songs/${id}`,
    playUrl:      (id: string) => `/songs/${id}/play-url`,
    thumbnailUrl: (id: string) => `/songs/${id}/thumbnail-url`,
    update:       (id: string) => `/songs/${id}`,
    delete:       (id: string) => `/songs/${id}`,
    like:         (id: string) => `/songs/${id}/like`,
    tags:         '/songs/tags',
  },
  credits: {
    balance:        '/credits/balance',
    plans:          '/credits/plans',
    checkout:       '/credits/checkout',
    stripeWebhook:  '/credits/stripe-webhook',
    transactions:   '/credits/transactions',
  },
  community: {
    trending: '/community/trending',
    feed:     '/community/feed',
    plays:    '/community/plays',
  },
  planes: {
    listar: '/planes',
  },
  suscripciones: {
    porUsuario: (usuarioId: string) => `/suscripciones/usuario/${usuarioId}`,
  },
}