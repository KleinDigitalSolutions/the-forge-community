import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/dashboard/',
        '/ventures/',
        '/forum/',
        '/squads/',
        '/tasks/',
        '/profile/',
        '/_next/',
        '/static/',
      ],
    },
    sitemap: 'https://stakeandscale.de/sitemap.xml',
  };
}
