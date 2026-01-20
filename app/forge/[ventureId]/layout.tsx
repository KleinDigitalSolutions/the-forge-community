import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ForgeSidebar from '@/app/components/ForgeSidebar';
import ForgeTopBar from '@/app/components/ForgeTopBar';
import { AIContextProvider } from '@/app/context/AIContext';
import ContextAwareAiSidebar from '@/app/components/ContextAwareAiSidebar';

export default async function ForgeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ ventureId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    return notFound();
  }

  const { ventureId } = await params;

  // Verify access to this venture
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return notFound();
  }

  const venture = await prisma.venture.findFirst({
    where: {
      id: ventureId,
      OR: [
        { ownerId: user.id },
        {
          squad: {
            members: {
              some: {
                userId: user.id,
                leftAt: null
              }
            }
          }
        }
      ]
    },
    include: {
      owner: { select: { name: true, email: true } },
      squad: {
        include: {
          members: {
            where: { leftAt: null },
            include: { user: { select: { name: true, email: true, image: true } } }
          }
        }
      }
    }
  });

  if (!venture) {
    return notFound();
  }

  return (
    <AIContextProvider>
      <div className="min-h-screen bg-black">
        {/* Sidebar */}
        <ForgeSidebar ventureId={ventureId} ventureName={venture.name} />

        {/* Main Content */}
        <div className="ml-64">
          {/* Top Bar */}
          <ForgeTopBar venture={venture} />

          {/* Content */}
          <main className="p-8 pb-32">
            {children}
          </main>
        </div>

        {/* AI Sidebar Overlay */}
        <ContextAwareAiSidebar />
      </div>
    </AIContextProvider>
  );
}
