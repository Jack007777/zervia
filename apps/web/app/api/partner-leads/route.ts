import { NextResponse } from 'next/server';

import type { PartnerLead } from '../../../src/lib/api/types';

export const runtime = 'edge';

export async function POST(request: Request) {
  const body = (await request.json()) as PartnerLead;

  if (!body.businessName || !body.contactName || !body.phone || !body.city || !body.serviceCategory) {
    return NextResponse.json({ errorCode: 'VALIDATION_ERROR', message: 'Missing required fields' }, { status: 400 });
  }

  return NextResponse.json({
    leadId: crypto.randomUUID(),
    received: true,
    createdAt: new Date().toISOString(),
    message: 'Lead captured (MVP). Wire to CRM/DB in production.'
  });
}
