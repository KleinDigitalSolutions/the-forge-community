import type { Metadata } from "next";
import { Bodoni_Moda, Sora, Instrument_Serif, Caveat } from "next/font/google";
import { Providers } from "@/app/components/Providers";
import StructuredData from "@/app/components/StructuredData";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "700"],
});

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
      <body
        className={`${sora.variable} ${bodoniModa.variable} ${instrumentSerif.variable} ${caveat.variable} antialiased`}
      >
        <StructuredData />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
