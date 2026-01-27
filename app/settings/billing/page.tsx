import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { BillingOverview } from './components/BillingOverview';
import { SubscriptionCard } from './components/SubscriptionCard';
import { CreditBalanceCard } from './components/CreditBalanceCard';
import { InvoiceList } from './components/InvoiceList';

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Fetch user with all billing-related data
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      credits: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      subscriptionEndsAt: true,
      energyTransactions: {
        where: { type: 'GRANT' },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!user) {
    redirect('/login');
  }

  const recentGrants = user.energyTransactions.map((grant) => ({
    id: grant.id,
    delta: grant.delta,
    feature: grant.feature ?? 'other',
    createdAt: grant.createdAt,
  }));

  const invoices = await prisma.platformInvoice.findMany({
    where: {
      OR: [
        { ledgerEntry: { userId: user.id } },
        { buyerEmail: user.email },
      ],
    },
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      currency: true,
      status: true,
      issueDate: true,
      pdfUrl: true,
      lineItems: {
        select: {
          id: true,
          description: true,
        },
      },
    },
    orderBy: { issueDate: 'desc' },
    take: 20,
  });

  return (
    <AuthGuard>
      <PageShell>
        <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
          {/* Header */}
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.3em]">
              Billing & Abrechnung
            </div>
            <h1 className="text-4xl md:text-5xl font-instrument-serif text-white">
              Abrechnung & Credits
            </h1>
            <p className="text-sm text-white/40">
              Verwalte dein Abo, Credits und Rechnungen
            </p>
          </header>

          {/* Overview Cards */}
          <BillingOverview
            credits={user.credits}
            subscriptionStatus={user.subscriptionStatus}
            subscriptionTier={user.subscriptionTier}
          />

          {/* Subscription Management */}
          <SubscriptionCard
            stripeSubscriptionId={user.stripeSubscriptionId}
            subscriptionStatus={user.subscriptionStatus}
            subscriptionTier={user.subscriptionTier}
            subscriptionEndsAt={user.subscriptionEndsAt}
          />

          {/* Credit Balance & Purchase */}
          <CreditBalanceCard
            currentCredits={user.credits}
            recentGrants={recentGrants}
          />

          {/* Invoice History */}
          <InvoiceList invoices={invoices} />
        </div>
      </PageShell>
    </AuthGuard>
  );
}
