import './StatusBar.css'

export default function StatusBar({ districtCount, activeStorm, selectedDistrict }) {
  const name = selectedDistrict?.properties?.district_name ||
               selectedDistrict?.properties?.NAME_2

  return (
    <div className="status-bar">
      <div className="status-left">
        <StatusItem
          label="DISTRICTS"
          value={districtCount ?? '—'}
        />
        <StatusDivider />
        <StatusItem
          label="BASIN"
          value="North Indian · Bay of Bengal"
        />
        <StatusDivider />
        <StatusItem
          label="MODEL"
          value="XGBoost RI Classifier · IBTrACS NI"
        />
      </div>

      <div className="status-center">
        {selectedDistrict && (
          <span className="status-selected">
            <span className="status-selected-dot" />
            {name?.toUpperCase()} SELECTED
          </span>
        )}
      </div>

      <div className="status-right">
        <StatusItem
          label="STORM STATUS"
          value={activeStorm ? `ACTIVE · ${activeStorm.name}` : 'CLEAR'}
          accent={activeStorm ? 'red' : 'green'}
        />
        <StatusDivider />
        <StatusItem
          label="DATA"
          value="GADM 4.1 · WorldPop 2020 · OSM"
        />
      </div>
    </div>
  )
}

function StatusItem({ label, value, accent }) {
  return (
    <div className="status-item">
      <span className="status-label">{label}</span>
      <span className={`status-value ${accent ? `accent-${accent}` : ''}`}>
        {value}
      </span>
    </div>
  )
}

function StatusDivider() {
  return <span className="status-divider" />
}