'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'Income' | 'Expense';
  date: string;
  status: string;
}

export default function TransparencyPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [foundersCount, setFoundersCount] = useState(0);
  const MAX_GROUP_SIZE = 25;

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        const response = await fetch('/api/transactions');
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  useEffect(() => {
    async function fetchFoundersCount() {
      try {
        const response = await fetch('/api/founders');
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const founders = Array.isArray(data) ? data : data.founders || [];
        const activeCount = typeof data.count === 'number'
          ? data.count
          : founders.filter((f: { status?: string }) => f.status === 'active').length;
        setFoundersCount(activeCount);
      } catch (error) {
        console.error('Error fetching founders count:', error);
      }
    }

    fetchFoundersCount();
  }, []);

  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = Math.abs(
    transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const available = totalIncome - totalExpenses;
  const targetTiers = [25000, 50000, 100000];
  const targetCapital =
    targetTiers.find((tier) => totalIncome <= tier) ?? targetTiers[targetTiers.length - 1];
  const progressPercentage = Math.min((totalIncome / targetCapital) * 100, 100);

  const expensesByCategory = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const milestones = [
    {
      title: 'Founders Recruiting',
      status: foundersCount >= MAX_GROUP_SIZE ? 'completed' : 'in_progress',
      date: 'Jan 2026',
      description: `${foundersCount} von max. ${MAX_GROUP_SIZE} Foundern`,
    },
    {
      title: 'Legal & Treuhandkonto',
      status: 'pending',
      date: 'Feb 2026',
      description: 'Vertraege, Datenschutz, Konten',
    },
    {
      title: 'WMS & Warehouse MVP',
      status: 'pending',
      date: 'Feb-Mar 2026',
      description: 'Zonen, Regale/Bins, Scanner, WMS MVP',
    },
    {
      title: 'Pilotkunden',
      status: 'pending',
      date: 'Mar-Apr 2026',
      description: '1-3 Kunden, SLA/Cutoff, Billing',
    },
    {
      title: 'Skalierung',
      status: 'pending',
      date: 'Apr-Jun 2026',
      description: '7-10 Kunden, Retouren-Modul, Low-Stock Alerts',
    },
  ];

  const handleExport = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.print();
  };

  const COLORS: Record<string, string> = {
    Supplier: '#3B82F6',
    Marketing: '#10B981',
    Legal: '#8B5CF6',
    Operations: '#F59E0B',
    Investment: '#06B6D4',
    Other: '#6B7280',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-xl font-semibold text-gray-900">THE FORGE</div>
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/transparency" className="text-sm text-gray-900 font-medium">
              Transparency
            </Link>
            <Link href="/forum" className="text-sm text-gray-600 hover:text-gray-900">
              Forum
            </Link>
            <Link href="/updates" className="text-sm text-gray-600 hover:text-gray-900">
              Updates
            </Link>
            <Link href="/tasks" className="text-sm text-gray-600 hover:text-gray-900">
              Tasks
            </Link>
            <Link href="/resources" className="text-sm text-gray-600 hover:text-gray-900">
              Resources
            </Link>
            <Link href="/calendar" className="text-sm text-gray-600 hover:text-gray-900">
              Calendar
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Radikale Transparenz
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Jeder Euro wird öffentlich dokumentiert. Keine versteckten Kosten.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <ArrowUpRight className="w-5 h-5" />
              <span className="text-sm font-medium">Einnahmen</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              €{totalIncome.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <ArrowDownRight className="w-5 h-5" />
              <span className="text-sm font-medium">Ausgaben</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              €{totalExpenses.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium">Verfügbar</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              €{available.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Zum Ziel</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {progressPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Capital Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Kapital Progress</h2>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                €{totalIncome.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">von €{targetCapital.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Tiers: 25k / 50k / 100k</div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Noch {Math.max(0, MAX_GROUP_SIZE - foundersCount)} Plätze bis zur Maximalgröße • Beitrag = Zielkapital / Mitgliederzahl
          </p>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Expense Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ausgaben nach Kategorie</h2>

            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.Other} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number | undefined) => value !== undefined ? `€${value.toLocaleString()}` : '€0'}
                    />
                  </RechartsPie>
                </ResponsiveContainer>

                <div className="mt-6 space-y-2">
                  {Object.entries(expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[category] || COLORS.Other }}
                        />
                        <span className="text-gray-700">{category}</span>
                      </div>
                      <span className="font-semibold text-gray-900">€{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                Noch keine Ausgaben
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Roadmap & Milestones</h2>

            <div className="space-y-6">
              {milestones.map((milestone, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {milestone.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 text-blue-600" />
                    ) : milestone.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                      <span className="text-xs text-gray-500">{milestone.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Alle Transaktionen</h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Lade Transaktionen...</div>
          ) : transactions.length === 0 ? (
            <div className="text-sm text-gray-500">Noch keine Transaktionen vorhanden.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 text-sm font-medium text-gray-600">Datum</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Beschreibung</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Kategorie</th>
                    <th className="pb-3 text-sm font-medium text-gray-600 text-right">Betrag</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, i) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="py-4 text-sm text-gray-900">{transaction.description}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          {transaction.category}
                        </span>
                      </td>
                      <td
                        className={`py-4 text-sm text-right font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}€
                        {Math.abs(transaction.amount).toLocaleString()}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                            transaction.status === 'Completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trust Message */}
        <div className="mt-12 text-center bg-blue-50 border border-blue-200 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            100% Transparent. 100% Ehrlich.
          </h3>
          <p className="text-gray-600">
            Jede Transaktion ist öffentlich. Jede Entscheidung wird gemeinsam getroffen.
          </p>
        </div>
      </div>
    </div>
  );
}
