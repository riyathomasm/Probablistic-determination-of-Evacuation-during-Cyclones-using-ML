import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView'
import Header from './components/Header'
import DistrictPanel from './components/DistrictPanel'
import StatusBar from './components/StatusBar'
import { loadGeoJSON, loadJSON, fetchActiveStorm } from './utils/dataLoader'
import './App.css'

export default function App() {
  const [districts, setDistricts]         = useState(null)
  const [selectedDistrict, setSelected]   = useState(null)
  const [activeStorm, setActiveStorm]     = useState(null)
  const [featureImportance, setFeatImp]   = useState(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [panelOpen, setPanelOpen]         = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const [geo, fi, storm] = await Promise.all([
          loadGeoJSON('/data/district_risk_features.geojson'),
          loadJSON('/data/feature_importance.json').catch(() => null),
          fetchActiveStorm(),
        ])
        setDistricts(geo)
        setFeatImp(fi)
        setActiveStorm(storm)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleDistrictClick = useCallback((feature) => {
    setSelected(feature)
    setPanelOpen(true)
  }, [])

  const handlePanelClose = useCallback(() => {
    setPanelOpen(false)
    setTimeout(() => setSelected(null), 300)
  }, [])

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorScreen message={error} />

  return (
    <div className="app">
      <Header activeStorm={activeStorm} />

      <div className="app-body">
        <MapView
          districts={districts}
          selectedDistrict={selectedDistrict}
          activeStorm={activeStorm}
          onDistrictClick={handleDistrictClick}
        />

        <DistrictPanel
          district={selectedDistrict}
          activeStorm={activeStorm}
          featureImportance={featureImportance}
          open={panelOpen}
          onClose={handlePanelClose}
        />
      </div>

      <StatusBar
        districtCount={districts?.features?.length}
        activeStorm={activeStorm}
        selectedDistrict={selectedDistrict}
      />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-inner">
        <div className="loading-ring" />
        <span className="loading-label">INITIALISING CYCLONE INTELLIGENCE</span>
        <span className="loading-sub">Loading district data and model outputs</span>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div className="error-screen">
      <div className="error-inner">
        <span className="error-code">DATA LOAD ERROR</span>
        <p>{message}</p>
        <p className="error-hint">
          Ensure district_risk_features.geojson and feature_importance.json
          are present in public/data/
        </p>
      </div>
    </div>
  )
}