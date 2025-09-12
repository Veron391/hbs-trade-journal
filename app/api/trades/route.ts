import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const createTradeSchema = z.object({
  assetType: z.enum(['stock', 'crypto']),
  symbol: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  qty: z.union([z.string(), z.number()]).transform((val) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Quantity must be a positive number');
    }
    return num;
  }),
  price: z.union([z.string(), z.number()]).transform((val) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Price must be a positive number');
    }
    return num;
  }),
  entryPrice: z.union([z.string(), z.number()]).transform((val) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Entry price must be a positive number');
    }
    return num;
  }),
  pnl: z.union([z.string(), z.number(), z.undefined()]).transform((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }),
  occurredAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  entryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid entry date format"
  }),
  exitDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid exit date format"
  }),
  setupNotes: z.string().optional(),
  mistakesNotes: z.string().optional(),
  tags: z.string().optional(),
  link: z.string().optional(),
})

// GET /api/trades - Get all trades for current user
export async function GET(request: NextRequest) {
  try {
    // For now, we'll use a mock userId since we don't have NextAuth setup
    // In production, this would come from the session
    const userId = request.headers.get('x-user-id') || '1'
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
    })

    return NextResponse.json(trades)
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/trades - Create new trade
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '1'
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTradeSchema.parse(body)

    // Parse date strings as local dates to avoid timezone issues
    const [occurredYear, occurredMonth, occurredDay] = validatedData.occurredAt.split('-').map(Number);
    const occurredDate = new Date(occurredYear, occurredMonth - 1, occurredDay);
    
    const [entryYear, entryMonth, entryDay] = validatedData.entryDate.split('-').map(Number);
    const entryDate = new Date(entryYear, entryMonth - 1, entryDay);
    
    const [exitYear, exitMonth, exitDay] = validatedData.exitDate.split('-').map(Number);
    const exitDate = new Date(exitYear, exitMonth - 1, exitDay);
    
    const trade = await prisma.trade.create({
      data: {
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
        userId,
        occurredAt: occurredDate,
        entryDate: entryDate,
        exitDate: exitDate,
      },
    })

    return NextResponse.json(trade, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 422 })
    }
    
    console.error('Error creating trade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
