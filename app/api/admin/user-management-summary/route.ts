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
    
    console.log('Admin access token found, calling user management summary API');

    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const tradeType = searchParams.get('trade_type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query parameters for the backend API
    const queryParams = new URLSearchParams();
    if (tradeType) queryParams.append('trade_type', tradeType);
    if (status) queryParams.append('status', status);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const apiUrl = `https://journal.saraftech.com/api/v1/dashboard/dashboard/user-management/summary/?${queryParams.toString()}`;
    
    console.log('User Management Summary API URL:', apiUrl);
    console.log('Query params:', queryParams.toString());

    // Call the User Management Summary API with admin token
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const summaryRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('User Management Summary API Response Status:', summaryRes.status);
    
    if (summaryRes.status === 403 || summaryRes.status === 401) {
      console.log('Authentication failed for User Management Summary API');
      return NextResponse.json(
        { error: 'Admin authentication required', requiresAuth: true },
        { status: summaryRes.status }
      );
    }

    if (!summaryRes.ok) {
      const errorText = await summaryRes.text();
      console.error('User Management Summary API error:', summaryRes.status, errorText);
      return NextResponse.json(
        { error: `User Management Summary API error: ${summaryRes.status} - ${errorText}` },
        { status: summaryRes.status }
      );
    }

    const summaryData = await summaryRes.json();
    console.log('User Management Summary data received:', summaryData);
    return NextResponse.json(summaryData, { status: 200 });

  } catch (error) {
    console.error('User Management Summary API error:', error);
    
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
