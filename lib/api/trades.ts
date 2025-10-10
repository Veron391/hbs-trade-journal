// Types
export type Trade = {
  id: string
  userId?: string
  assetType: 'stock' | 'crypto'
  symbol: string
  direction: 'long' | 'short'
  qty: number
  entryPrice: number
  exitPrice?: number | null
  pnl?: number | null
  pnlAmount?: number | null
  pnlPercentage?: number | null
  entryDate: string
  exitDate: string
  occurredAt?: string
  setupNotes?: string | null
  mistakesLearnings?: string | null
  link?: string | null
  createdAt?: string
  updatedAt?: string
}

export type CreateTradeData = Omit<Trade, 'id' | 'pnl' | 'createdAt' | 'updatedAt'>;
export type UpdateTradeData = Partial<Omit<CreateTradeData, 'userId'>>;

// Fetch helpers (use built-in fetch)
const json = async (res: Response) => {
  if (!res.ok) {
    const body = await res.text().catch(()=>'')
    throw new Error(`HTTP ${res.status} ${res.statusText} ${body}`)
  }
  return res.json()
}

// No localStorage coupling

// API functions (named exports)
export async function listTrades(): Promise<Trade[]> {
  try {
    const res = await json(await fetch(`/api/journal/trades?t=${Date.now()}`, { 
      cache: 'no-store' // Disable caching
    }))
    const results = Array.isArray(res.results) ? res.results : []
    return results.map(mapBackendToTrade)
  } catch (error) {
    console.error('Error fetching trades:', error)
    return [] // Return empty array on error
  }
}

export async function createTrade(payload: CreateTradeData): Promise<Trade> {
  const body = createPayloadToBackend(payload)
  const res = await json(await fetch('/api/journal/trades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))
  return mapBackendToTrade(res)
}

export async function updateTrade(id: string, payload: UpdateTradeData): Promise<Trade> {
  const body = updatePayloadToBackend(payload)
  let response = await fetch(`/api/journal/trades/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    // Fallback to PATCH if server does not accept PUT
    response = await fetch(`/api/journal/trades/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    })
  }
  const jsonBody = await json(response as any)
  return mapBackendToTrade(jsonBody)
}

export async function deleteTrade(id: string): Promise<{ success: true }> {
  const res = await fetch(`/api/journal/trades/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { success: true }
}

// Calendar day details API
export type CalendarDayDetails = {
  date: string
  summary: {
    total_pnl: number
    trade_count: number
    assets_traded: string[]
  }
  trades: Array<{
    id: number
    symbol: string
    direction: 'long' | 'short'
    profit_amount: number
    entryPrice?: number
    exitPrice?: number
    quantity?: number
    setupNotes?: string
    mistakesLearnings?: string
    link?: string
  }>
}

export async function getCalendarDayDetails(date: string): Promise<CalendarDayDetails> {
  try {
    const formattedDate = date.slice(0, 10) // Ensure YYYY-MM-DD format
    const res = await json(await fetch(`/api/calendar/day/${formattedDate}?t=${Date.now()}`, {
      credentials: 'include', // Include cookies for authentication
      cache: 'no-store' // Disable caching
    }))
    return res
  } catch (error) {
    console.error('Error fetching calendar day details:', error)
    return {
      totalPnL: 0,
      trades: 0,
      assets: [],
      tradeDetails: []
    }
  }
}

function mapBackendToTrade(b: any): Trade {
  const assetType = b.trade_type === 2 ? 'stock' : 'crypto'
  return {
    id: String(b.id),
    assetType,
    symbol: b.symbol,
    direction: b.direction,
    qty: Number(b.quantity),
    entryPrice: Number(b.buy_price),
    exitPrice: b.sell_price != null ? Number(b.sell_price) : null,
    pnl: null,
    pnlAmount: b.pnl_amount ?? null,
    pnlPercentage: b.pnl_percentage ?? null,
    entryDate: b.entry_date,
    exitDate: b.exit_date,
    setupNotes: b.trade_setup_notes ?? '',
    mistakesLearnings: b.ml_notes ?? '',
    link: b.trade_link ?? '',
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }
}

function createPayloadToBackend(p: CreateTradeData) {
  const trade_type = p.assetType === 'stock' ? 2 : 1
  return {
    trade_type,
    symbol: p.symbol,
    direction: p.direction,
    quantity: Number(p.qty),
    entry_date: p.entryDate.slice(0,10),
    exit_date: p.exitDate.slice(0,10),
    buy_price: String(p.entryPrice),
    sell_price: String(p.exitPrice ?? ''),
    trade_link: p.link ?? '',
    trade_setup_notes: p.setupNotes ?? '',
    ml_notes: p.mistakesLearnings ?? '',
  }
}

function updatePayloadToBackend(p: UpdateTradeData) {
  const obj: any = {}
  if (p.assetType) obj.trade_type = p.assetType === 'stock' ? 2 : 1
  if (p.symbol) obj.symbol = p.symbol
  if (p.direction) obj.direction = p.direction
  if (p.qty != null) obj.quantity = Number(p.qty)
  if (p.entryDate) obj.entry_date = p.entryDate.slice(0,10)
  if (p.exitDate) obj.exit_date = p.exitDate.slice(0,10)
  if (p.entryPrice != null) obj.buy_price = String(p.entryPrice)
  if (p.exitPrice != null) obj.sell_price = String(p.exitPrice)
  if (p.link != null) obj.trade_link = p.link
  if (p.setupNotes != null) obj.trade_setup_notes = p.setupNotes
  if (p.mistakesLearnings != null) obj.ml_notes = p.mistakesLearnings
  return obj
}
