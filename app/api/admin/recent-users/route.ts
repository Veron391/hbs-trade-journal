import { NextRequest, NextResponse } from 'next/server';
import { getRecentUsers } from '@/lib/services/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this-month';
    const category = searchParams.get('category') || 'total';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const params = { period, category, limit };
    const recentUsers = await getRecentUsers(params);
    
    return NextResponse.json(recentUsers);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent users' },
      { status: 500 }
    );
  }
}
