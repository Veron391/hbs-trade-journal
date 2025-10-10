import { NextRequest, NextResponse } from 'next/server';
import { getAdminAggregates } from '@/lib/services/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this-month';
    const category = searchParams.get('category') || 'total';
    
    const params = { period, category };
    const aggregates = await getAdminAggregates(params);
    
    return NextResponse.json(aggregates);
  } catch (error) {
    console.error('Error fetching admin aggregates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin aggregates' },
      { status: 500 }
    );
  }
}
