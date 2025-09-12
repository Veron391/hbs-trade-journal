import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTradeSchema = z.object({
  assetType: z.enum(['stock', 'crypto']).optional(),
  symbol: z.string().min(1).optional(),
  side: z.enum(['buy', 'sell']).optional(),
  qty: z.number().positive().optional(),
  price: z.number().positive().optional(),
  entryPrice: z.number().positive().optional(),
  pnl: z.number().optional().nullable(),
  occurredAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  entryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid entry date format"
  }).optional(),
  exitDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid exit date format"
  }).optional(),
  setupNotes: z.string().optional(),
  mistakesNotes: z.string().optional(),
  tags: z.string().optional(),
  link: z.string().optional(),
})

// PATCH /api/trades/[id] - Update trade
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id') || '1'
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateTradeSchema.parse(body)

    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findFirst({
      where: { id, userId },
    })

    if (!existingTrade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    const updateData: any = { 
      assetType: validatedData.assetType,
      symbol: validatedData.symbol,
      side: validatedData.side,
      qty: validatedData.qty,
      price: validatedData.price,
      entryPrice: validatedData.entryPrice,
      pnl: validatedData.pnl,
      setupNotes: validatedData.setupNotes,
      mistakesNotes: validatedData.mistakesNotes,
      tags: validatedData.tags,
      link: validatedData.link,
    };
    if (validatedData.occurredAt) {
      // Parse date string as local date to avoid timezone issues
      const [year, month, day] = validatedData.occurredAt.split('-').map(Number);
      updateData.occurredAt = new Date(year, month - 1, day);
    }
    if (validatedData.entryDate) {
      const [year, month, day] = validatedData.entryDate.split('-').map(Number);
      updateData.entryDate = new Date(year, month - 1, day);
    }
    if (validatedData.exitDate) {
      const [year, month, day] = validatedData.exitDate.split('-').map(Number);
      updateData.exitDate = new Date(year, month - 1, day);
    }

    const trade = await prisma.trade.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(trade)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 422 })
    }
    
    console.error('Error updating trade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/trades/[id] - Delete trade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id') || '1'
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findFirst({
      where: { id, userId },
    })

    if (!existingTrade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    await prisma.trade.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Trade deleted successfully' })
  } catch (error) {
    console.error('Error deleting trade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
