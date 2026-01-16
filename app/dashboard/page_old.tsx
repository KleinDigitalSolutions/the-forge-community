'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  Vote,
  TrendingUp,
  MessageSquare,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface Founder {
  founderNumber: number;
  name: string;
  joinedDate: string;
  status: string;
}

interface ProductVote {
  id: string;
  name: string;
  description: string;
  votes: number;
  isVoted: boolean;
}

export default function Dashboard() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [foundersCount, setFoundersCount] = useState(0);
  const [productVotes, setProductVotes] = useState<ProductVote[]>([
    {
      id: '1',
      name: 'Premium Hoodie Collection',
      description: 'Hochwertige Hoodies mit minimalistischem Design',
      votes: 23,
      isVoted: false,
    },
    {
      id: '2',
      name: 'Sustainable Bag Line',
      description: 'Nachhaltige Taschen aus recycelten Materialien',
      votes: 18,
      isVoted: false,
    },
    {
      id: '3',
      name: 'Tech Accessories',
      description: 'Premium Tech-Zubehör für den modernen Lifestyle',
      votes: 15,
      isVoted: false,
    },
  ]);

  useEffect(() => {
    const fetchFounders = async () => {
      try {
        const response = await fetch('/api/founders');
        const data = await response.json();
        if (data.success) {
          setFounders(data.founders);
          setFoundersCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching founders:', error);
      }
    };

    fetchFounders();
  }, []);

  const handleVote = (productId: string) => {
    setProductVotes(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, votes: product.votes + 1, isVoted: true }
          : product
      )
    );
  };

  const totalRaised = foundersCount * 500;
  const progressPercentage = (foundersCount / 50) * 100;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
              THE FORGE
            </h1>
          </div>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <a href="#community" className="text-gray-400 hover:text-white transition-colors">
              Community
            </a>
            <a href="#voting" className="text-gray-400 hover:text-white transition-colors">
              Voting
            </a>
            <a href="#transparency" className="text-gray-400 hover:text-white transition-colors">
              Transparency
            </a>
          </nav>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="py-12 bg-gradient-to-b from-black to-purple-950/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-orange-600/20 to-black border border-orange-500/30 rounded-2xl p-6"
            >
              <Users className="w-8 h-8 text-orange-500 mb-3" />
              <div className="text-3xl font-black mb-1">{foundersCount}/50</div>
              <div className="text-sm text-gray-400">Active Founders</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-600/20 to-black border border-purple-500/30 rounded-2xl p-6"
            >
              <DollarSign className="w-8 h-8 text-purple-500 mb-3" />
              <div className="text-3xl font-black mb-1">€{totalRaised.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Raised</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-600/20 to-black border border-green-500/30 rounded-2xl p-6"
            >
              <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
              <div className="text-3xl font-black mb-1">{Math.round(progressPercentage)}%</div>
              <div className="text-sm text-gray-400">Progress to Goal</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-600/20 to-black border border-blue-500/30 rounded-2xl p-6"
            >
              <Clock className="w-8 h-8 text-blue-500 mb-3" />
              <div className="text-3xl font-black mb-1">Phase 1</div>
              <div className="text-sm text-gray-400">Recruiting</div>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 bg-white/5 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-orange-500 to-purple-500"
            />
          </div>
          <p className="text-center text-gray-400 mt-2">
            {50 - foundersCount} spots remaining
          </p>
        </div>
      </section>

      {/* Voting Section */}
      <section id="voting" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <Vote className="w-10 h-10 text-orange-500" />
            <h2 className="text-5xl font-black">Product Voting</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {productVotes.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-white/5 to-black border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all"
              >
                <h3 className="text-2xl font-bold mb-3">{product.name}</h3>
                <p className="text-gray-400 mb-6">{product.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-black text-orange-500">
                    {product.votes} votes
                  </div>
                  {product.isVoted && (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  )}
                </div>

                <button
                  onClick={() => handleVote(product.id)}
                  disabled={product.isVoted}
                  className={`w-full py-4 rounded-full font-bold transition-all ${
                    product.isVoted
                      ? 'bg-green-600/20 text-green-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:scale-105'
                  }`}
                >
                  {product.isVoted ? 'Voted!' : 'Vote for this'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 bg-gradient-to-b from-black to-purple-950/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <Users className="w-10 h-10 text-purple-500" />
            <h2 className="text-5xl font-black">Founders Community</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {founders.map((founder, i) => (
              <motion.div
                key={founder.founderNumber}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-black text-orange-500">
                    #{String(founder.founderNumber).padStart(3, '0')}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      founder.status === 'active'
                        ? 'bg-green-600/20 text-green-500'
                        : 'bg-yellow-600/20 text-yellow-500'
                    }`}
                  >
                    {founder.status}
                  </div>
                </div>
                <div className="text-lg font-bold mb-1">{founder.name}</div>
                <div className="text-sm text-gray-400">
                  Joined: {new Date(founder.joinedDate).toLocaleDateString()}
                </div>
              </motion.div>
            ))}

            {/* Empty slots */}
            {[...Array(Math.max(0, 50 - founders.length))].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-white/5 backdrop-blur-sm border border-dashed border-white/20 rounded-xl p-6 flex items-center justify-center"
              >
                <div className="text-center text-gray-600">
                  <div className="text-xl font-black mb-2">
                    #{String(founders.length + i + 1).padStart(3, '0')}
                  </div>
                  <div className="text-sm">Available</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discussion Forum Teaser */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <MessageSquare className="w-10 h-10 text-orange-500" />
            <h2 className="text-5xl font-black">Community Forum</h2>
          </div>

          <div className="bg-gradient-to-br from-orange-600/10 to-purple-600/10 border border-orange-500/30 rounded-3xl p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Coming Soon</h3>
            <p className="text-xl text-gray-400 mb-8">
              Connect with fellow founders, share ideas, and build together
            </p>
            <button className="bg-gradient-to-r from-orange-500 to-purple-500 text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-all">
              Join the Discussion
              <ArrowRight className="inline-block ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Transparency Dashboard */}
      <section id="transparency" className="py-20 bg-gradient-to-b from-black to-purple-950/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <TrendingUp className="w-10 h-10 text-green-500" />
            <h2 className="text-5xl font-black">Transparency Dashboard</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Financial Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-gray-400">Total Capital Raised</span>
                  <span className="font-black text-2xl text-green-500">
                    €{totalRaised.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-gray-400">Target Capital</span>
                  <span className="font-black text-2xl">€25,000</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-gray-400">Reserved for Production</span>
                  <span className="font-black text-2xl">€{Math.round(totalRaised * 0.7).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Marketing Budget</span>
                  <span className="font-black text-2xl">€{Math.round(totalRaised * 0.3).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Project Timeline</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-bold">Phase 1: Recruiting</div>
                    <div className="text-sm text-gray-400">In Progress</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-bold text-gray-400">Phase 2: Product Voting</div>
                    <div className="text-sm text-gray-500">Starts when 50/50 founders</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-bold text-gray-400">Phase 3: Production</div>
                    <div className="text-sm text-gray-500">Est. 2-3 months</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-bold text-gray-400">Phase 4: Launch</div>
                    <div className="text-sm text-gray-500">Est. Month 6</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
