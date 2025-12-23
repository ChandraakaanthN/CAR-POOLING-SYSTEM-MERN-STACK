import React, { useState } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
} from '@mui/material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { AttachMoney as MoneyIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { rideService } from '../services/rideService'
import MapPicker from '../components/MapPicker'
import dayjs from 'dayjs'

const CreateRide = () => {
  const [formData, setFormData] = useState({
    fromPlace: '',
    toPlace: '',
    vehicleType: '',
    vehicleName: '',
    vehicleNumber: '',
    noOfVacancies: '',
    cost: '',
    date: dayjs(),
    starttime: dayjs().format('HH:mm'),
  })
  const [locationData, setLocationData] = useState({
    fromLocation: null,
    toLocation: null,
    routePoints: null
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate() 


  
  const vehicleTypes = [
    'Sedan',
    'SUV',
    'Hatchback',
    'Wagon',
    'Van',
    'Truck',
    'Motorcycle',
    'Other'
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date: date
    }))
  }

  const handleTimeChange = (time) => {
    setFormData(prev => ({
      ...prev,
      starttime: time.format('HH:mm')
    }))
  }

  const handleFromLocationChange = (location) => {
    setLocationData(prev => ({
      ...prev,
      fromLocation: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      }
    }))
    setFormData(prev => ({
      ...prev,
      fromPlace: location.place
    }))
  }

  const handleToLocationChange = (location) => {
    setLocationData(prev => ({
      ...prev,
      toLocation: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      }
    }))
    setFormData(prev => ({
      ...prev,
      toPlace: location.place
    }))
  }

  const handleRouteChange = (routeData) => {
    setLocationData(prev => ({
      ...prev,
      routePoints: {
        type: 'MultiPoint',
        coordinates: routeData.routePoints.map(point => [point.lng, point.lat])
      }
    }))
  }

  const validateForm = () => {
    if (!formData.fromPlace || !formData.toPlace || !formData.vehicleType ||
        !formData.vehicleName || !formData.vehicleNumber || !formData.noOfVacancies ||
        !formData.cost) {
      setError('Please fill in all required fields')
      return false
    }

    if (!locationData.fromLocation || !locationData.toLocation) {
      setError('Please select locations on the map')
      return false
    }

    if (formData.noOfVacancies < 1 || formData.noOfVacancies > 10) {
      setError('Number of vacancies must be between 1 and 10')
      return false
    }

    if (formData.cost < 1) {
      setError('Cost must be greater than 0')
      return false
    }

    if (formData.date.isBefore(dayjs(), 'day')) {
      setError('Date cannot be in the past')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const rideData = {
        ...formData,
        date: formData.date.toISOString(),
        noOfVacancies: parseInt(formData.noOfVacancies),
        cost: parseFloat(formData.cost),
        fromLocation: locationData.fromLocation,
        toLocation: locationData.toLocation,
        routePoints: locationData.routePoints
      }

      await rideService.createRide(rideData)
      setSuccess('Ride created successfully!')
      setTimeout(() => {
        navigate('/my-rides')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to create ride')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create a New Ride
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Share your journey and help others reach their destination
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Map and Route Selection */}
              <Grid item xs={12}>
                <MapPicker
                  onFromLocationChange={handleFromLocationChange}
                  onToLocationChange={handleToLocationChange}
                  onRouteChange={handleRouteChange}
                  fromPlace={formData.fromPlace}
                  toPlace={formData.toPlace}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Vehicle Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Vehicle Details
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    name="vehicleType"
                    value={formData.vehicleType}
                    label="Vehicle Type"
                    onChange={handleChange}
                  >
                    {vehicleTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Vehicle Name/Model"
                  name="vehicleName"
                  value={formData.vehicleName}
                  onChange={handleChange}
                  placeholder="e.g., Honda Civic"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Vehicle Number"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="e.g., ABC-1234"
                />
              </Grid>

              {/* Trip Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Trip Details
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDate={dayjs()}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Time"
                    value={dayjs().hour(parseInt(formData.starttime.split(':')[0])).minute(parseInt(formData.starttime.split(':')[1]))}
                    onChange={handleTimeChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Number of Vacancies"
                  name="noOfVacancies"
                  type="number"
                  value={formData.noOfVacancies}
                  onChange={handleChange}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="How many passengers can you accommodate?"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Cost per Seat"
                  name="cost"
                  type="number"
                  value={formData.cost}
                  onChange={handleChange}
                  inputProps={{ min: 1, step: 0.01 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        ₹
                      </InputAdornment>
                    ),
                  }}
                  helperText="Cost per passenger"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
              >
                {loading ? 'Creating Ride...' : 'Create Ride'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/rides')}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default CreateRide