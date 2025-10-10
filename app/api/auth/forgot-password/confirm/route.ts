import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const reqBody = await req.json();
  const backendRes = await fetch('https://journal.saraftech.com/api/v1/users/auth/forgot-password/confirm/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
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


