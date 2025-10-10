import { NextRequest, NextResponse } from 'next/server';
import { getPLSeries } from '@/lib/services/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this-month';
    const category = searchParams.get('category') || 'total';
    
    const params = { period, category };
    const plSeries = await getPLSeries(params);
    
    return NextResponse.json(plSeries);
  } catch (error) {
    console.error('Error fetching P/L series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch P/L series' },
      { status: 500 }
    );
  }
}
