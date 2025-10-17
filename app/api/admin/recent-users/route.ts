import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminAccessToken = cookieStore.get('admin_access_token')?.value;

    if (!adminAccessToken) {
      console.log('No admin access token found in cookies');
      return NextResponse.json(
        { error: 'No admin authentication token found' },
        { status: 401 }
      );
    }
    
    console.log('Admin access token found, proceeding with API call');

    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const tradeType = searchParams.get('trade_type');
    const range = searchParams.get('range');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query parameters for the backend API
    const queryParams = new URLSearchParams();
    if (tradeType) queryParams.append('trade_type', tradeType);
    if (range) queryParams.append('range', range);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const apiUrl = `https://journal.saraftech.com/api/v1/dashboard/dashboard/recent-users/?${queryParams.toString()}`;
    
    console.log('Recent Users API URL:', apiUrl);
    console.log('Query params:', queryParams.toString());

    // Call the Recent Users API with admin token
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const recentUsersRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('Recent Users API Response Status:', recentUsersRes.status);
    
    if (recentUsersRes.status === 403 || recentUsersRes.status === 401) {
      console.log('Authentication failed for Recent Users API');
      return NextResponse.json(
        { error: 'Admin authentication required', requiresAuth: true },
        { status: recentUsersRes.status }
      );
    }

    if (!recentUsersRes.ok) {
      const errorText = await recentUsersRes.text();
      console.error('Recent Users API error:', recentUsersRes.status, errorText);
      return NextResponse.json(
        { error: `Recent Users API error: ${recentUsersRes.status} - ${errorText}` },
        { status: recentUsersRes.status }
      );
    }

    const recentUsersData = await recentUsersRes.json();
    console.log('Recent Users data received:', recentUsersData);
    return NextResponse.json(recentUsersData, { status: 200 });

  } catch (error) {
    console.error('Recent Users API error:', error);
    
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