'use client';

import { useState, useEffect } from 'react';
import PageShell from '@/app/components/PageShell';
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
      description: 'Verträge, Datenschutz, Konten',
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
    <PageShell>
      <header className="mb-12">
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Radikale Transparenz</h1>
        <p className="text-zinc-500 font-medium">Jeder Euro wird öffentlich dokumentiert. Keine versteckten Kosten.</p>
      </header>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-2 font-bold text-xs uppercase tracking-wider">
            <ArrowUpRight className="w-4 h-4" /> Einnahmen
          </div>
          <div className="text-3xl font-black text-zinc-900">
            €{totalIncome.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-2 font-bold text-xs uppercase tracking-wider">
            <ArrowDownRight className="w-4 h-4" /> Ausgaben
          </div>
          <div className="text-3xl font-black text-zinc-900">
            €{totalExpenses.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2 font-bold text-xs uppercase tracking-wider">
            <DollarSign className="w-4 h-4" /> Verfügbar
          </div>
          <div className="text-3xl font-black text-zinc-900">
            €{available.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-2 font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" /> Zum Ziel
          </div>
          <div className="text-3xl font-black text-zinc-900">
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 p-8 mb-12 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-900">Kapital Progress</h2>
          <div className="text-right">
            <div className="text-2xl font-black text-zinc-900">
              €{totalIncome.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">von €{targetCapital.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-zinc-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-zinc-900 transition-all duration-1000"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs font-medium text-zinc-500 mt-4">
          Noch {Math.max(0, MAX_GROUP_SIZE - foundersCount)} Plätze bis zur Maximalgröße • Beitrag = Zielkapital / Mitgliederzahl
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 mb-8">Ausgaben nach Kategorie</h2>

          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.Other} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E4E4E7', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#18181B', fontWeight: 'bold' }}
                    formatter={(value: any) => `€${Number(value || 0).toLocaleString()}`}
                  />
                </RechartsPie>
              </ResponsiveContainer>

              <div className="mt-8 space-y-3">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[category] || COLORS.Other }}
                      />
                      <span className="font-medium text-zinc-700">{category}</span>
                    </div>
                    <span className="font-bold text-zinc-900">€{amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-zinc-400 font-medium">
              Noch keine Ausgaben
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 mb-8">Roadmap & Milestones</h2>

          <div className="space-y-8">
            {milestones.map((milestone, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="flex-shrink-0 mt-1">
                  {milestone.status === 'in_progress' ? (
                    <Clock className="w-5 h-5 text-blue-600" />
                  ) : milestone.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-200 group-hover:border-zinc-400 transition-colors" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-zinc-900">{milestone.title}</h3>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50 px-2 py-1 rounded-md">{milestone.date}</span>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-zinc-900">Alle Transaktionen</h2>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 border border-zinc-200 px-4 py-2 rounded-full hover:bg-zinc-50 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-zinc-400 font-medium animate-pulse">Lade Transaktionen...</div>
        ) : transactions.length === 0 ? (
          <div className="text-sm text-zinc-400 font-medium text-center py-12">Noch keine Transaktionen vorhanden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 text-left">
                  <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider pl-4">Datum</th>
                  <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Beschreibung</th>
                  <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Kategorie</th>
                  <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Betrag</th>
                  <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-wider pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4 pl-4 text-sm font-medium text-zinc-500">
                      {new Date(transaction.date).toLocaleDateString('de-DE')}
                    </td>
                    <td className="py-4 text-sm font-bold text-zinc-900">{transaction.description}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600">
                        {transaction.category}
                      </span>
                    </td>
                    <td
                      className={`py-4 text-sm text-right font-black ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-zinc-900'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}€
                      {Math.abs(transaction.amount).toLocaleString()}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
    </PageShell>
  );
}
