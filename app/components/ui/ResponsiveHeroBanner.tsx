"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface NavLink {
    label: string;
    href: string;
    isActive?: boolean;
}

interface Partner {
    logoUrl: string;
    href: string;
}

interface ResponsiveHeroBannerProps {
    logoUrl?: string;
    backgroundImageUrl?: string;
    navLinks?: NavLink[];
    ctaButtonText?: string;
    ctaButtonHref?: string;
    badgeText?: string;
    badgeLabel?: string;
    title?: string;
    titleLine2?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonHref?: string;
    secondaryButtonText?: string;
    secondaryButtonHref?: string;
    partnersTitle?: string;
    partners?: Partner[];
}

const ResponsiveHeroBanner: React.FC<ResponsiveHeroBannerProps> = ({
    logoUrl = "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/febf2421-4a9a-42d6-871d-ff4f9518021c_1600w.png",
    backgroundImageUrl = "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0e2dbea0-c0a9-413f-a57b-af279633c0df_3840w.jpg",
    navLinks = [
        { label: "Home", href: "/", isActive: true },
        { label: "Missionen", href: "#" },
        { label: "Ziele", href: "#" },
        { label: "Technologie", href: "#" },
        { label: "Flug buchen", href: "#" }
    ],
    ctaButtonText = "Platz reservieren",
    ctaButtonHref = "#",
    badgeLabel = "Neu",
    badgeText = "Erster kommerzieller Flug zum Mars 2026",
    title = "Reise über die Erde hinaus",
    titleLine2 = "In den Kosmos",
    description = "Erleben Sie den Kosmos wie nie zuvor. Unsere fortschrittlichen Raumschiffe und modernste Technologie machen interplanetare Reisen zugänglich, sicher und unvergesslich.",
    primaryButtonText = "Reise buchen",
    primaryButtonHref = "#",
    secondaryButtonText = "Start ansehen",
    secondaryButtonHref = "#",
    partnersTitle = "Partnerschaften mit weltweit führenden Raumfahrtagenturen",
    partners = [
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/vercel.svg", href: "https://vercel.com" },
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/stripe-2.svg", href: "https://stripe.com" },
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/next-js.svg", href: "https://nextjs.org" },
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/tailwind-css-2.svg", href: "https://tailwindcss.com" },
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/prisma-2.svg", href: "https://prisma.io" }
    ]
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <section className="w-full isolate min-h-screen overflow-hidden relative">
            <img
                src={backgroundImageUrl}
                alt=""
                className="w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />

            <header className="z-20 xl:top-4 relative">
                <div className="mx-6">
                    <div className="flex items-center justify-between pt-4">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center bg-center w-[100px] h-[40px] bg-cover rounded"
                            style={{ backgroundImage: `url(${logoUrl})` }}
                        />

                        <nav className="hidden md:flex items-center gap-2">
                            <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                                {navLinks.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.href}
                                        className={`px-3 py-2 text-sm font-medium hover:text-white font-sans transition-colors ${link.isActive ? 'text-white/90' : 'text-white/80'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <Link
                                    href={ctaButtonHref}
                                    className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-white/90 font-sans transition-colors"
                                >
                                    {ctaButtonText}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="M7 7h10v10" />
                                        <path d="M7 17 17 7" />
                                    </svg>
                                </Link>
                            </div>
                        </nav>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur"
                            aria-expanded={mobileMenuOpen}
                            aria-label="Toggle menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white/90">
                                <path d="M4 5h16" />
                                <path d="M4 12h16" />
                                <path d="M4 19h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <div className="z-10 relative">
                <div className="sm:pt-28 md:pt-32 lg:pt-40 max-w-7xl mx-auto pt-28 px-6 pb-56">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
                            <span className="inline-flex items-center text-xs font-medium text-neutral-900 bg-white/90 rounded-full py-0.5 px-2 font-sans">
                                {badgeLabel}
                            </span>
                            <span className="text-sm font-medium text-white/90 font-sans">
                                {badgeText}
                            </span>
                        </div>

                        <h1 className="sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-4xl text-white tracking-tight font-instrument-serif font-normal animate-fade-slide-in-2">
                            {title}
                            <br className="hidden sm:block" />
                            {titleLine2}
                        </h1>

                        <p className="sm:text-lg animate-fade-slide-in-3 text-base text-white/80 max-w-2xl mt-6 mx-auto">
                            {description}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:gap-4 mt-10 gap-3 items-center justify-center animate-fade-slide-in-4">
                            <Link
                                href={primaryButtonHref}
                                className="inline-flex items-center gap-2 hover:bg-white/15 text-sm font-medium text-white bg-white/10 ring-white/15 ring-1 rounded-full py-3 px-5 font-sans transition-colors"
                            >
                                {primaryButtonText}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </Link>
                            <Link
                                href={secondaryButtonHref}
                                className="inline-flex items-center gap-2 rounded-full bg-transparent px-5 py-3 text-sm font-medium text-white/90 hover:text-white font-sans transition-colors"
                            >
                                {secondaryButtonText}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    <div className="mx-auto mt-12 max-w-5xl">
                        <p className="animate-fade-slide-in-1 text-xs font-bold uppercase tracking-[0.3em] text-white/40 text-center">
                            Unterstützt durch führende Technologien
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 animate-fade-slide-in-2 text-white/30 mt-8 items-center justify-items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                            {partners.map((partner, index) => (
                                <Link
                                    key={index}
                                    href={partner.href}
                                    target="_blank"
                                    className="inline-flex items-center justify-center bg-center w-[100px] h-[32px] bg-contain bg-no-repeat hover:opacity-100 transition-opacity invert brightness-200"
                                    style={{ backgroundImage: `url(${partner.logoUrl})` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResponsiveHeroBanner;
