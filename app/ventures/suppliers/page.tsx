'use client';

import { useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import PageShell from '@/app/components/PageShell';
import { Search, Package, MapPin, ExternalLink, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Curated B2B Supplier Directory
const SUPPLIERS = [
  {
    id: 1,
    name: 'Alibaba',
    description: 'Weltweit größter B2B Marktplatz. Tausende verifizierte Hersteller aus China und Asien.',
    url: 'https://www.alibaba.com',
    location: 'China',
    categories: ['Electronics', 'Fashion', 'Home & Garden', 'Industrial'],
    minOrder: '100-500 units',
    paymentTerms: 'T/T, L/C, PayPal',
    shippingTime: '15-45 days',
    rating: 4.5,
    verified: true
  },
  {
    id: 2,
    name: 'Global Sources',
    description: 'Premium B2B Platform mit Trade-Show Fokus. Höhere Qualität, höhere Preise.',
    url: 'https://www.globalsources.com',
    location: 'Hong Kong',
    categories: ['Electronics', 'Gifts', 'Fashion'],
    minOrder: '500-1000 units',
    paymentTerms: 'T/T, L/C',
    shippingTime: '20-40 days',
    rating: 4.3,
    verified: true
  },
  {
    id: 3,
    name: 'ThomasNet',
    description: 'Nordamerikanische Hersteller. Made in USA/Canada. Höhere Qualität, schnellerer Versand.',
    url: 'https://www.thomasnet.com',
    location: 'USA',
    categories: ['Industrial', 'Manufacturing', 'Custom Parts'],
    minOrder: '50-200 units',
    paymentTerms: 'Net 30, Credit Card',
    shippingTime: '7-14 days',
    rating: 4.7,
    verified: true
  },
  {
    id: 4,
    name: 'Faire',
    description: 'B2B Marktplatz für Retail & E-Commerce. Kuratierte Brands, keine MOQ für erste Orders.',
    url: 'https://www.faire.com',
    location: 'USA/Europe',
    categories: ['Home Decor', 'Fashion', 'Beauty', 'Gifts'],
    minOrder: 'Keine (erste Order)',
    paymentTerms: 'Net 60',
    shippingTime: '5-10 days',
    rating: 4.6,
    verified: true
  },
  {
    id: 5,
    name: 'DHgate',
    description: 'Dropshipping-friendly Platform. Niedrige MOQs, aber gemischte Qualität.',
    url: 'https://www.dhgate.com',
    location: 'China',
    categories: ['Electronics', 'Fashion', 'Accessories'],
    minOrder: '1-10 units',
    paymentTerms: 'Credit Card, PayPal',
    shippingTime: '10-30 days',
    rating: 3.8,
    verified: false
  },
  {
    id: 6,
    name: 'SaleHoo',
    description: 'Directory + Dropshipping Platform. Geprüfte Supplier, monatliche Gebühr.',
    url: 'https://www.salehoo.com',
    location: 'Global',
    categories: ['All Categories'],
    minOrder: 'Variiert',
    paymentTerms: 'Variiert',
    shippingTime: 'Variiert',
    rating: 4.2,
    verified: true
  },
  {
    id: 7,
    name: 'Oberlo (Shopify)',
    description: 'Dropshipping App für Shopify. AliExpress Integration, automatisiert.',
    url: 'https://www.shopify.com/oberlo',
    location: 'China (via AliExpress)',
    categories: ['Fashion', 'Electronics', 'Home'],
    minOrder: '1 unit',
    paymentTerms: 'Credit Card',
    shippingTime: '15-30 days',
    rating: 4.0,
    verified: false
  },
  {
    id: 8,
    name: 'Europages',
    description: 'Europäische B2B Platform. EU Hersteller, höhere Standards.',
    url: 'https://www.europages.com',
    location: 'Europe',
    categories: ['Industrial', 'Manufacturing', 'Services'],
    minOrder: '100-500 units',
    paymentTerms: 'Variiert',
    shippingTime: '5-15 days',
    rating: 4.4,
    verified: true
  }
];

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const allCategories = ['All', ...new Set(SUPPLIERS.flatMap(s => s.categories))].sort();

  const filteredSuppliers = SUPPLIERS.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' ||
      supplier.categories.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <AuthGuard>
      <PageShell>
        <header className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-instrument-serif text-white tracking-tight mb-4">
                B2B Supplier Directory
              </h1>
              <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">
                Geprüfte Großhändler & Hersteller für dein E-Commerce Venture
              </p>
            </div>
            <Link
              href="/ventures"
              className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-[#D4AF37] transition-colors"
            >
              ← Zurück zu Ventures
            </Link>
          </div>
        </header>

        {/* Search */}
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Suppliern, Locations, Produkten..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-14 pr-6 py-4 text-sm text-white focus:border-[#D4AF37] focus:ring-0 outline-none transition-all placeholder:text-white/20"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#D4AF37] text-black'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredSuppliers.map((supplier) => (
            <a
              key={supplier.id}
              href={supplier.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-2xl border border-white/10 p-8 hover:border-[#D4AF37]/40 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-instrument-serif text-white mb-2 group-hover:text-[#D4AF37] transition-colors flex items-center gap-2">
                    {supplier.name}
                    {supplier.verified && (
                      <span className="text-xs text-green-500">✓</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <MapPin className="w-3 h-3" />
                    {supplier.location}
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-white/20 group-hover:text-[#D4AF37] transition-colors" />
              </div>

              {/* Description */}
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                {supplier.description}
              </p>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-6">
                {supplier.categories.map((cat, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-white/5 text-white/40"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">
                    MOQ
                  </div>
                  <div className="text-xs text-white/60">
                    {supplier.minOrder}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">
                    Versand
                  </div>
                  <div className="text-xs text-white/60">
                    {supplier.shippingTime}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">
                    Payment
                  </div>
                  <div className="text-xs text-white/60">
                    {supplier.paymentTerms}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">
                    Rating
                  </div>
                  <div className="text-xs text-[#D4AF37] font-bold">
                    {supplier.rating}/5.0
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/30">Keine Supplier gefunden</p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 glass-card rounded-2xl border border-[#D4AF37]/20 p-8 bg-[#D4AF37]/5">
          <h3 className="text-xl font-instrument-serif text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
            Pro-Tipps für B2B Sourcing
          </h3>
          <ul className="space-y-3 text-sm text-white/60">
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span><strong className="text-white">Samples zuerst:</strong> Bestelle immer Muster bevor du große Orders machst.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span><strong className="text-white">Vergleiche 3+ Supplier:</strong> Preise und Qualität variieren massiv.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span><strong className="text-white">Payment Terms verhandeln:</strong> Bei größeren Orders sind 30-50% Deposit möglich.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37] mt-1">•</span>
              <span><strong className="text-white">SmartStore nutzen:</strong> Unser internes Fulfillment kann dir bei Lagerung & Versand helfen.</span>
            </li>
          </ul>
        </div>
      </PageShell>
    </AuthGuard>
  );
}
