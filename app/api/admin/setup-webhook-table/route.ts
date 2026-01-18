import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

/**
 * Creates webhook_events table for Stripe webhook idempotency
 *
 * Run once: GET /api/admin/setup-webhook-table
 */
export async function GET() {
  // SECURITY: Only admin can run this
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    // Create webhook_events table for idempotency
    await sql`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) UNIQUE NOT NULL,
        event_type VARCHAR(100),
        processed_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Add index for fast lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
      ON webhook_events(event_id);
    `;

    return NextResponse.json({
      success: true,
      message: 'Webhook events table created successfully',
      table: 'webhook_events',
      columns: ['id', 'event_id', 'event_type', 'processed_at', 'created_at'],
      indexes: ['idx_webhook_events_event_id']
    });
  } catch (error: any) {
    console.error('Webhook table setup failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
