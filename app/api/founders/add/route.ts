import { NextRequest, NextResponse } from 'next/server';
import { addFounder } from '@/lib/notion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, phone, instagram, why } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const result = await addFounder({
      name,
      email,
      phone,
      instagram,
      why,
    });

    return NextResponse.json({
      success: true,
      message: 'Founder application submitted successfully',
      founderId: result.id,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
