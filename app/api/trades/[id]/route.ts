import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Shared in-memory storage with parent route
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    const { id } = await params
    const body = await request.json()

    // Find the trade and verify ownership
    const tradeIndex = global.trades!.findIndex(t => t.id === id && t.userId === user.id)
    if (tradeIndex === -1) {
      return NextResponse.json({ error: 'Trade not found or unauthorized' }, { status: 404 })
    }

    // Calculate P&L if both entry and exit prices are provided
    let pnl = global.trades![tradeIndex].pnl
    const updatedTrade = { ...global.trades![tradeIndex], ...body }
    
    if (updatedTrade.exitPrice && updatedTrade.entryPrice && updatedTrade.qty) {
      const multiplier = updatedTrade.direction === 'long' ? 1 : -1
      pnl = (updatedTrade.exitPrice - updatedTrade.entryPrice) * updatedTrade.qty * multiplier
    }

    global.trades![tradeIndex] = {
      ...updatedTrade,
      pnl,
      setupNotes: body.setupNotes !== undefined ? body.setupNotes : updatedTrade.setupNotes,
      tags: body.tags !== undefined ? (Array.isArray(body.tags) ? body.tags.join(',') : body.tags) : updatedTrade.tags,
      link: body.link !== undefined ? body.link : updatedTrade.link,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(global.trades![tradeIndex])
  } catch (error) {
    console.error('Error updating trade:', error)
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    const { id } = await params

    const initialLength = global.trades!.length
    global.trades = global.trades!.filter(t => !(t.id === id && t.userId === user.id))

    if (global.trades!.length === initialLength) {
      return NextResponse.json({ error: 'Trade not found or unauthorized' }, { status: 404 })
    }

    // Return success: true as expected by the client
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trade:', error)
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    )
  }
}