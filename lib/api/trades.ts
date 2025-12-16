// Types
export type Trade = {
  id: string
  userId?: string
  assetType: 'stock' | 'crypto'
  type?: 'stock' | 'crypto' // compatibility field for UI components
  symbol: string
  direction: 'long' | 'short'
  qty: number
  quantity?: number // compatibility for UI components expecting `quantity`
  entryPrice: number
  exitPrice?: number | null
  riskPercent?: number | null
  pnl?: number | null
  pnlAmount?: number | null
  pnlPercentage?: number | null
  entryDate: string
  exitDate?: string | null
  occurredAt?: string
  setupNotes?: string | null
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

// Pagination response type
export interface TradesListResponse {
  trades: Trade[];
  count: number;
  next: string | null;
  previous: string | null;
}

// API functions (named exports)
export async function listTrades(limit: number = 10, offset: number = 0, ordering?: string): Promise<TradesListResponse> {
  try {
    const orderingParam = ordering ? `&ordering=${encodeURIComponent(ordering)}` : '';
    const res = await fetch(`/api/journal/trades?limit=${limit}&offset=${offset}${orderingParam}&t=${Date.now()}`, { 
      cache: 'no-store' // Disable caching
    })
    
    // Handle authentication errors gracefully
    if (res.status === 403 || res.status === 401) {
      console.log('User not authenticated, returning empty trades list')
      return {
        trades: [],
        count: 0,
        next: null,
        previous: null
      }
    }
    
    const data = await json(res)
    const results = Array.isArray(data.results) ? data.results : []
    
    return {
      trades: results.map(mapBackendToTrade),
      count: typeof data.count === 'number' ? data.count : results.length,
      next: data.next || null,
      previous: data.previous || null
    }
  } catch (error) {
    console.error('Error fetching trades:', error)
    return {
      trades: [],
      count: 0,
      next: null,
      previous: null
    }
  }
}

// Fetch all trades using pagination
export async function listAllTrades(ordering?: string): Promise<Trade[]> {
  const allTrades: Trade[] = []
  let offset = 0
  const limit = 100 // Fetch 100 at a time
  let hasMore = true

  try {
    while (hasMore) {
      const response = await listTrades(limit, offset, ordering)
      allTrades.push(...response.trades)
      
      // Check if there are more trades to fetch
      // Continue if we got a full page (limit trades) or if next URL exists
      if (response.trades.length === limit || response.next) {
        offset += limit
        // If we got fewer trades than the limit, we're done
        if (response.trades.length < limit) {
          hasMore = false
        }
      } else {
        hasMore = false
      }
    }
    
    return allTrades
  } catch (error) {
    console.error('Error fetching all trades:', error)
    return allTrades // Return whatever we've fetched so far
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
    link?: string
  }>
}

export async function getCalendarDayDetails(date: string): Promise<CalendarDayDetails> {
  try {
    const formattedDate = date.slice(0, 10) // Ensure YYYY-MM-DD format
    const res = await fetch(`/api/calendar/day/${formattedDate}?t=${Date.now()}`, {
      credentials: 'include', // Include cookies for authentication
      cache: 'no-store' // Disable caching
    })
    
    // Handle authentication errors gracefully
    if (res.status === 403 || res.status === 401) {
      console.log('User not authenticated, returning empty calendar details')
      return {
        totalPnL: 0,
        trades: 0,
        assets: [],
        tradeDetails: []
      }
    }
    
    const data = await json(res)
    return data
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
  
  // Extract only date portion (YYYY-MM-DD) from datetime strings
  const extractDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    // If it includes time (YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm), extract just the date part
    if (dateStr.includes('T')) {
      return dateStr.slice(0, 10); // Extract YYYY-MM-DD
    }
    if (dateStr.includes(' ')) {
      return dateStr.slice(0, 10); // Extract YYYY-MM-DD from space-separated format
    }
    // If it's already just a date (YYYY-MM-DD), use it as-is
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    return dateStr;
  };
  
  return {
    id: String(b.id),
    assetType,
    type: assetType, // Add type field for compatibility with TradeList component
    symbol: b.symbol,
    direction: b.direction,
    qty: Number(b.quantity),
    quantity: Number(b.quantity),
    entryPrice: Number(b.buy_price),
    exitPrice: b.sell_price != null ? Number(b.sell_price) : null,
    riskPercent: b.risk_percent != null ? Number(b.risk_percent) : null,
    pnl: null,
    pnlAmount: b.pnl_amount ?? null,
    pnlPercentage: b.pnl_percentage ?? null,
    entryDate: extractDate(b.entry_date) || '',
    exitDate: extractDate(b.exit_date),
    setupNotes: b.trade_setup_notes ?? '',
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
    // Backend requires non-null exit_date; for pending, mirror entry_date
    exit_date: (p.exitDate && p.exitDate.trim() !== '') ? p.exitDate.slice(0,10) : p.entryDate.slice(0,10),
    buy_price: String(p.entryPrice),
    // Backend requires non-null sell_price; for pending, send 0
    sell_price: p.exitPrice != null ? String(p.exitPrice) : '0',
    risk_percent: p.riskPercent ?? null,
    trade_link: p.link ?? '',
    trade_setup_notes: p.setupNotes ?? '',
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
  if (p.riskPercent != null) obj.risk_percent = p.riskPercent
  if (p.link != null) obj.trade_link = p.link
  if (p.setupNotes != null) obj.trade_setup_notes = p.setupNotes
  return obj
}
