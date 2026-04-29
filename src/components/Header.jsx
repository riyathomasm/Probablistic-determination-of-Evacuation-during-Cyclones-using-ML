import { useState, useEffect } from 'react'
import './Header.css'

export default function Header({ activeStorm }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const utc = time.toUTCString().replace('GMT', 'UTC').slice(0, -4)

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <div className="logo-mark">
            <span className="logo-ring" />
            <span className="logo-dot" />
          </div>
          <div className="logo-text">
            <span className="logo-title">CYCLONE INTELLIGENCE</span>
            <span className="logo-sub">Tamil Nadu · Bay of Bengal</span>
          </div>
        </div>
      </div>

      <div className="header-center">
        {activeStorm ? (
          <div className="storm-active-badge">
            <span className="storm-pulse" />
            <span className="storm-active-label">ACTIVE STORM</span>
            <span className="storm-name">{activeStorm.name}</span>
          </div>
        ) : (
          <div className="no-storm-badge">
            <span className="no-storm-dot" />
            <span>NO ACTIVE CYCLONE</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="header-meta">
          <span className="meta-label">UTC</span>
          <span className="meta-value">{utc}</span>
        </div>
        <div className="header-meta">
          <span className="meta-label">SOURCE</span>
          <span className="meta-value">IBTrACS v04r00 · OISST v2.1</span>
        </div>
      </div>
    </header>
  )
}