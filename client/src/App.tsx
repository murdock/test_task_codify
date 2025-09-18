import { useEffect, useState, useRef, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import './App.css'

type RollResponse = {
  symbols: string[]
  win: boolean
  reward: number
  credits: number
}

function App() {
  const [credits, setCredits] = useState<number>(0)
  const [symbols, setSymbols] = useState<string[]>(['-', '-', '-'])
  const [spinning, setSpinning] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [serverError, setServerError] = useState(false)

  const revealTimers = useRef<number[]>([])

  const startSession = useCallback(async () => {
    cleanupTimers()
    setSymbols(['-', '-', '-'])
    setSpinning(false)
    try {
      const res = await fetch('http://localhost:4000/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId() }),
      })
      if (!res.ok) {
        alert('Failed to start session')
        return
      }
      const data = await res.json()
      setSid(data.sid)
      setCredits(data.credits)
    } catch (e) {
      console.log("[SERVER]: Error!", e);
      setServerError(true)
    }
    
  }, [])

  // --- Helpers for IDs ---
  function getUserId() {
    let userId = localStorage.getItem('userId')
    if (!userId) {
      userId = uuid()
      localStorage.setItem('userId', userId)
    }
    return userId
  }

  function getSid() {
    return sessionStorage.getItem('sid')
  }

  function setSid(sid: string) {
    sessionStorage.setItem('sid', sid)
  }

  function cleanupTimers() {
    revealTimers.current.forEach((id) => clearTimeout(id))
    revealTimers.current = []
  }

  async function roll() {
    if (spinning || credits < 1) return
    setSpinning(true)
    setSymbols(['X', 'X', 'X'])

    const sid = getSid()
    try {
      const res = await fetch('http://localhost:4000/api/roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid }),
      })
      if (!res.ok) {
        setSpinning(false)
        alert('Roll failed')
        return
      }
      const data: RollResponse = await res.json()
  
      cleanupTimers()
      const t1 = window.setTimeout(() => {
        setSymbols([emoji(data.symbols[0]), 'X', 'X'])
      }, 1000)
      const t2 = window.setTimeout(() => {
        setSymbols((prev) => [prev[0], emoji(data.symbols[1]), 'X'])
      }, 2000)
      const t3 = window.setTimeout(() => {
        setSymbols((prev) => [prev[0], prev[1], emoji(data.symbols[2])])
        setCredits(data.credits)
        setSpinning(false)
      }, 3000)
      revealTimers.current = [t1, t2, t3]
    } catch (e) {
      console.error(e)
      setServerError(true);
    }
    
  }

  async function cashout() {
    const sid = getSid()
    try {
      const res = await fetch('http://localhost:4000/api/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid, userId: getUserId() }),
      })
      if (!res.ok) {
        alert('Cash out failed')
        return
      }
      const data = await res.json()
      alert(`Cashed out ${data.credited} credits. Balance: ${data.balance}`)
      setCredits(0)
      setSymbols(['-', '-', '-'])
    } catch (e) {
      console.error(e)
      setServerError(true);
    }
    
  }

  useEffect(() => {
    startSession()
    return cleanupTimers
  }, [startSession])

  return (
    <div className="page">
      <h1>🎰 Slot Machine</h1>
      <p data-testid="credits">Credits: {credits}</p>

      <div className="machine">
        <div className="slot-machine">
          {symbols.map((s, i) => (
            <div key={i} className={`slot ${spinning ? 'spinning' : ''}`}>
              {s}
            </div>
          ))}
        </div>
        <div className={`lever ${pulling ? 'pull' : ''}`}></div>
      </div>

      <div className="buttons">
        <button
          className={`lever-button ${spinning || credits < 1 && "button-disabled"}`}
          onClick={() => {
            setPulling(true)
            setTimeout(() => setPulling(false), 600)
            roll()
          }}
          disabled={spinning || credits < 1}
        >
          🎰 Pull Lever
        </button>

        <button onClick={cashout} disabled={spinning || credits < 1}>
          Cash Out
        </button>
      </div>
      {serverError && (
        <div className="overlay">
          <div className="overlay-content">
            No server connection. Please try to refresh the page
          </div>
        </div>
      )}
    </div>
  )
}

function emoji(symbol: string): string {
  switch (symbol) {
    case 'C': return '🍒'
    case 'L': return '🍋'
    case 'O': return '🍊'
    case 'W': return '🍉'
    default: return symbol
  }
}

export default App
