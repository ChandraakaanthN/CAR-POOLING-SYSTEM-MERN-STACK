import React, { useState, useEffect, useRef } from 'react'
import { Box, TextField, Button, Typography, CircularProgress, Alert, Paper, Card, CardContent, Grid, Chip } from '@mui/material'
import { Search as SearchIcon, DirectionsCar as CarIcon } from '@mui/icons-material'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { geocodeAddress, getRoute, formatDistance, formatDuration } from '../services/geoService'
import { rideService } from '../services/rideService'
import dayjs from 'dayjs'

const RouteSearch = ({ onRideSelect }) => {
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [routeInfo, setRouteInfo] = useState(null)
  const [matchingRides, setMatchingRides] = useState([])
  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const routeLayerRef = useRef(null)
  const isInitialized = useRef(false)

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
      // Cleanup function
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
      const mapInstance = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance)
      mapRef.current = mapInstance
      setMapLoaded(true)

      // 🔥 IMPORTANT: force Leaflet resize after mount
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

  const clearRoute = () => {
    if (routeLayerRef.current && mapRef.current) {
      routeLayerRef.current.remove()
      routeLayerRef.current = null
    }
  }

  const searchRides = async () => {
    if (!fromInput || !toInput) {
      setError('Please enter both origin and destination')
      return
    }

    try {
      setSearching(true)
      setError('')

      const fromResult = await geocodeAddress(fromInput)
      const toResult = await geocodeAddress(toInput)

      // Search for rides along this route
      const rides = await rideService.searchRides(
        fromResult.lng,
        fromResult.lat,
        toResult.lng,
        toResult.lat
      )

      setMatchingRides(rides)

      clearRoute()
      const route = await getRoute(
        { lat: fromResult.lat, lng: fromResult.lng },
        { lat: toResult.lat, lng: toResult.lng }
      )
      const latlngs = route.coordinates.map(p => [p.lat, p.lng])
      routeLayerRef.current = L.polyline(latlngs, { color: 'blue', weight: 5 })
      if (!mapRef.current) return
      routeLayerRef.current.addTo(mapRef.current)
      mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [20, 20] })
      setRouteInfo({
        distance: formatDistance(route.distanceMeters),
        duration: formatDuration(route.durationSeconds)
      })

    } catch (err) {
      setError(err.message || 'Failed to search rides')
    } finally {
      setSearching(false)
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Search Rides by Route
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
          placeholder="Enter starting location (e.g., Vijayawada, Andhra Pradesh)"
          value={fromInput}
          onChange={(e) => setFromInput(e.target.value)}
          sx={{ mb: 1 }}
        />
        <TextField
          fullWidth
          label="To"
          placeholder="Enter destination (e.g., Mangalagiri, Andhra Pradesh)"
          value={toInput}
          onChange={(e) => setToInput(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={searchRides}
          disabled={searching || loading}
          fullWidth
        >
          {searching ? 'Searching...' : 'Search Rides'}
        </Button>
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
            position: 'relative',
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
              zIndex: 1000,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 1,
              p: 1
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Paper>

      {routeInfo && (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Route: {routeInfo.distance} • {routeInfo.duration}
          </Typography>
        </Box>
      )}

      {matchingRides.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Matching Rides ({matchingRides.length})
          </Typography>
          <Grid container spacing={2}>
            {matchingRides.map((ride) => (
              <Grid item xs={12} md={6} key={ride._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {ride.vehicleName}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      From: {ride.fromPlace}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      To: {ride.toPlace}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Date: {dayjs(ride.date).format('MMM DD, YYYY')}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Cost: ₹{ride.cost}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={`${ride.vehicleType}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`${ride.noOfVacancies} seats`}
                        size="small"
                        color={ride.noOfVacancies > 0 ? 'success' : 'error'}
                      />
                    </Box>
                    {onRideSelect && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onRideSelect(ride)}
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        View Details
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {matchingRides.length === 0 && routeInfo && !searching && (
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No rides found along this route
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default RouteSearch 