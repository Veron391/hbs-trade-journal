import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminAccessToken = cookieStore.get('admin_access_token')?.value;

    if (!adminAccessToken) {
      console.log('No admin access token found in cookies for user management users API');
      return NextResponse.json(
        { error: 'No admin authentication token found' },
        { status: 401 }
      );
    }
    
    console.log('Admin access token found, calling user management users API');

    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const tradeType = searchParams.get('trade_type');
    const status = searchParams.get('status');
    const range = searchParams.get('range');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Build query parameters for the backend API
    const queryParams = new URLSearchParams();
    if (tradeType) queryParams.append('trade_type', tradeType);
    if (status) queryParams.append('status', status);
    if (range) queryParams.append('range', range);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (search) queryParams.append('search', search);
    if (limit) queryParams.append('limit', limit);
    if (offset) queryParams.append('offset', offset);

    const apiUrl = `https://journal.saraftech.com/api/v1/dashboard/dashboard/user-management/users/?${queryParams.toString()}`;
    
    console.log('User Management Users API URL:', apiUrl);
    console.log('User Management Users Query params:', queryParams.toString());

    // Call the User Management Users API with admin token
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const usersRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('User Management Users API Response Status:', usersRes.status);
    
    if (usersRes.status === 403 || usersRes.status === 401) {
      console.log('Authentication failed for User Management Users API');
      return NextResponse.json(
        { error: 'Admin authentication required', requiresAuth: true },
        { status: usersRes.status }
      );
    }

    if (!usersRes.ok) {
      const errorText = await usersRes.text();
      console.error('User Management Users API error:', usersRes.status, errorText);
      return NextResponse.json(
        { error: `User Management Users API error: ${usersRes.status} - ${errorText}` },
        { status: usersRes.status }
      );
    }

    const usersData = await usersRes.json();
    console.log('User Management Users data received:', usersData);
    return NextResponse.json(usersData, { status: 200 });

  } catch (error) {
    console.error('User Management Users API error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - API took too long to respond' },
        { status: 408 }
      );
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error - Unable to connect to API' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
