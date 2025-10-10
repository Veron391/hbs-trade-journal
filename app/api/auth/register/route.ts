import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const reqBody = await req.json();
  const backendRes = await fetch('https://journal.saraftech.com/api/v1/users/auth/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
    redirect: 'manual',
  });

  const bodyText = await backendRes.text();
  const contentType = backendRes.headers.get('content-type') || 'application/json';
  const setCookieHeader = backendRes.headers.get('set-cookie');
  if (setCookieHeader) {
    cookies().set('backendCookies', setCookieHeader, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  }

  try {
    const json = bodyText ? JSON.parse(bodyText) : {};
    return NextResponse.json(json, { status: backendRes.status, headers: { 'content-type': contentType } });
  } catch {
    return new NextResponse(bodyText, { status: backendRes.status, headers: { 'content-type': contentType } });
  }
}


