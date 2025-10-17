import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminAccessToken = cookieStore.get('admin_access_token')?.value;

    if (!adminAccessToken) {
      return NextResponse.json(
        { error: 'No admin authentication token found' },
        { status: 401 }
      );
    }

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

    const apiUrl = `https://journal.saraftech.com/api/v1/dashboard/dashboard/overview/?${queryParams.toString()}`;

    // Call the dashboard overview API with admin token
    const dashboardRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (dashboardRes.status === 403 || dashboardRes.status === 401) {
      return NextResponse.json(
        { error: 'Admin authentication required', requiresAuth: true },
        { status: dashboardRes.status }
      );
    }

    if (!dashboardRes.ok) {
      return NextResponse.json(
        { error: 'Dashboard API error' },
        { status: dashboardRes.status }
      );
    }

    const dashboardData = await dashboardRes.json();
    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('Dashboard overview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
