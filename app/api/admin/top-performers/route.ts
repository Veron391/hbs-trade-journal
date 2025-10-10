import { NextRequest, NextResponse } from 'next/server';
import { getTopPerformers } from '@/lib/services/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this-month';
    const category = searchParams.get('category') || 'total';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const params = { period, category, limit };
    const topPerformers = await getTopPerformers(params);
    
    return NextResponse.json(topPerformers);
  } catch (error) {
    console.error('Error fetching top performers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top performers' },
      { status: 500 }
    );
  }
}
