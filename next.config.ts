import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://hoirqrkdgbmvpwutwuwj.supabase.co https://upload.wikimedia.org https://simpleicons.org https://www.googletagmanager.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://hoirqrkdgbmvpwutwuwj.supabase.co https://*.google-analytics.com https://*.analytics.google.com; frame-src https://challenges.cloudflare.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
