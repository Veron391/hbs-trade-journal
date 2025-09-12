import { Trade } from '@prisma/client'

export interface CreateTradePayload {
  assetType: 'stock' | 'crypto'
  symbol: string
  side: 'buy' | 'sell'
  qty: number
  price: number
  pnl?: number
  occurredAt: string
  entryDate: string
  exitDate: string
  setupNotes?: string
  mistakesNotes?: string
  tags?: string
  link?: string
}

export interface UpdateTradePayload extends Partial<CreateTradePayload> {}

// API functions
export async function listTrades(): Promise<Trade[]> {
  const response = await fetch('/api/trades', {
    headers: {
      'x-user-id': '1', // Mock userId for now
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch trades')
  }
  
  return response.json()
}

export async function createTrade(payload: CreateTradePayload): Promise<Trade> {
  const response = await fetch('/api/trades', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': '1', // Mock userId for now
    },
    body: JSON.stringify(payload),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create trade')
  }
  
  return response.json()
}

export async function updateTrade(id: string, payload: UpdateTradePayload): Promise<Trade> {
  const response = await fetch(`/api/trades/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': '1', // Mock userId for now
    },
    body: JSON.stringify(payload),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update trade')
  }
  
  return response.json()
}

export async function deleteTrade(id: string): Promise<void> {
  const response = await fetch(`/api/trades/${id}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': '1', // Mock userId for now
    },
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete trade')
  }
}
