import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const access = (await cookies()).get('access_token')?.value;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (access) headers['Authorization'] = `Bearer ${access}`;

  const search = req.nextUrl.search || '';
  const url = `https://journal.saraftech.com/api/v1/journal/trades/calendar${search}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  const contentType = res.headers.get('content-type') || 'application/json';
  try {
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: res.status, headers: { 'content-type': contentType } });
  } catch {
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  }
}


