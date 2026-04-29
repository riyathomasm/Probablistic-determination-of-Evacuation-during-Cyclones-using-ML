import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import './SeasonalChart.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Historical Bay of Bengal storm frequency by month (from IBTrACS climatology)
// These are climatological rates — not district-specific, but seasonality pattern
// Source: IMD cyclone climatology reports
const BOB_CLIMATOLOGY = [0.3, 0.1, 0.1, 0.2, 0.8, 0.4, 0.3, 0.5, 1.2, 2.8, 3.1, 1.4]

export default function SeasonalChart({ district }) {
  const svgRef = useRef(null)
  const p = district.properties

  useEffect(() => {
    if (!svgRef.current) return

    const el     = svgRef.current
    const W      = el.clientWidth || 340
    const H      = 160
    const margin = { top: 16, right: 12, bottom: 32, left: 28 }
    const w      = W - margin.left - margin.right
    const h      = H - margin.top  - margin.bottom

    d3.select(el).selectAll('*').remove()

    const svg = d3.select(el)
      .attr('width', W)
      .attr('height', H)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand()
      .domain(d3.range(12))
      .range([0, w])
      .padding(0.25)

    const yMax = d3.max(BOB_CLIMATOLOGY) * 1.2
    const y = d3.scaleLinear()
      .domain([0, yMax])
      .range([h, 0])

    // Current month (0-indexed)
    const now = new Date().getMonth()

    // Highlight next 4 months
    const upcomingMonths = new Set(
      [0, 1, 2, 3].map(i => (now + i) % 12)
    )

    // Bars
    g.selectAll('.bar')
      .data(BOB_CLIMATOLOGY)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (_, i) => x(i))
      .attr('y', d => y(d))
      .attr('width', x.bandwidth())
      .attr('height', d => h - y(d))
      .attr('fill', (_, i) => {
        if (i === now)             return '#00d4ff'
        if (upcomingMonths.has(i)) return 'rgba(245,158,11,0.7)'
        return 'rgba(255,255,255,0.08)'
      })
      .attr('rx', 1)

    // X axis labels
    g.selectAll('.x-label')
      .data(MONTHS)
      .join('text')
      .attr('class', 'x-label')
      .attr('x', (_, i) => x(i) + x.bandwidth() / 2)
      .attr('y', h + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', (_, i) => {
        if (i === now)             return '#00d4ff'
        if (upcomingMonths.has(i)) return '#f59e0b'
        return '#4a5a68'
      })
      .attr('font-size', 9)
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(d => d)

    // Y axis
    g.append('g')
      .call(
        d3.axisLeft(y)
          .ticks(3)
          .tickSize(-w)
          .tickFormat(d => d.toFixed(1))
      )
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('line')
        .attr('stroke', 'rgba(255,255,255,0.05)')
        .attr('stroke-dasharray', '2,2')
      )
      .call(ax => ax.selectAll('text')
        .attr('fill', '#4a5a68')
        .attr('font-size', 8)
        .attr('font-family', 'JetBrains Mono, monospace')
      )

  }, [district])

  // Historical storms this district has seen per month
  // We use the district's n_storms_historical as context
  const p_props = district.properties
  const nStorms = p_props.n_storms_historical || 0

  // Peak months for this district based on climatology
  const peakMonth = BOB_CLIMATOLOGY.indexOf(Math.max(...BOB_CLIMATOLOGY))

  return (
    <div className="seasonal-tab">
      <div className="seasonal-header">
        <span className="seasonal-title">STORM FREQUENCY CLIMATOLOGY</span>
        <span className="seasonal-sub">Bay of Bengal basin · IMD historical record</span>
      </div>

      <svg ref={svgRef} className="seasonal-svg" />

      <div className="seasonal-legend">
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: '#00d4ff' }} />
          <span>Current month</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: 'rgba(245,158,11,0.7)' }} />
          <span>Next 4 months</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span>Historical rate</span>
        </div>
      </div>

      <div className="seasonal-insights">
        <div className="insight-row">
          <span className="insight-label">Historical storms near this district</span>
          <span className="insight-value">{nStorms}</span>
        </div>
        <div className="insight-row">
          <span className="insight-label">Basin peak month</span>
          <span className="insight-value">{MONTHS[peakMonth]}</span>
        </div>
        <div className="insight-row">
          <span className="insight-label">RI events recorded nearby</span>
          <span className="insight-value">{p_props.n_ri_events_nearby ?? '—'}</span>
        </div>
      </div>

      <div className="seasonal-note">
        Climatology based on IMD best-track data. District-level exposure from
        IBTrACS v04r00 — storms within 200km of district centroid.
      </div>
    </div>
  )
}