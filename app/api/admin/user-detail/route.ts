import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminAccessToken = cookieStore.get('admin_access_token')?.value;

    if (!adminAccessToken) {
      console.log('No admin access token found in cookies for user detail API');
      return NextResponse.json(
        { error: 'No admin authentication token found' },
        { status: 401 }
      );
    }
    
    console.log('Admin access token found, calling user detail API');

    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const tradeType = searchParams.get('trade_type');
    const range = searchParams.get('range');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      );
    }

    // Build query parameters for the backend API
    const queryParams = new URLSearchParams();
    queryParams.append('user_id', userId);
    if (tradeType) queryParams.append('trade_type', tradeType);
    if (range) queryParams.append('range', range);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const apiUrl = `https://journal.saraftech.com/api/v1/dashboard/dashboard/user-detail/?${queryParams.toString()}`;
    
    console.log('User Detail API URL:', apiUrl);
    console.log('User Detail Query params:', queryParams.toString());

    // Call the User Detail API with admin token
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const userDetailRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('User Detail API Response Status:', userDetailRes.status);
    
    if (userDetailRes.status === 403 || userDetailRes.status === 401) {
      console.log('Authentication failed for User Detail API');
      return NextResponse.json(
        { error: 'Admin authentication required', requiresAuth: true },
        { status: userDetailRes.status }
      );
    }

    if (!userDetailRes.ok) {
      const errorText = await userDetailRes.text();
      console.error('User Detail API error:', userDetailRes.status, errorText);
      return NextResponse.json(
        { error: `User Detail API error: ${userDetailRes.status} - ${errorText}` },
        { status: userDetailRes.status }
      );
    }

    const userDetailData = await userDetailRes.json();
    console.log('User Detail data received:', userDetailData);
    return NextResponse.json(userDetailData, { status: 200 });

  } catch (error) {
    console.error('User Detail API error:', error);
    
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
