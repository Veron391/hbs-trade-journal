import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const cookieStore = await cookies();
  const access = cookieStore.get('access_token')?.value;
  
  if (!access) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const headers: Record<string, string> = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access}`
  };

  try {
      const backendRes = await fetch(
        `https://journal.saraftech.com/api/v1/journal/trades/calendar/day/${date}/`,
        {
          method: 'GET',
          headers,
          cache: 'no-store' // Disable caching
        }
      );

    const bodyText = await backendRes.text();
    const contentType = backendRes.headers.get('content-type') || 'application/json';
    const cacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (!backendRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch calendar day details' }, 
        { status: backendRes.status, headers: cacheHeaders }
      );
    }

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
  } catch (error) {
    console.error('Calendar day details API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
