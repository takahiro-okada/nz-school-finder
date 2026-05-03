import { NextResponse } from 'next/server';
import zonesData from '../../../data/school_zones_by_id.json';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolParam = url.searchParams.get('school')?.trim();

  if (!schoolParam) {
    return NextResponse.json(
      { error: 'Missing school query parameter.' },
      { status: 400 }
    );
  }

  const schoolZones = Array.isArray((zonesData as Record<string, unknown>)[schoolParam])
    ? (zonesData as Record<string, unknown>)[schoolParam]
    : [];

  return NextResponse.json(
    { schoolZones },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
