import { useEffect, useState } from 'react'
import SeasonalChart from './SeasonalChart'
import EvacPanel from './EvacPanel'
import RIPanel from './RIPanel'
import { formatPop, getCategory } from '../utils/riskScoring'
import './DistrictPanel.css'

export default function DistrictPanel({
  district,
  activeStorm,
  featureImportance,
  open,
  onClose,
}) {
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (open) setTab('overview')
  }, [district, open])

  if (!district) return null

  const p = district.properties
  const name = p.district_name || p.NAME_2 || 'Unknown'

  return (
    <div className={`district-panel ${open ? 'open' : ''}`}>
      {/* Panel header */}
      <div className="panel-header">
        <div className="panel-title-block">
          <span className="panel-district-label">DISTRICT ANALYSIS</span>
          <h2 className="panel-district-name">{name.toUpperCase()}</h2>
          <span className="panel-district-state">Tamil Nadu, India</span>
        </div>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      {/* Quick stats row */}
      <div className="panel-stats-row">
        <StatCard
          label="Historical storms"
          value={p.n_storms_historical ?? '—'}
          unit="within 200km"
          accent={p.n_storms_historical > 5 ? 'amber' : 'dim'}
        />
        <StatCard
          label="Max wind on record"
          value={p.max_wind_historical_kt ? `${Math.round(p.max_wind_historical_kt)}` : '—'}
          unit="knots"
          accent={p.max_wind_historical_kt > 90 ? 'red' : 'dim'}
        />
        <StatCard
          label="Population"
          value={formatPop(p.population_2020)}
          unit="2020 est."
          accent="dim"
        />
        <StatCard
          label="Egress roads"
          value={p.n_egress_segments ?? '—'}
          unit="exit segments"
          accent={p.single_exit_risk ? 'red' : 'green'}
        />
      </div>

      {/* Single exit warning */}
      {p.single_exit_risk === 1 && (
        <div className="panel-warning">
          <span className="warning-icon">⚠</span>
          <span>Single exit risk — this district has very limited evacuation routes</span>
        </div>
      )}

      {/* Tabs */}
      <div className="panel-tabs">
        {['overview', 'seasonal', 'evacuation', activeStorm ? 'live' : null]
          .filter(Boolean)
          .map(t => (
            <button
              key={t}
              className={`panel-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
      </div>

      {/* Tab content */}
      <div className="panel-content">
        {tab === 'overview'   && <OverviewTab district={district} />}
        {tab === 'seasonal'   && <SeasonalChart district={district} />}
        {tab === 'evacuation' && <EvacPanel district={district} />}
        {tab === 'live'       && (
          <RIPanel
            district={district}
            storm={activeStorm}
            featureImportance={featureImportance}
          />
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-unit">{unit}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function OverviewTab({ district }) {
  const p = district.properties

  const rows = [
    { label: 'Total road length',      value: p.total_road_length_km ? `${Math.round(p.total_road_length_km)} km` : '—' },
    { label: 'Egress capacity',        value: p.egress_capacity_veh_hr ? `${Math.round(p.egress_capacity_veh_hr).toLocaleString()} veh/hr` : '—' },
    { label: 'Evacuation time est.',   value: p.hours_to_full_evac ? `${Math.round(p.hours_to_full_evac)} hours` : '—' },
    { label: 'RI events nearby',       value: p.n_ri_events_nearby ?? '—' },
    { label: 'Pop density',            value: p.pop_density_per_km2 ? `${Math.round(p.pop_density_per_km2)} /km²` : '—' },
    { label: 'Highest egress class',   value: p.max_egress_road_class ? roadClassLabel(p.max_egress_road_class) : '—' },
    { label: 'Bridge count on egress', value: p.n_egress_bridges ?? '—' },
  ]

  return (
    <div className="overview-tab">
      <div className="overview-section-label">DISTRICT PROFILE</div>
      <div className="overview-table">
        {rows.map(r => (
          <div key={r.label} className="overview-row">
            <span className="overview-key">{r.label}</span>
            <span className="overview-val">{r.value}</span>
          </div>
        ))}
      </div>

      <div className="overview-section-label" style={{ marginTop: 20 }}>DATA SOURCES</div>
      <div className="source-list">
        <SourceTag label="IBTrACS v04r00" url="https://www.ncei.noaa.gov/products/international-best-track-archive" />
        <SourceTag label="WorldPop 2020"  url="https://www.worldpop.org" />
        <SourceTag label="OSM roads"      url="https://www.openstreetmap.org" />
        <SourceTag label="SRTM 30m"       url="https://portal.opentopography.org" />
        <SourceTag label="NOAA OISST v2.1" url="https://coastwatch.pfeg.noaa.gov/erddap" />
      </div>
    </div>
  )
}

function SourceTag({ label, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-tag"
    >
      {label} ↗
    </a>
  )
}

function roadClassLabel(n) {
  const map = { 6: 'Motorway', 5: 'Trunk', 4: 'Primary', 3: 'Secondary', 2: 'Tertiary', 1: 'Local' }
  return map[n] || '—'
}