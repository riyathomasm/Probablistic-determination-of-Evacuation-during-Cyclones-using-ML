import './RIPanel.css'

// This panel shows when an active storm exists
// In historical mode it shows what the model would have predicted
// Live predictions come from FastAPI backend when deployed

export default function RIPanel({ district, storm, featureImportance }) {
  const p = district.properties

  // Parse feature importance from saved SHAP values
  const features = featureImportance
    ? Object.entries(featureImportance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    : []

  const maxImp = features.length ? features[0][1] : 1

  const featureLabels = {
    WMO_WIND:            'Current wind speed',
    WMO_PRES:            'Central pressure',
    pressure_tendency_hpa: 'Pressure tendency',
    wind_tendency_kt:    'Wind tendency',
    wind_acceleration:   'Wind acceleration',
    SST:                 'Sea surface temp',
    SST_anomaly:         'SST anomaly',
    wind_shear_ms:       'Wind shear',
    storm_age_hrs:       'Storm age',
    translation_speed_kmh: 'Translation speed',
    LAT:                 'Latitude',
    LON:                 'Longitude',
    month_sin:           'Seasonal (sin)',
    month_cos:           'Seasonal (cos)',
    month_ri_climatology:'RI climatology',
  }

  return (
    <div className="ri-tab">

      {/* Live storm info */}
      {storm ? (
        <div className="storm-info-box">
          <div className="storm-info-row">
            <span>Storm</span>
            <span>{storm.name}</span>
          </div>
          <div className="storm-info-row">
            <span>Current wind</span>
            <span>{storm.wind_kt ? `${storm.wind_kt} kt` : '—'}</span>
          </div>
          <div className="storm-info-row">
            <span>Distance to district</span>
            <span>{storm.distance_km ? `${Math.round(storm.distance_km)} km` : '—'}</span>
          </div>
        </div>
      ) : (
        <div className="no-storm-note">
          No active storm. Connect to FastAPI backend for live RI scoring.
          Historical model performance shown below.
        </div>
      )}

      {/* RI probability display */}
      <div className="ri-section-label">MODEL OUTPUT</div>
      <div className="ri-prob-display">
        <div className="ri-prob-number">
          {storm?.ri_probability != null
            ? `${Math.round(storm.ri_probability * 100)}%`
            : '—'}
        </div>
        <div className="ri-prob-label">
          Rapid Intensification probability
          <span className="ri-prob-sub">≥30kt increase in 24h (IMD/NHC definition)</span>
        </div>
      </div>

      {/* Preconditions */}
      <div className="ri-section-label">CLASSICAL PRECONDITIONS</div>
      <div className="preconditions">
        <Precondition
          label="SST"
          threshold="≥28.5°C"
          value={storm?.sst ? `${storm.sst.toFixed(1)}°C` : '—'}
          met={storm?.sst >= 28.5}
          source="Emanuel 1986"
        />
        <Precondition
          label="Wind shear"
          threshold="≤10 m/s"
          value={storm?.shear ? `${storm.shear.toFixed(1)} m/s` : '—'}
          met={storm?.shear <= 10}
          source="DeMaria & Kaplan 1994"
        />
        <Precondition
          label="Pressure tendency"
          threshold="≤-2 hPa/6h"
          value={storm?.pressure_tendency ? `${storm.pressure_tendency.toFixed(1)} hPa/6h` : '—'}
          met={storm?.pressure_tendency <= -2}
          source="Kaplan & DeMaria 2003"
        />
      </div>

      {/* SHAP feature importance */}
      {features.length > 0 && (
        <>
          <div className="ri-section-label" style={{ marginTop: 16 }}>
            MODEL FEATURE IMPORTANCE (SHAP)
          </div>
          <div className="shap-bars">
            {features.map(([feat, imp]) => (
              <div key={feat} className="shap-row">
                <span className="shap-label">
                  {featureLabels[feat] || feat}
                </span>
                <div className="shap-bar-track">
                  <div
                    className="shap-bar-fill"
                    style={{ width: `${(imp / maxImp) * 100}%` }}
                  />
                </div>
                <span className="shap-value">{imp.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <div className="shap-note">
            Mean |SHAP| values from XGBoost model trained on IBTrACS NI basin
            1981–2021. Higher = more influence on RI prediction.
          </div>
        </>
      )}

      {/* Backend connection status */}
      <div className="ri-section-label" style={{ marginTop: 16 }}>BACKEND STATUS</div>
      <div className="backend-status">
        <div className="backend-row">
          <span className="backend-dot offline" />
          <span>FastAPI prediction server</span>
          <span className="backend-state">NOT CONNECTED</span>
        </div>
        <div className="backend-note">
          Start the Python backend to enable live RI scoring:
          <code>uvicorn api.main:app --reload</code>
        </div>
      </div>
    </div>
  )
}

function Precondition({ label, threshold, value, met, source }) {
  return (
    <div className="precondition-row">
      <div className="precondition-left">
        <span className={`precondition-dot ${met === true ? 'met' : met === false ? 'unmet' : 'unknown'}`} />
        <div className="precondition-text">
          <span className="precondition-label">{label}</span>
          <span className="precondition-threshold">{threshold}</span>
        </div>
      </div>
      <div className="precondition-right">
        <span className="precondition-value">{value}</span>
        <span className="precondition-source">{source}</span>
      </div>
    </div>
  )
}