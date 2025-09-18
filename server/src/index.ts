import express from 'express'
import type { Express } from 'express'
import cors from 'cors'
import { v4 as uuid } from 'uuid'
import { createClient } from 'redis'

// --- Redis client ---
const redis = createClient()
redis.on("error", (err) => console.error("Redis Client Error", err))

// --- Express app ---
const app: Express = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// --- Types ---
interface Session {
  credits: number
  active: boolean
}

interface Account {
  balance: number
}

// --- Helpers ---
function newSession(): Session {
  return { credits: 10, active: true }
}

function rollSymbols() {
  const symbols = ['C', 'L', 'O', 'W']
  return Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)])
}

function rewardFor(symbol: string) {
  return { C: 10, L: 20, O: 30, W: 40 }[symbol] || 0
}

async function getSession(sid: string): Promise<Session | null> {
  if (!sid) return null
  const raw = await redis.get(`session:${sid}`)
  return raw ? (JSON.parse(raw) as Session) : null
}

async function setSession(sid: string, session: Session) {
  await redis.set(`session:${sid}`, JSON.stringify(session), {
    EX: 60 * 60 * 24, // expire in 24h
  })
}

async function getAccount(userId: string): Promise<Account> {
  const raw = await redis.get(`account:${userId}`)
  return raw ? (JSON.parse(raw) as Account) : { balance: 0 }
}

async function setAccount(userId: string, account: Account) {
  await redis.set(`account:${userId}`, JSON.stringify(account))
}

// --- Routes ---

app.post('/api/session', async (req, res) => {
    const { userId, preloadCredits } = req.body
    if (!userId) return res.status(400).json({ error: 'No userId provided' })
  
    const sid = uuid()
    const session = newSession()
    console.log('new session', sid, session)
    if (preloadCredits && process.env.NODE_ENV === 'test') {
      session.credits = preloadCredits
    }
  
    await setSession(sid, session)
    res.json({ sid, credits: session.credits })
  })
  

// Roll the slots
app.post('/api/roll', async (req, res) => {
    const { sid, forceSymbols } = req.body
    if (!sid) return res.status(400).json({ error: 'No session id' })
  
    const session = await getSession(sid)
    if (!session || !session.active) return res.status(400).json({ error: 'No session' })
    if (session.credits < 1) return res.status(400).json({ error: 'No credits' })
  
    const preCredits = session.credits
    let result = forceSymbols && process.env.NODE_ENV === 'test'
      ? { symbols: forceSymbols, win: true, reward: rewardFor(forceSymbols[0]) }
      : doRoll()
  
    // CHEATING
    if (result.win && !forceSymbols) {
      const cheatChance = preCredits > 60 ? 0.6 : preCredits >= 40 ? 0.3 : 0
      if (Math.random() < cheatChance) result = doRoll()
    }
  
    // PAYOUT
    if (result.win) {
      session.credits += result.reward
    } else {
      session.credits -= 1
    }
  
    await setSession(sid, session)
    res.json({ ...result, credits: session.credits })
  })
  

app.post('/api/cashout', async (req, res) => {
  const { sid, userId } = req.body
  if (!sid || !userId) return res.status(400).json({ error: 'Missing sid or userId' })

  const session = await getSession(sid)
  if (!session || !session.active) return res.status(400).json({ error: 'No session' })

  let account = await getAccount(userId)
  account.balance += session.credits
  await setAccount(userId, account)

  session.active = false
  await setSession(sid, session)

  res.json({ credited: session.credits, balance: account.balance })
})

// --- Roll helper ---
function doRoll() {
  const symbols = rollSymbols()
  const win = symbols[0] === symbols[1] && symbols[1] === symbols[2]
  const reward = win && symbols[0] ? rewardFor(symbols[0]) : 0
  return { symbols, win, reward }
}

// --- Export app for tests ---
export default app

// --- Startup (only if run directly) ---
if (require.main === module) {
  ;(async () => {
    await redis.connect()
    app.listen(4000, () =>
      console.log('Slots App is running on http://localhost:4000')
    )
  })().catch((err) => {
    console.error('Failed to start server:', err)
  })
}
