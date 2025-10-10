import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const access = (await cookies()).get('access_token')?.value;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (access) headers['Authorization'] = `Bearer ${access}`;

  const backendRes = await fetch('https://journal.saraftech.com/api/v1/journal/trades/', {
    method: 'GET',
    headers,
    cache: 'no-store' // Disable caching
  });

  const bodyText = await backendRes.text();
  const contentType = backendRes.headers.get('content-type') || 'application/json';
  const cacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  try {
    const json = bodyText ? JSON.parse(bodyText) : {};
    return NextResponse.json(json, { 
      status: backendRes.status, 
      headers: { 'content-type': contentType, ...cacheHeaders } 
    });
  } catch {
    return new NextResponse(bodyText, { 
      status: backendRes.status, 
      headers: { 'content-type': contentType, ...cacheHeaders } 
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const access = (await cookies()).get('access_token')?.value;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (access) headers['Authorization'] = `Bearer ${access}`;

  const backendRes = await fetch('https://journal.saraftech.com/api/v1/journal/trades/', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const bodyText = await backendRes.text();
  const contentType = backendRes.headers.get('content-type') || 'application/json';
  const cacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  try {
    const json = bodyText ? JSON.parse(bodyText) : {};
    return NextResponse.json(json, { 
      status: backendRes.status, 
      headers: { 'content-type': contentType, ...cacheHeaders } 
    });
  } catch {
    return new NextResponse(bodyText, { 
      status: backendRes.status, 
      headers: { 'content-type': contentType, ...cacheHeaders } 
    });
  }
}


