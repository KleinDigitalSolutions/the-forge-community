'use client';

import { useState, useEffect } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { Users, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPage() {
  const [applicants, setApplicants] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/applicants').then(res => res.json()).then(setApplicants);
  }, []);

  const handleApprove = async (id: string) => {
    await fetch('/api/founders/approve', { method: 'POST', body: JSON.stringify({ id }) });
    // Refresh logic here
  };

  return (
    <AuthGuard>
      <PageShell>
        <header className="mb-12">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Admin Konsole</h1>
          <p className="text-zinc-500 font-medium">Bewerbungen verwalten und Nutzer freischalten.</p>
        </header>

        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Name</th>
                <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</th>
                <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {applicants.map((app: any) => (
                <tr key={app.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="p-6 font-bold text-zinc-900">{app.name}</td>
                  <td className="p-6 text-zinc-600">{app.email}</td>
                  <td className="p-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-50 text-yellow-700">
                      {app.status}
                    </span>
                  </td>
                  <td className="p-6 text-right space-x-2">
                    <button onClick={() => handleApprove(app.id)} className="text-green-600 hover:text-green-800">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageShell>
    </AuthGuard>
  );
}