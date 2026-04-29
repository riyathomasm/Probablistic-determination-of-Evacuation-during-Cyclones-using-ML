import { useState } from 'react'
import { computeEvacPressure, formatPop } from '../utils/riskScoring'
import './EvacPanel.css'

// Surge height presets based on IMD intensity categories
const SURGE_SCENARIOS = [
  { label: 'CS (Cat 1)',   surge: 1.5, wind: 65,  hours: 48 },
  { label: 'SCS (Cat 2)',  surge: 2.5, wind: 90,  hours: 36 },
  { label: 'VSCS (Cat 3)', surge: 3.5, wind: 120, hours: 24 },
  { label: 'ESCS (Cat 4)', surge: 5.0, wind: 155, hours: 18 },
]

export default function EvacPanel({ district }) {
  const [scenario, setScenario] = useState(1) // default SCS
  const p = district.properties

  const sc = SURGE_SCENARIOS[scenario]
  const evac = computeEvacPressure(p, sc.surge, sc.hours)

  const urgencyColor = !evac ? '#4a5a68'
    : evac.urgencyScore > 0.9 ? '#ef4444'
    : evac.urgencyScore > 0.6 ? '#f59e0b'
    : '#10b981'

  return (
    <div className="evac-tab">

      {/* Scenario selector */}
      <div className="evac-section-label">STORM SCENARIO</div>
      <div className="scenario-grid">
        {SURGE_SCENARIOS.map((s, i) => (
          <button
            key={s.label}
            className={`scenario-btn ${scenario === i ? 'active' : ''}`}
            onClick={() => setScenario(i)}
          >
            <span className="scenario-label">{s.label}</span>
            <span className="scenario-detail">{s.surge}m surge · {s.hours}h</span>
          </button>
        ))}
      </div>

      {/* Urgency gauge */}
      {evac && (
        <>
          <div className="evac-section-label" style={{ marginTop: 16 }}>
            EVACUATION PRESSURE
          </div>

          <div className="urgency-bar-container">
            <div className="urgency-bar">
              <div
                className="urgency-fill"
                style={{
                  width: `${Math.min(100, evac.urgencyScore * 100)}%`,
                  background: urgencyColor,
                }}
              />
            </div>
            <span className="urgency-label" style={{ color: urgencyColor }}>
              {urgencyLabel(evac.urgencyScore)}
            </span>
          </div>

          {/* Key numbers */}
          <div className="evac-numbers">
            <EvacNumber
              label="Hours needed to evacuate"
              value={`${evac.hoursNeeded}h`}
              accent={evac.hoursNeeded > sc.hours ? 'red' : 'green'}
            />
            <EvacNumber
              label="Hours available"
              value={`${evac.hoursAvailable}h`}
              accent="dim"
            />
            <EvacNumber
              label="Population at risk"
              value={formatPop(p.population_2020)}
              accent="dim"
            />
            <EvacNumber
              label="Effective evac capacity"
              value={p.egress_capacity_veh_hr
                ? `${formatPop(p.egress_capacity_veh_hr * 0.75 * 3.5)}/hr`
                : '—'}
              accent="dim"
            />
            {evac.deficit > 0 && (
              <EvacNumber
                label="Estimated deficit"
                value={`${formatPop(evac.deficit)} people`}
                accent="red"
                full
              />
            )}
          </div>

          {/* Verdict */}
          <div className={`evac-verdict ${evac.canEvacuate ? 'safe' : 'danger'}`}>
            <span className="verdict-icon">{evac.canEvacuate ? '✓' : '✕'}</span>
            <div className="verdict-text">
              <span className="verdict-headline">
                {evac.canEvacuate
                  ? 'Full evacuation theoretically possible'
                  : 'Full evacuation NOT possible in time'}
              </span>
              <span className="verdict-sub">
                Assumes 75% road efficiency · 3.5 persons/vehicle
                (HCM 2016 · RITES 2008)
              </span>
            </div>
          </div>
        </>
      )}

      {/* Road breakdown */}
      <div className="evac-section-label" style={{ marginTop: 16 }}>EGRESS ROADS</div>
      <div className="road-stats">
        <RoadStat label="Exit segments"  value={p.n_egress_segments ?? '—'} />
        <RoadStat label="Bridges on exits" value={p.n_egress_bridges ?? '—'}
          warn={p.n_egress_bridges > 2}
        />
        <RoadStat label="Highest road class"
          value={roadClassLabel(p.max_egress_road_class)}
        />
        <RoadStat label="Single exit risk"
          value={p.single_exit_risk ? 'YES' : 'NO'}
          warn={p.single_exit_risk}
        />
      </div>

      <div className="evac-note">
        Road capacity from IRC SP:43-2015. Population from WorldPop 2020.
        Flood thresholds from SRTM 30m elevation via OpenTopography.
        Estimates are indicative — actual evacuation depends on warning
        lead time, compliance rates, and road conditions.
      </div>
    </div>
  )
}

function EvacNumber({ label, value, accent, full }) {
  return (
    <div className={`evac-num ${full ? 'full' : ''} accent-${accent}`}>
      <span className="evac-num-value">{value}</span>
      <span className="evac-num-label">{label}</span>
    </div>
  )
}

function RoadStat({ label, value, warn }) {
  return (
    <div className="road-stat-row">
      <span className="road-stat-label">{label}</span>
      <span className={`road-stat-value ${warn ? 'warn' : ''}`}>{value}</span>
    </div>
  )
}

function urgencyLabel(score) {
  if (score > 0.9) return 'CRITICAL'
  if (score > 0.7) return 'HIGH'
  if (score > 0.4) return 'MODERATE'
  return 'LOW'
}

function roadClassLabel(n) {
  const map = { 6: 'Motorway', 5: 'Trunk', 4: 'Primary', 3: 'Secondary', 2: 'Tertiary', 1: 'Local' }
  return map[n] || '—'
}