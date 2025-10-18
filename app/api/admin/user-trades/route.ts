import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminAccessToken = cookieStore.get('admin_access_token')?.value;

    if (!adminAccessToken) {
      console.log('No admin access token found in cookies for user trades API');
      return NextResponse.json(
        { error: 'No admin authentication token found' },
        { status: 401 }
      );
    }
    
    console.log('Admin access token found, calling user trades API');

    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const tradeType = searchParams.get('trade_type');
    const direction = searchParams.get('direction');
    const range = searchParams.get('range');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

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
    if (direction) queryParams.append('direction', direction);
    if (range) queryParams.append('range', range);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (search) queryParams.append('search', search);
    if (limit) queryParams.append('limit', limit);
    if (offset) queryParams.append('offset', offset);

    const apiUrl = `https://journal.saraftech.com/api/v1/dashboard/dashboard/user-trades/?${queryParams.toString()}`;
    
    console.log('User Trades API URL:', apiUrl);
    console.log('User Trades Query params:', queryParams.toString());

    // Call the User Trades API with admin token
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const userTradesRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('User Trades API Response Status:', userTradesRes.status);
    
    if (userTradesRes.status === 403 || userTradesRes.status === 401) {
      console.log('Authentication failed for User Trades API');
      return NextResponse.json(
        { error: 'Admin authentication required', requiresAuth: true },
        { status: userTradesRes.status }
      );
    }

    if (!userTradesRes.ok) {
      const errorText = await userTradesRes.text();
      console.error('User Trades API error:', userTradesRes.status, errorText);
      return NextResponse.json(
        { error: `User Trades API error: ${userTradesRes.status} - ${errorText}` },
        { status: userTradesRes.status }
      );
    }

    const userTradesData = await userTradesRes.json();
    console.log('User Trades data received:', userTradesData);
    return NextResponse.json(userTradesData, { status: 200 });

  } catch (error) {
    console.error('User Trades API error:', error);
    
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
