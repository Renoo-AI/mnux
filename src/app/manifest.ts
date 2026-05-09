import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menux.tn';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MenuxPRO',
    short_name: 'MenuxPRO',
    description: 'Smart Restaurant Experience OS for cafés and restaurants.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FCFBF9',
    theme_color: '#3A322D',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'fr',
    dir: 'ltr',
    categories: ['business', 'food', 'lifestyle'],
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/og/menuxpro-og.png',
        sizes: '1344x768',
        type: 'image/png',
        form_factor: 'wide',
        label: 'MenuxPRO Dashboard',
      },
      {
        src: '/og/menuxpro-square.png',
        sizes: '1024x1024',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'MenuxPRO Mobile View',
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
    shortcuts: [
      {
        name: 'View Menu',
        short_name: 'Menu',
        description: 'View the restaurant menu',
        url: '/r/',
        icons: [{ src: '/brand/menuxpro-mark.svg', sizes: '64x64' }],
      },
    ],
  };
}
