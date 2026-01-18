"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRight, Play, Menu, X, Rocket, Users, Target, Shield, Zap } from 'lucide-react';

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
    logoUrl = "/logo-placeholder.png", // We can use the 'F' logo logic here
    backgroundImageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=3840&auto=format&fit=crop",
    navLinks = [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Forum", href: "/forum" },
        { label: "Transparency", href: "/transparency" },
        { label: "Legal", href: "/legal/impressum" }
    ],
    ctaButtonText = "Apply Now",
    ctaButtonHref = "#apply",
    badgeLabel = "Recruiting",
    badgeText = "Batch #001 - Forge the Future with us",
    title = "Build Real Brands.",
    titleLine2 = "Together as One.",
    description = "The Forge ist das erste Community Venture Studio. Wir bündeln Kapital, Skills und Execution um profitable Businesses zu schmieden, die uns allen gehören.",
    primaryButtonText = "Start Your Journey",
    primaryButtonHref = "#apply",
    secondaryButtonText = "Watch Manifesto",
    secondaryButtonHref = "#",
    partnersTitle = "Supported by industry leading founders and operators",
    partners = [
        { logoUrl: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800&auto=format&fit=crop", href: "#" },
        { logoUrl: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800&auto=format&fit=crop", href: "#" },
        { logoUrl: "https://images.unsplash.com/photo-1614850523544-39f88469d717?q=80&w=800&auto=format&fit=crop", href: "#" },
        { logoUrl: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800&auto=format&fit=crop", href: "#" },
        { logoUrl: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800&auto=format&fit=crop", href: "#" }
    ]
}) => {
    const { status, data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <section className="w-full isolate min-h-screen overflow-hidden relative">
            {/* Background Image with Overlay */}
            <img
                src={backgroundImageUrl}
                alt=""
                className="w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />

            {/* Custom Integrated Header */}
            <header className="z-50 xl:top-4 relative">
                <div className="mx-6">
                    <div className="flex items-center justify-between pt-4">
                        <Link href="/" className="flex items-center gap-3 group">
                          <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-[var(--accent)] font-black shadow-lg backdrop-blur group-hover:border-[var(--accent)] transition-all">
                            F
                          </div>
                          <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-[var(--accent)] transition-colors">THE FORGE</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-2">
                            <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                                {navLinks.map((link, index) => (
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
                                        className="ml-1 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-foreground)] hover:brightness-110 transition-all uppercase tracking-widest"
                                    >
                                        Dashboard
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-900 hover:bg-white/90 transition-all uppercase tracking-widest"
                                    >
                                        Login
                                        <Zap className="h-3 w-3" />
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
                            {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="absolute top-20 left-6 right-6 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:hidden animate-fade-in">
                        <nav className="flex flex-col gap-4">
                            {navLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href={status === 'authenticated' ? "/dashboard" : "/login"}
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full py-3 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-xl text-center font-bold uppercase tracking-widest text-xs"
                            >
                                {status === 'authenticated' ? "Dashboard" : "Login Now"}
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            <div className="z-10 relative">
                <div className="sm:pt-28 md:pt-32 lg:pt-40 max-w-7xl mx-auto pt-28 px-6 pb-16">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-1.5 ring-1 ring-white/20 backdrop-blur animate-fade-slide-in-1">
                            <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-neutral-900 bg-[var(--accent)] rounded-full py-0.5 px-2">
                                {badgeLabel}
                            </span>
                            <span className="text-xs font-bold text-white/90 uppercase tracking-[0.2em]">
                                {badgeText}
                            </span>
                        </div>

                        <h1 className="sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] text-5xl text-white tracking-tighter font-display animate-fade-slide-in-2">
                            {title}
                            <br className="hidden sm:block" />
                            <span className="text-gradient-gold">{titleLine2}</span>
                        </h1>

                        <p className="sm:text-lg animate-fade-slide-in-3 text-base text-white/70 max-w-xl mt-8 mx-auto leading-relaxed">
                            {description}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:gap-4 mt-12 gap-3 items-center justify-center animate-fade-slide-in-4">
                            <Link
                                href={primaryButtonHref}
                                className="ember-glow group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:brightness-110"
                            >
                                {primaryButtonText}
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href={secondaryButtonHref}
                                className="inline-flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                            >
                                {secondaryButtonText}
                                <Play className="w-4 h-4 fill-current" />
                            </Link>
                        </div>
                    </div>

                    <div className="mx-auto mt-24 max-w-5xl">
                        <p className="animate-fade-slide-in-1 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 text-center mb-8">
                            {partnersTitle}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all">
                            {/* In a real project we'd use icons or real logos, using placeholders for now as per 1zu1 instruction but optimized */}
                            <Zap className="w-8 h-8 text-white" />
                            <Shield className="w-8 h-8 text-white" />
                            <Target className="w-8 h-8 text-white" />
                            <Users className="w-8 h-8 text-white" />
                            <Rocket className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle Gradient Bottom Mask */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent z-10" />
        </section>
    );
};

export default ResponsiveHeroBanner;
