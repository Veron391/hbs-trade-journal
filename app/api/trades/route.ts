import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

// Shared in-memory storage with [id]/route.ts
// In production, you would use a database
declare global {
  var trades: any[] | undefined
}

if (!global.trades) {
  global.trades = []
}

// Helper to get current user (mock implementation)
async function getCurrentUser(request: NextRequest) {
  // In a real app, this would come from JWT token or session
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') ||
                  request.cookies.get('userId')?.value || 
                  request.headers.get('x-user-id') || 
                  'default-user'
  
  return { id: userId, email: `${userId}@example.com` }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    // Filter trades for current user
    const userTrades = global.trades!.filter(t => t.userId === user.id)
    
    return NextResponse.json(userTrades)
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    const body = await request.json()

    // Calculate P&L if both entry and exit prices are provided
    let pnl = null
    if (body.exitPrice && body.entryPrice && body.qty) {
      const multiplier = body.direction === 'long' ? 1 : -1
      pnl = (body.exitPrice - body.entryPrice) * body.qty * multiplier
    }

    const newTrade = {
      id: uuidv4(),
      userId: user.id,
      assetType: body.assetType || 'stock',
      symbol: body.symbol,
      direction: body.direction || 'long',
      qty: body.qty,
      entryPrice: body.entryPrice,
      exitPrice: body.exitPrice || null,
      pnl,
      entryDate: body.entryDate || body.occurredAt || new Date().toISOString(),
      exitDate: body.exitDate || body.occurredAt || new Date().toISOString(),
      occurredAt: body.occurredAt || new Date().toISOString(), // Keep for backward compatibility
      setupNotes: body.setupNotes || null,
      tags: body.tags ? (Array.isArray(body.tags) ? body.tags.join(',') : body.tags) : null,
      link: body.link || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    global.trades!.push(newTrade)
    
    return NextResponse.json(newTrade)
  } catch (error) {
    console.error('Error creating trade:', error)
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    )
  }
}
