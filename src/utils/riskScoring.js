// Analog matching and risk scoring
// These functions replicate the model's logic in JS for display purposes
// Actual ML predictions come from the FastAPI backend when available

// Saffir-Simpson equivalent categories for Bay of Bengal (IMD scale)
export const IMD_CATEGORIES = [
  { min: 0,  max: 32,  label: 'Low Pressure',        color: '#64748b', short: 'LP'  },
  { min: 33, max: 47,  label: 'Depression',            color: '#3b82f6', short: 'D'   },
  { min: 48, max: 63,  label: 'Deep Depression',       color: '#06b6d4', short: 'DD'  },
  { min: 64, max: 89,  label: 'Cyclonic Storm',        color: '#10b981', short: 'CS'  },
  { min: 90, max: 119, label: 'Severe Cyclonic Storm', color: '#f59e0b', short: 'SCS' },
  { min: 120, max: 164,label: 'Very Severe',           color: '#ef4444', short: 'VSCS'},
  { min: 165, max: 999,label: 'Super Cyclonic Storm',  color: '#a855f7', short: 'SuCS'},
]

export function getCategory(windKt) {
  return IMD_CATEGORIES.find(c => windKt >= c.min && windKt <= c.max) || IMD_CATEGORIES[0]
}

// Match a storm's conditions against historical IBTrACS records
// Returns probability of RI based on similar historical cases
export function computeAnalogRI(currentConditions, historicalStorms) {
  if (!historicalStorms || historicalStorms.length === 0) return null

  const { wind, sst, lat, month } = currentConditions

  // Find analog storms with similar conditions
  const analogs = historicalStorms.filter(obs => {
    const windMatch = Math.abs(obs.WMO_WIND - wind) <= 15
    const sstMatch  = !sst || !obs.SST || Math.abs(obs.SST - sst) <= 1.5
    const latMatch  = Math.abs(obs.LAT - lat) <= 3
    const monthMatch = Math.abs(obs.month - month) <= 1 ||
                       Math.abs(obs.month - month) >= 11  // wrap December-January
    return windMatch && sstMatch && latMatch && monthMatch
  })

  if (analogs.length < 5) return null

  const riRate = analogs.filter(a => a.RI === 1).length / analogs.length
  return {
    probability: riRate,
    sampleSize: analogs.length,
    method: 'analog',
  }
}

// Classical RI precondition check
// Returns which preconditions are met
export function checkRIPreconditions(conditions) {
  const { sst, windShear, pressureTendency } = conditions
  return {
    sst: {
      met: sst !== null && sst >= 28.5,
      value: sst,
      threshold: 28.5,
      label: 'SST',
      unit: '°C',
    },
    shear: {
      met: windShear !== null && windShear <= 10,
      value: windShear,
      threshold: 10,
      label: 'Wind shear',
      unit: 'm/s',
      invertGood: true, // lower is better
    },
    pressure: {
      met: pressureTendency !== null && pressureTendency <= -2,
      value: pressureTendency,
      threshold: -2,
      label: 'Pressure tendency',
      unit: 'hPa/6h',
      invertGood: true,
    },
  }
}

// Compute evacuation time pressure for a district
// Returns hours available vs hours needed
export function computeEvacPressure(district, surgeHeightM, hoursToLandfall) {
  if (!district) return null

  const {
    egress_capacity_veh_hr,
    population_2020,
    hours_to_full_evac,
    n_egress_segments,
    single_exit_risk,
  } = district

  const effectiveCapacity = (egress_capacity_veh_hr || 0) * 0.75 * 3.5
  const hoursNeeded = population_2020 / Math.max(effectiveCapacity, 1)
  const deficit = Math.max(0, population_2020 - effectiveCapacity * hoursToLandfall)
  const urgencyScore = Math.min(1, hoursNeeded / Math.max(hoursToLandfall, 1))

  return {
    hoursNeeded: Math.round(hoursNeeded),
    hoursAvailable: hoursToLandfall,
    deficit: Math.round(deficit),
    urgencyScore,
    singleExitRisk: single_exit_risk,
    nEgressRoads: n_egress_segments,
    canEvacuate: hoursNeeded <= hoursToLandfall,
  }
}

// Format large numbers for display
export function formatPop(n) {
  if (!n) return '—'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(Math.round(n))
}

export function formatWind(kt) {
  if (!kt) return '—'
  return `${Math.round(kt)} kt`
}

// Risk colour for a district based on historical exposure
export function districtRiskColor(nStorms, maxStorms) {
  if (!nStorms || !maxStorms) return [30, 40, 50, 180]
  const t = nStorms / maxStorms
  // Interpolate from deep ocean blue to hot amber
  const r = Math.round(8   + t * (245 - 8))
  const g = Math.round(30  + t * (158 - 30))
  const b = Math.round(80  + t * (11  - 80))
  return [r, g, b, 200]
}