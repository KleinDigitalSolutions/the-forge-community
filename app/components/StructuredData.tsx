import React from 'react';

export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.stakeandscale.de';
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "STAKE & SCALE",
    "url": baseUrl,
    "logo": `${baseUrl}/android-chrome-512x512.png`,
    "description": "Community Venture Studio für ambitionierte Founder. Wir bündeln Kapital und Skills für den Aufbau skalierbarer Brands.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "DE"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "STAKE & SCALE",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/forum?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
