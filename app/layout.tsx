import type { Metadata } from "next";
import { Bodoni_Moda, Sora, Instrument_Serif, Caveat } from "next/font/google";
import { Providers } from "@/app/components/Providers";
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
  title: "STAKE & SCALE",
  description: "Community Venture Studio für ambitionierte Founder",
  icons: {
    icon: [
      { url: "/favicon.png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.png"],
  },
  openGraph: {
    title: "STAKE & SCALE",
    description: "Community Venture Studio für ambitionierte Founder",
    url: "https://stakeandscale.de",
    siteName: "STAKE & SCALE",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "STAKE & SCALE Logo",
      },
    ],
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STAKE & SCALE",
    description: "Community Venture Studio für ambitionierte Founder",
    images: ["/favicon.png"],
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
