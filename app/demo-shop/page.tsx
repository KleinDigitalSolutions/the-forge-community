'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  ArrowRight, 
  Star, 
  Package, 
  Zap,
  ShieldCheck,
  Globe,
  ArrowUpRight
} from 'lucide-react';

// --- MOCK DATA ---
const PRODUCTS = [
  {
    id: 1,
    name: 'Neural Link Headset',
    price: 899,
    category: 'Electronics',
    image: 'bg-gradient-to-br from-purple-500/20 to-blue-500/20',
    tag: 'BESTSELLER'
  },
  {
    id: 2,
    name: 'Quantum Core v2',
    price: 2450,
    category: 'Hardware',
    image: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20',
    tag: 'NEW ARRIVAL'
  },
  {
    id: 3,
    name: 'Haptic Glove Set',
    price: 349,
    category: 'Wearables',
    image: 'bg-gradient-to-br from-orange-500/20 to-red-500/20',
    tag: null
  },
  {
    id: 4,
    name: 'Obsidian Keyboard',
    price: 199,
    category: 'Peripherals',
    image: 'bg-white/5',
    tag: 'LIMITED'
  }
];

export default function DemoShop() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08090A] text-white selection:bg-[var(--accent)] selection:text-black font-sans">
      
      {/* --- ANNOUNCEMENT BAR --- */}
      <div className="bg-[var(--accent)] text-black text-[10px] font-bold uppercase tracking-[0.2em] py-2 text-center">
        Powered by The Forge • Validator Batch Live
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#08090A]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-caveat text-2xl text-white hover:text-[var(--accent)] transition-colors">
              store.demo
            </Link>
            <div className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-widest text-white/50">
              <Link href="#" className="hover:text-white transition-colors">Alle</Link>
              <Link href="#" className="hover:text-white transition-colors">Elektronik</Link>
              <Link href="#" className="hover:text-white transition-colors">Accessoires</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-64">
               <Search className="w-3 h-3 text-white/40" />
               <input 
                 className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/20 w-full"
                 placeholder="Suche..."
               />
            </div>
            <button className="relative group" onClick={() => setIsCartOpen(!isCartOpen)}>
               <ShoppingBag className="w-5 h-5 text-white group-hover:text-[var(--accent)] transition-colors" />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10">
               <div className="inline-flex items-center gap-2 text-[var(--accent)] text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  Drop 001 Available
               </div>
               <h1 className="text-6xl md:text-8xl font-instrument-serif text-white mb-8 leading-[0.9]">
                  Future <br/><span className="text-white/20">Ready.</span>
               </h1>
               <p className="text-lg text-white/40 max-w-md mb-10 leading-relaxed">
                  Die Demo-Kollektion. Ein Beispiel dafür, was Builder in der Forge in weniger als 4 Wochen launchen.
               </p>
               <div className="flex gap-4">
                  <button className="px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-[var(--accent)] transition-colors">
                     Shop Collection
                  </button>
                  <button className="px-8 py-4 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:border-white transition-colors">
                     View Lookbook
                  </button>
               </div>
            </div>
            
            {/* Abstract 3D Representation */}
            <div className="relative aspect-square">
               <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/20 to-purple-500/20 rounded-full blur-[120px] opacity-50" />
               <div className="relative w-full h-full border border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-3xl overflow-hidden p-8 flex items-center justify-center group">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  <Package className="w-64 h-64 text-white/5 group-hover:text-[var(--accent)]/20 transition-all duration-1000 group-hover:scale-110" />
                  <div className="absolute bottom-8 left-8 text-xs font-mono text-[var(--accent)]">
                     ITEM: #0921<br/>
                     STOCK: LOW
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- FEATURES TICKER --- */}
      <div className="border-y border-white/5 py-6 overflow-hidden bg-black/50 backdrop-blur-sm relative">
         <style jsx>{`
            @keyframes marquee {
               0% { transform: translateX(0); }
               100% { transform: translateX(-50%); }
            }
            .animate-marquee {
               animation: marquee 30s linear infinite;
               width: fit-content;
            }
         `}</style>
         <div className="flex animate-marquee gap-12 items-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 whitespace-nowrap px-6">
            {/* Set 1 */}
            <div className="flex items-center gap-3"><Globe className="w-3 h-3" /> Worldwide Shipping</div>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <div className="flex items-center gap-3"><ShieldCheck className="w-3 h-3" /> Secure Crypto Checkout</div>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <div className="flex items-center gap-3"><Zap className="w-3 h-3" /> Same Day Fulfillment</div>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <div className="flex items-center gap-3"><Star className="w-3 h-3" /> 5.0 Rated Support</div>
            
            <span className="w-1 h-1 bg-white/10 rounded-full mx-6" />

            {/* Set 2 (Duplicate for Loop) */}
            <div className="flex items-center gap-3"><Globe className="w-3 h-3" /> Worldwide Shipping</div>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <div className="flex items-center gap-3"><ShieldCheck className="w-3 h-3" /> Secure Crypto Checkout</div>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <div className="flex items-center gap-3"><Zap className="w-3 h-3" /> Same Day Fulfillment</div>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <div className="flex items-center gap-3"><Star className="w-3 h-3" /> 5.0 Rated Support</div>
         </div>
      </div>

      {/* --- PRODUCT GRID --- */}
      <section className="py-32 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
               <h2 className="text-4xl font-instrument-serif text-white">Latest Arrivals</h2>
               <Link href="#" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-2">
                  View All <ArrowRight className="w-3 h-3" />
               </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
               {PRODUCTS.map((product) => (
                  <div key={product.id} className="group cursor-pointer">
                     <div className={`aspect-[4/5] rounded-xl ${product.image} mb-6 relative overflow-hidden`}>
                        {product.tag && (
                           <div className="absolute top-4 left-4 px-2 py-1 bg-black text-white text-[9px] font-bold uppercase tracking-widest border border-white/10">
                              {product.tag}
                           </div>
                        )}
                        <button className="absolute bottom-4 right-4 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 hover:bg-[var(--accent)]">
                           <ShoppingBag className="w-4 h-4" />
                        </button>
                     </div>
                     <div className="flex justify-between items-start">
                        <div>
                           <h3 className="text-lg font-instrument-serif text-white mb-1 group-hover:text-[var(--accent)] transition-colors">{product.name}</h3>
                           <p className="text-xs text-white/40 uppercase tracking-widest">{product.category}</p>
                        </div>
                        <div className="text-sm font-mono text-white">
                           €{product.price}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- CTA BANNER --- */}
      <section className="py-20 px-6">
         <div className="max-w-7xl mx-auto rounded-3xl bg-white/[0.03] border border-white/5 p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--accent)]/5 pointer-events-none" />
            <div className="relative z-10">
               <h2 className="text-5xl md:text-7xl font-instrument-serif text-white mb-8">
                  Dein Shop.<br/>In 4 Wochen.
               </h2>
               <p className="text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
                  Dies ist nur eine Demo. Als Forge Founder nutzt du unsere Infrastruktur, 
                  um genau solche Brands zu bauen. Ohne Tech-Headache.
               </p>
               <Link 
                  href="/#apply" 
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] text-black text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all rounded-xl"
               >
                  Builder werden <ArrowUpRight className="w-4 h-4" />
               </Link>
            </div>
         </div>
      </section>

      {/* --- FOOTER SIMPLIFIED --- */}
      <footer className="border-t border-white/5 py-12 text-center">
         <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
            © 2026 THE FORGE DEMO STORE • PART OF THE FORGE SYSTEM
         </div>
      </footer>

    </div>
  );
}