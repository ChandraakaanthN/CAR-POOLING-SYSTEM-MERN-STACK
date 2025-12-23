import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button
} from '@mui/material'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  geocodeAddress,
  getRoute,
  formatDistance,
  formatDuration
} from '../services/geoService'

const MapPicker = ({
  onFromLocationChange,
  onToLocationChange,
  onRouteChange,
  fromPlace = '',
  toPlace = ''
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [routeInfo, setRouteInfo] = useState(null)
  const [fromInput, setFromInput] = useState(fromPlace)
  const [toInput, setToInput] = useState(toPlace)
  const [mapLoaded, setMapLoaded] = useState(false)

  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const routeLayerRef = useRef(null)
  const isInitialized = useRef(false)

  /* -------------------- MAP INIT -------------------- */
  useEffect(() => {
    // Use a small timeout to ensure the container is rendered
    const timer = setTimeout(() => {
      if (!isInitialized.current && mapContainerRef.current) {
        initializeMap()
        isInitialized.current = true
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      clearRoute()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const initializeMap = async () => {
    try {
      setLoading(true)
      setError('')

      if (!mapContainerRef.current) return

      const mapInstance = L.map(mapContainerRef.current, {
        zoomControl: true
      }).setView([20.5937, 78.9629], 5)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance)

      mapRef.current = mapInstance
      setMapLoaded(true)

      // IMPORTANT: force Leaflet resize after mount
      setTimeout(() => {
        if (mapInstance) {
          mapInstance.invalidateSize()
        }
      }, 200)

      // Additional resize after a bit more time to ensure proper rendering
      setTimeout(() => {
        if (mapInstance) {
          mapInstance.invalidateSize()
        }
      }, 500)

      setLoading(false)
    } catch (err) {
      console.error('Map initialization error:', err)
      setError('Failed to load map. Please check your internet connection.')
      setLoading(false)
    }
  }

  /* -------------------- ROUTE HANDLING -------------------- */
  const clearRoute = () => {
    if (routeLayerRef.current && mapRef.current) {
      routeLayerRef.current.remove()
      routeLayerRef.current = null
    }
  }

  const updateRoute = async () => {
    if (!fromInput || !toInput) {
      setError('Please enter both From and To locations')
      return
    }

    try {
      setError('')
      clearRoute()

      const fromLocation = await geocodeAddress(fromInput)
      const toLocation = await geocodeAddress(toInput)

      onFromLocationChange(fromLocation)
      onToLocationChange(toLocation)

      const route = await getRoute(
        { lat: fromLocation.lat, lng: fromLocation.lng },
        { lat: toLocation.lat, lng: toLocation.lng }
      )

      const routeLatLngs = route.coordinates.map(p => [p.lat, p.lng])

      routeLayerRef.current = L.polyline(routeLatLngs, {
        color: 'blue',
        weight: 5
      })

      routeLayerRef.current.addTo(mapRef.current)

      mapRef.current.fitBounds(
        routeLayerRef.current.getBounds(),
        { padding: [20, 20] }
      )

      const routeData = {
        distance: formatDistance(route.distanceMeters),
        duration: formatDuration(route.durationSeconds),
        fromLocation,
        toLocation,
        routePoints: route.coordinates
      }

      setRouteInfo(routeData)
      onRouteChange(routeData)
    } catch (err) {
      console.error('Route calculation error:', err)
      setError(err.message || 'Failed to calculate route')
    }
  }

  /* -------------------- INPUT HANDLERS -------------------- */
  const handleFromChange = (e) => setFromInput(e.target.value)
  const handleToChange = (e) => setToInput(e.target.value)

  /* -------------------- UI -------------------- */
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Route Details
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="From"
          placeholder="Enter starting location"
          value={fromInput}
          onChange={handleFromChange}
          sx={{ mb: 1 }}
        />
        <TextField
          fullWidth
          label="To"
          placeholder="Enter destination"
          value={toInput}
          onChange={handleToChange}
          sx={{ mb: 1 }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
        >
          Enter locations and click “Calculate Route”
        </Typography>
      </Box>

      <Paper
        sx={{
          width: '100%',
          height: 300,
          mb: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '300px',
            backgroundColor: '#e0e0e0'
          }}
        />

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 1,
              p: 1,
              zIndex: 1000
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Paper>

      {routeInfo && (
        <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
          <Typography variant="body2">
            Distance: {routeInfo.distance} • Duration: {routeInfo.duration}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          💡 Use full location names
        </Typography>
        <Button variant="contained" onClick={updateRoute}>
          Calculate Route
        </Button>
      </Box>
    </Box>
  )
}

export default MapPicker
