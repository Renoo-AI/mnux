import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menux.tn';

export default function sitemap(): MetadataRoute.Sitemap {
  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/onboarding`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Note: Dynamic restaurant pages would be added here
  // Only include restaurants where:
  // - isPublished = true
  // - isActive = true
  // - public indexing is allowed
  // 
  // Example:
  // const restaurants = await getPublicRestaurants();
  // const restaurantPages = restaurants.map((r) => ({
  //   url: `${siteUrl}/r/${r.slug}`,
  //   lastModified: r.updatedAt,
  //   changeFrequency: 'daily' as const,
  //   priority: 0.9,
  // }));

  return staticPages;
}

// Helper function for when database is connected
// async function getPublicRestaurants() {
//   // Fetch restaurants that are:
//   // - published (isPublished: true)
//   // - active (isActive: true)
//   // - allow public indexing
//   return [];
// }
