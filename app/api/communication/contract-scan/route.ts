import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { RateLimiters } from '@/lib/rate-limit';
import { analyzeContractPdf } from '@/lib/ai-contract-scan';

export const dynamic = 'force-dynamic';

const MAX_PDF_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const rateLimitResponse = await RateLimiters.heavy(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const context = String(formData.get('context') || '');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'PDF fehlt' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Nur PDF-Dateien sind erlaubt' }, { status: 400 });
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF ist zu gross (max 8MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await analyzeContractPdf({
      fileName: file.name,
      buffer,
      context,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Contract scan failed', error);
    return NextResponse.json({ error: 'Analyse fehlgeschlagen' }, { status: 500 });
  }
}
