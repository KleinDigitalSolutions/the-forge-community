"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Menu, X, ArrowRight } from 'lucide-react';

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
        { label: "Dashboard", href: "/dashboard" },
        { label: "Forum", href: "/forum" },
        { label: "Squads", href: "/squads" },
        { label: "Impressum", href: "/legal/impressum" }
    ],
    ctaButtonText = "BEWERBEN",
    ctaButtonHref = "#apply",
    badgeLabel = "THE FORGE",
    badgeText = "System-Status: Operational",
    title = "Hör auf, alleine",
    titleLine2 = "zu kämpfen.",
    description = "Warum 100k riskieren, wenn du mit 50 Experten ein profitables Imperium schmieden kannst? Wir bündeln Kapital, Skills und Execution. Echte Brands. Echte Anteile.",
    primaryButtonText = "JETZT STARTEN",
    primaryButtonHref = "#apply",
    secondaryButtonText = "MEHR ERFAHREN",
    secondaryButtonHref = "#",
    partnersTitle = "Unterstützt durch führende Technologien",
    partners = [
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/vercel.svg", href: "https://vercel.com" },
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/stripe-2.svg", href: "https://stripe.com" },
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/next-js.svg", href: "https://nextjs.org" },
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/tailwind-css-2.svg", href: "https://tailwindcss.com" },
        { logoUrl: "https://cdn.worldvectorlogo.com/logos/prisma-2.svg", href: "https://prisma.io" }
    ]
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { status } = useSession();

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
                        <Link href="/" className="flex items-center gap-3 group">
                          <span className="font-caveat text-3xl tracking-normal text-white group-hover:text-[var(--accent)] transition-colors lowercase">STAKE & SCALE</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-2">
                            <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                                {navLinks?.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.href}
                                        className={`px-3 py-2 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors ${link.isActive ? 'text-white' : 'text-white/60'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                {status === 'authenticated' ? (
                                    <Link
                                        href="/dashboard"
                                        className="ml-1 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-[10px] font-black text-black hover:brightness-110 transition-all uppercase tracking-[0.2em]"
                                    >
                                        Cockpit
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black text-black hover:bg-white/90 transition-all uppercase tracking-[0.2em]"
                                    >
                                        Login
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                )}
                            </div>
                        </nav>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur"
                            aria-expanded={mobileMenuOpen}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white/90">
                                    <path d="M4 5h16" />
                                    <path d="M4 12h16" />
                                    <path d="M4 19h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-20 left-6 right-6 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 md:hidden animate-fade-in z-50">
                        <nav className="flex flex-col gap-4">
                            {navLinks?.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href={status === 'authenticated' ? "/dashboard" : "/login"}
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full py-4 bg-[var(--accent)] text-black rounded-xl text-center font-black uppercase tracking-[0.2em] text-[10px] mt-2"
                            >
                                {status === 'authenticated' ? "ZUM COCKPIT" : "LOGIN"}
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            <div className="z-10 relative">
                <div className="sm:pt-28 md:pt-32 lg:pt-40 max-w-7xl mx-auto pt-28 px-6 pb-56">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
                            <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-black bg-[var(--accent)] rounded-full py-0.5 px-2">
                                {badgeLabel}
                            </span>
                            <span className="text-xs font-bold text-white/90 uppercase tracking-[0.2em]">
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
                                className="inline-flex items-center gap-3 bg-[#D4AF37] text-black hover:brightness-110 text-[10px] font-black rounded-xl py-4 px-8 uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl shadow-[#D4AF37]/20"
                            >
                                {primaryButtonText}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href={secondaryButtonHref}
                                className="inline-flex items-center gap-3 rounded-xl bg-white/10 border border-white/20 px-8 py-4 text-[10px] font-black text-white hover:bg-white/20 uppercase tracking-[0.3em] transition-all duration-500"
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
                            {partnersTitle}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 animate-fade-slide-in-2 text-white/30 mt-8 items-center justify-items-center gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                            {partners.map((partner, index) => (
                                <Link
                                    key={index}
                                    href={partner.href}
                                    target="_blank"
                                    className="inline-flex items-center justify-center bg-center w-[130px] h-[40px] bg-contain bg-no-repeat hover:opacity-100 transition-opacity invert brightness-200"
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