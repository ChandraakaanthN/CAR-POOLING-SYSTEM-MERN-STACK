import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField as MuiTextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  Map as MapIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { rideService } from '../services/rideService'
import RouteSearch from '../components/RouteSearch'
import dayjs from 'dayjs'

const Rides = () => {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchMode, setSearchMode] = useState('regular') // 'regular' or 'route'
  const [searchTerm, setSearchTerm] = useState('')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('')
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [selectedRide, setSelectedRide] = useState(null)
  const [seatsRequested, setSeatsRequested] = useState(1)
  const [requestLoading, setRequestLoading] = useState(false)
  const navigate = useNavigate()

  // OpenStreetMap stack used; no API key needed

  useEffect(() => {
    fetchRides()
  }, [])

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 3000)
    return () => clearTimeout(t)
  }, [error])

  const fetchRides = async () => {
    try {
      setLoading(true)
      const data = await rideService.getAllRides()
      setRides(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRide = (ride) => {
    setSelectedRide(ride)
    setSeatsRequested(1)
    setShowRequestDialog(true)
  }

  const handleSubmitRequest = async () => {
    if (!selectedRide) return

    try {
      setRequestLoading(true)
      await rideService.requestRide(selectedRide._id, seatsRequested)
      setShowRequestDialog(false)
      setSelectedRide(null)
      // Refresh rides to update vacancy count
      fetchRides()
    } catch (err) {
      setError(err.message)
    } finally {
      setRequestLoading(false)
    }
  }

  const handleRideSelect = (ride) => {
    navigate(`/ride/${ride._id}`)
  }

  const today = dayjs().startOf('day')

  const filteredRides = rides
    .filter(ride => !dayjs(ride.date).isBefore(today, 'day'))
    .filter(ride => {
      const matchesSearch = 
        ride.fromPlace.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.toPlace.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesVehicleType = !vehicleTypeFilter || ride.vehicleType === vehicleTypeFilter
      
      return matchesSearch && matchesVehicleType
    })

  const vehicleTypes = [...new Set(rides.map(ride => ride.vehicleType))]

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Available Rides
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/create-ride')}
          >
            Create Ride
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search Mode Toggle */}
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={searchMode}
            exclusive
            onChange={(e, newMode) => newMode && setSearchMode(newMode)}
            aria-label="search mode"
          >
            <ToggleButton value="regular" aria-label="regular search">
              <SearchIcon sx={{ mr: 1 }} />
              Regular Search
            </ToggleButton>
            <ToggleButton value="route" aria-label="route search">
              <MapIcon sx={{ mr: 1 }} />
              Route Search
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {searchMode === 'regular' ? (
          <>
            {/* Regular Search Filters */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Search rides..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by location or vehicle..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={vehicleTypeFilter}
                      label="Vehicle Type"
                      onChange={(e) => setVehicleTypeFilter(e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      {vehicleTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Rides Grid */}
            {filteredRides.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No rides found matching your criteria
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredRides.map((ride) => (
                  <Grid item xs={12} md={6} lg={4} key={ride._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="h6" component="h3">
                            {ride.vehicleName}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationIcon sx={{ mr: 1, fontSize: 'small' }} />
                            <Typography variant="body2">
                              <strong>From:</strong> {ride.fromPlace}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationIcon sx={{ mr: 1, fontSize: 'small' }} />
                            <Typography variant="body2">
                              <strong>To:</strong> {ride.toPlace}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ScheduleIcon sx={{ mr: 1, fontSize: 'small' }} />
                            <Typography variant="body2">
                              <strong>Date:</strong> {dayjs(ride.date).format('MMM DD, YYYY')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ScheduleIcon sx={{ mr: 1, fontSize: 'small' }} />
                            <Typography variant="body2">
                              <strong>Time:</strong> {ride.starttime}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PersonIcon sx={{ mr: 1, fontSize: 'small' }} />
                            <Typography variant="body2">
                              <strong>Driver:</strong> {ride.owner.firstName} {ride.owner.lastName}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <MoneyIcon sx={{ mr: 1, fontSize: 'small' }} />
                            <Typography variant="body2">
                              <strong>Cost:</strong> ₹{ride.cost}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Chip
                            label={`${ride.vehicleType}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`${ride.noOfVacancies} seats available`}
                            size="small"
                            color={ride.noOfVacancies > 0 ? 'success' : 'error'}
                          />
                        </Box>

                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleRequestRide(ride)}
                          disabled={ride.noOfVacancies <= 0}
                        >
                          {ride.noOfVacancies > 0 ? 'Request Ride' : 'No Seats Available'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        ) : (
          /* Route Search */
          <RouteSearch onRideSelect={handleRideSelect} />
        )}
      </Box>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onClose={() => setShowRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Ride</DialogTitle>
        <DialogContent>
          {selectedRide && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Request a seat for the ride from <strong>{selectedRide.fromPlace}</strong> to <strong>{selectedRide.toPlace}</strong>
              </Typography>
              <MuiTextField
                fullWidth
                label="Number of Seats"
                type="number"
                value={seatsRequested}
                onChange={(e) => {
                  const raw = parseInt(e.target.value)
                  const min = 1
                  const max = selectedRide.noOfVacancies
                  if (isNaN(raw)) { setSeatsRequested(1); return }
                  setSeatsRequested(Math.max(min, Math.min(max, raw)))
                }}
                inputProps={{ min: 1, max: selectedRide.noOfVacancies }}
                sx={{ mb: 2 }}
                helperText={`Available seats: ${selectedRide.noOfVacancies}`}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRequestDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitRequest}
            variant="contained"
            disabled={requestLoading || !selectedRide}
          >
            {requestLoading ? 'Sending Request...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Rides 