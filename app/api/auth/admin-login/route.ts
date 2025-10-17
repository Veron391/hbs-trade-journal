import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const reqBody = await req.json();
    const { identifier, password } = reqBody;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    // Call the admin login API
    const backendRes = await fetch('https://journal.saraftech.com/api/v1/users/auth/admin/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const backendBodyText = await backendRes.text();
    const contentType = backendRes.headers.get('content-type') || 'application/json';

    let json: any = {};
    try {
      json = backendBodyText ? JSON.parse(backendBodyText) : {};
    } catch {
      // non-json response, return as-is
    }

    // If tokens are present in response body, set as HttpOnly cookies
    if (json && json.access && json.refresh) {
      const isSecure = req.nextUrl.protocol === 'https:';
      const cookieStore = await cookies();
      cookieStore.set('admin_access_token', json.access, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        path: '/',
        // access token expiry is managed by backend; do not set maxAge to force refresh handling later
      });
      cookieStore.set('admin_refresh_token', json.refresh, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        path: '/',
      });
    }

    if (Object.keys(json).length > 0) {
      return NextResponse.json(json, { status: backendRes.status, headers: { 'content-type': contentType } });
    }
    return new NextResponse(backendBodyText, { status: backendRes.status, headers: { 'content-type': contentType } });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
