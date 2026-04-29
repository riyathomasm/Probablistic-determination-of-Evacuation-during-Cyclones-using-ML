import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Deck } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import { districtRiskColor } from '../utils/riskScoring'
import './MapView.css'

const DARK_STYLE = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json'

const INITIAL_VIEW = {
  longitude: 79.5,
  latitude:  11.0,
  zoom:      6.8,
  pitch:     35,
  bearing:   -8,
}

export default function MapView({
  districts,
  selectedDistrict,
  activeStorm,
  onDistrictClick,
}) {
  const mapContainerRef = useRef(null)
  const mapRef          = useRef(null)
  const deckRef         = useRef(null)
  const [hovered, setHovered] = useState(null)

  const maxStorms = districts
    ? Math.max(...districts.features.map(f => f.properties.n_storms_historical || 0))
    : 1

  // Initialise MapLibre — sits behind, pointer events off
  useEffect(() => {
    if (!mapContainerRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DARK_STYLE,
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      interactive: false,
      attributionControl: false,
    })

    mapRef.current = map
    return () => map.remove()
  }, [])

  // Initialise Deck.gl — sits on top, pointer events on
  useEffect(() => {
    if (!mapContainerRef.current) return

    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.inset = '0'
    canvas.style.pointerEvents = 'auto'
    mapContainerRef.current.parentElement.appendChild(canvas)

    const deck = new Deck({
      canvas,
      width: '100%',
      height: '100%',
      initialViewState: INITIAL_VIEW,
      controller: true,
      onViewStateChange: ({ viewState: vs }) => {
        if (mapRef.current) {
          mapRef.current.jumpTo({
            center: [vs.longitude, vs.latitude],
            zoom: vs.zoom,
            bearing: vs.bearing,
            pitch: vs.pitch,
          })
        }
      },
      layers: [],
      style: { background: 'transparent' },
    })

    deckRef.current = deck
    return () => {
      deck.finalize()
      canvas.remove()
    }
  }, [])

  // Update layers when data changes
  useEffect(() => {
    if (!deckRef.current || !districts) return

    const selectedId = selectedDistrict?.properties?.GID_2 ||
                       selectedDistrict?.properties?.district_name

    const districtLayer = new GeoJsonLayer({
      id: 'districts',
      data: districts,
      pickable: true,
      stroked: true,
      filled: true,
      extruded: false,

      getFillColor: (f) => {
        const id = f.properties.GID_2 || f.properties.district_name
        if (id === selectedId) return [0, 212, 255, 80]
        if (id === hovered)    return [0, 212, 255, 40]
        return districtRiskColor(f.properties.n_storms_historical || 0, maxStorms)
      },

      getLineColor: (f) => {
        const id = f.properties.GID_2 || f.properties.district_name
        return id === selectedId ? [0, 212, 255, 255] : [0, 212, 255, 60]
      },

      getLineWidth: (f) => {
        const id = f.properties.GID_2 || f.properties.district_name
        return id === selectedId ? 2 : 0.5
      },

      lineWidthUnits: 'pixels',
      updateTriggers: {
        getFillColor: [selectedId, hovered],
        getLineColor: [selectedId],
        getLineWidth: [selectedId],
      },

      onHover: ({ object }) => {
        const id = object?.properties?.GID_2 || object?.properties?.district_name
        setHovered(id || null)
        document.body.style.cursor = object ? 'pointer' : 'default'
      },

      onClick: ({ object }) => {
        if (object) onDistrictClick(object)
      },
    })

    deckRef.current.setProps({ layers: [districtLayer] })
  }, [districts, selectedDistrict, hovered, maxStorms, onDistrictClick])

  const hoveredFeature = hovered && districts
    ? districts.features.find(
        f => (f.properties.GID_2 || f.properties.district_name) === hovered
      )
    : null

  return (
    <div className="map-wrapper">
      <div
        ref={mapContainerRef}
        className="map-container"
        style={{ pointerEvents: 'none' }}
      />

      {hoveredFeature && <HoverTooltip feature={hoveredFeature} />}
      <MapLegend maxStorms={maxStorms} />
      <ViewControls deckRef={deckRef} />
    </div>
  )
}

function HoverTooltip({ feature }) {
  const p = feature.properties
  const name = p.district_name || p.NAME_2 || 'Unknown'
  const pop  = p.population_2020
    ? `${(p.population_2020 / 1e6).toFixed(1)}M`
    : '—'

  return (
    <div className="map-tooltip">
      <span className="tooltip-name">{name.toUpperCase()}</span>
      <div className="tooltip-row">
        <span>Historical storms</span>
        <span>{p.n_storms_historical ?? '—'}</span>
      </div>
      <div className="tooltip-row">
        <span>Max wind on record</span>
        <span>{p.max_wind_historical_kt ? `${Math.round(p.max_wind_historical_kt)} kt` : '—'}</span>
      </div>
      <div className="tooltip-row">
        <span>Population</span>
        <span>{pop}</span>
      </div>
      <span className="tooltip-hint">Click for full analysis</span>
    </div>
  )
}

function MapLegend({ maxStorms }) {
  return (
    <div className="map-legend">
      <span className="legend-label">HISTORICAL EXPOSURE</span>
      <div className="legend-bar">
        <div className="legend-gradient" />
        <div className="legend-ticks">
          <span>0</span>
          <span>{Math.round(maxStorms / 2)}</span>
          <span>{maxStorms}</span>
        </div>
      </div>
      <span className="legend-unit">storms within 200km</span>
    </div>
  )
}

function ViewControls({ deckRef }) {
  const reset = () => {
    if (deckRef.current) {
      deckRef.current.setProps({
        initialViewState: { ...INITIAL_VIEW, transitionDuration: 800 },
      })
    }
  }

  return (
    <div className="view-controls">
      <button className="view-btn" onClick={reset} title="Reset view">
        ⊕
      </button>
    </div>
  )
}