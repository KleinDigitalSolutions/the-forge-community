import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://stakeandscale.de';

  // Publicly accessible routes
  const routes = [
    '',
    '/login',
    '/legal/impressum',
    '/legal/datenschutz',
    '/legal/agb',
    '/legal/vertrag',
    '/demo-shop',
    '/transparency',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : 0.5,
  }));
}
