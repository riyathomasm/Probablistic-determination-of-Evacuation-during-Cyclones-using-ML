// Utility to load and parse project data files
// Parquet files are read via fetch and parsed with a lightweight approach
// GeoJSON loaded directly

export async function loadGeoJSON(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.json()
}

export async function loadJSON(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.json()
}

// For parquet files we use the Apache Arrow JS library loaded via CDN
// Loaded lazily on first use
let arrowLoaded = false
async function ensureArrow() {
  if (arrowLoaded) return
  await import('https://cdn.jsdelivr.net/npm/apache-arrow@14/Arrow.es2015.min.js')
  arrowLoaded = true
}

export async function loadParquet(path) {
  // Fallback: try loading as JSON if parquet parsing fails
  // For production, convert parquet to JSON during build
  try {
    const res = await fetch(path)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = await res.arrayBuffer()

    // Try using parquet-wasm if available
    const { readParquet } = await import('https://cdn.jsdelivr.net/npm/parquet-wasm@0.6.0/esm/arrow1.js')
    const arrowTable = readParquet(new Uint8Array(buffer))
    return arrowToRows(arrowTable)
  } catch (e) {
    console.warn(`Parquet load failed for ${path}, trying JSON fallback:`, e.message)
    // Try JSON fallback (pre-converted files)
    const jsonPath = path.replace('.parquet', '.json')
    const res = await fetch(jsonPath)
    if (!res.ok) throw new Error(`No JSON fallback for ${path}`)
    return res.json()
  }
}

function arrowToRows(table) {
  const rows = []
  const schema = table.schema.fields.map(f => f.name)
  for (let i = 0; i < table.numRows; i++) {
    const row = {}
    schema.forEach(col => {
      row[col] = table.getColumn(col).get(i)
    })
    rows.push(row)
  }
  return rows
}

// IBTrACS historical storms for this region
// Pre-filtered subset served as JSON for performance
export async function loadHistoricalStorms() {
  try {
    return await loadJSON('/data/historical_storms.json')
  } catch {
    return []
  }
}

// NHC/IMD active storm feed (real-time)
// Returns null if no active storm
export async function fetchActiveStorm() {
  try {
    // IMD RSS feed proxy — in production wire to a backend
    // For now returns null (historical mode only)
    return null
  } catch {
    return null
  }
}