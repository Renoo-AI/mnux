import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menux.tn';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all bots to access public pages
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Admin routes - should not be indexed
          '/admin',
          '/admin/',
          // Staff routes - should not be indexed
          '/staff',
          '/staff/',
          // Dashboard routes - should not be indexed
          '/dashboard',
          '/dashboard/',
          // Settings and security pages
          '/settings',
          '/security',
          // API routes - should not be indexed
          '/api/admin',
          '/api/admin/',
          // Auth routes
          '/login',
          // Order status pages (private customer data)
          '/r/*/t/*/sent',
          '/r/*/t/*/review',
        ],
      },
      // Search engine specific rules
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/staff', '/dashboard', '/api/admin', '/settings', '/security'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin', '/staff', '/dashboard', '/api/admin', '/settings', '/security'],
      },
      // Social media crawlers - allow more access for previews
      {
        userAgent: ['Twitterbot', 'facebookexternalhit', 'LinkedInBot'],
        allow: '/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
