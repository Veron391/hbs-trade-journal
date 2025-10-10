import { NextRequest, NextResponse } from 'next/server';
import { getTopAssets } from '@/lib/services/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this-month';
    const category = searchParams.get('category') || 'total';
    const limit = parseInt(searchParams.get('limit') || '7');
    
    const params = { period, category, limit };
    const topAssets = await getTopAssets(params);
    
    return NextResponse.json(topAssets);
  } catch (error) {
    console.error('Error fetching top assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top assets' },
      { status: 500 }
    );
  }
}
