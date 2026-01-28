import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://w.soundcloud.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://hoirqrkdgbmvpwutwuwj.supabase.co https://upload.wikimedia.org https://simpleicons.org https://www.googletagmanager.com https://*.vercel-storage.com https://*.blob.vercel-storage.com https://www.transparenttextures.com https://grainy-gradients.vercel.app; media-src 'self' blob: data: https://hoirqrkdgbmvpwutwuwj.supabase.co https://*.vercel-storage.com https://*.blob.vercel-storage.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://hoirqrkdgbmvpwutwuwj.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.vercel-storage.com https://*.blob.vercel-storage.com; frame-src 'self' https://challenges.cloudflare.com https://w.soundcloud.com https://www.youtube.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
