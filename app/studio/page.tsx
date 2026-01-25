import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { STUDIO_VENTURE_DESCRIPTION, STUDIO_VENTURE_NAME } from '@/lib/studio-venture';
import StudioClient from './StudioClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getOrCreateStudioVentureId(email: string | null): Promise<string | null> {
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return null;

  const existing = await prisma.venture.findFirst({
    where: {
      ownerId: user.id,
      description: STUDIO_VENTURE_DESCRIPTION,
    },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await prisma.venture.create({
    data: {
      ownerId: user.id,
      name: STUDIO_VENTURE_NAME,
      description: STUDIO_VENTURE_DESCRIPTION,
      type: 'OTHER',
      status: 'PAUSED',
      currentPhase: 1,
    },
    select: { id: true },
  });

  return created.id;
}

export default async function StudioPage() {
  const session = await auth();
  const email = session?.user?.email || null;
  const ventureId = await getOrCreateStudioVentureId(email);

  return <StudioClient ventureId={ventureId} />;
}
