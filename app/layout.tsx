import type { Metadata } from "next";
import { Providers } from "@/app/components/Providers";
import StructuredData from "@/app/components/StructuredData";
import Script from "next/script";
import GlobalAudioPlayer from "@/app/components/visual/GlobalAudioPlayer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://stakeandscale.de'),
  title: {
    default: "STAKE & SCALE | Community Venture Studio für ambitionierte Founder",
    template: "%s | STAKE & SCALE"
  },
  description: "STAKE & SCALE ist das erste Community Venture Studio. Wir bündeln Kapital, Skills und Execution für den Aufbau skalierbarer Brands. Keine VCs. Echte Werte. Gemeinsam wachsen.",
  keywords: [
    "Stake & Scale", 
    "Venture Studio", 
    "Founder Community", 
    "Startups Deutschland", 
    "Brand Building", 
    "Entrepreneurship", 
    "Kollektive Gründung", 
    "Sweat Equity", 
    "Venture Capital Alternative"
  ],
  authors: [{ name: "STAKE & SCALE Team" }],
  creator: "STAKE & SCALE",
  publisher: "STAKE & SCALE",
  alternates: {
    canonical: "https://stakeandscale.de",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "STAKE & SCALE | Community Venture Studio",
    description: "Baue deine Brand im Kollektiv. Wir bündeln Ressourcen für maximale Hebelwirkung.",
    url: "https://stakeandscale.de",
    siteName: "STAKE & SCALE",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "STAKE & SCALE - Community Venture Studio",
      },
    ],
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STAKE & SCALE | Community Venture Studio",
    description: "Vom Solo-Founder zum hocheffizienten Kollektiv. Gemeinsam Brands schmieden.",
    images: ["/android-chrome-512x512.png"],
    creator: "@stakeandscale",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800;900&family=Caveat:wght@400..700&display=swap" rel="stylesheet" />
        
        {/* Google Tag Manager */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3GP315ZWWP"
          strategy="beforeInteractive"
          async
        />
        <Script 
          id="gtag-init" 
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-3GP315ZWWP', {
                page_path: window.location.pathname,
                send_page_view: true
              });
            `,
          }}
        />
        {/* SoundCloud API */}
        <Script 
          src="https://w.soundcloud.com/player/api.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className="antialiased"
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=G-3GP315ZWWP"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <StructuredData />
        <Providers>
          <GlobalAudioPlayer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
