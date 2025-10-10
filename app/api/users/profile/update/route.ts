import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const access = (await cookies()).get('access_token')?.value;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (access) headers['Authorization'] = `Bearer ${access}`;
  const backendRes = await fetch('https://journal.saraftech.com/api/v1/users/profile/update/', {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  const bodyText = await backendRes.text();
  const contentType = backendRes.headers.get('content-type') || 'application/json';
  try {
    const json = bodyText ? JSON.parse(bodyText) : {};
    return NextResponse.json(json, { status: backendRes.status, headers: { 'content-type': contentType } });
  } catch {
    return new NextResponse(bodyText, { status: backendRes.status, headers: { 'content-type': contentType } });
  }
}


