import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

function buildHeaders(access?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (access) headers['Authorization'] = `Bearer ${access}`;
  return headers;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = (await cookies()).get('access_token')?.value;
  const res = await fetch(`https://journal.saraftech.com/api/v1/journal/trades/${id}/`, {
    method: 'GET',
    headers: buildHeaders(access),
  });
  const text = await res.text();
  const contentType = res.headers.get('content-type') || 'application/json';
  try {
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: res.status, headers: { 'content-type': contentType } });
  } catch {
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const access = (await cookies()).get('access_token')?.value;
  const res = await fetch(`https://journal.saraftech.com/api/v1/journal/trades/${id}/`, {
    method: 'PUT',
    headers: buildHeaders(access),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const contentType = res.headers.get('content-type') || 'application/json';
  try {
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: res.status, headers: { 'content-type': contentType } });
  } catch {
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const access = (await cookies()).get('access_token')?.value;
  const res = await fetch(`https://journal.saraftech.com/api/v1/journal/trades/${id}/`, {
    method: 'PATCH',
    headers: buildHeaders(access),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const contentType = res.headers.get('content-type') || 'application/json';
  try {
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: res.status, headers: { 'content-type': contentType } });
  } catch {
    return new NextResponse(text, { status: res.status, headers: { 'content-type': contentType } });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = (await cookies()).get('access_token')?.value;
  const res = await fetch(`https://journal.saraftech.com/api/v1/journal/trades/${id}/`, {
    method: 'DELETE',
    headers: buildHeaders(access),
  });
  return new NextResponse(null, { status: res.status });
}


