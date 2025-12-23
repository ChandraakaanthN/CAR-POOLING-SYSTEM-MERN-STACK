import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material'
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Chat as ChatIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { rideService } from '../services/rideService'
import ChatDialog from '../components/ChatDialog'
import dayjs from 'dayjs'

const MyRides = () => {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRide, setSelectedRide] = useState(null)
  const [showRequestsDialog, setShowRequestsDialog] = useState(false)
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [requests, setRequests] = useState([])
  const [requestsByRide, setRequestsByRide] = useState({})
  const [requestsLoading, setRequestsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMyRides()
  }, [])

  useEffect(() => {
    // Fetch requests for all rides when rides are loaded
    if (rides.length > 0) {
      const fetchAllRideRequests = async () => {
        try {
          const requestsMap = {}
          await Promise.all(
            rides.map(async (ride) => {
              try {
                const data = await rideService.getRideRequests(ride._id)
                requestsMap[ride._id] = data
              } catch (err) {
                console.error(`Failed to fetch requests for ride ${ride._id}:`, err)
                requestsMap[ride._id] = []
              }
            })
          )
          setRequestsByRide(requestsMap)
        } catch (err) {
          console.error('Failed to fetch ride requests:', err)
        }
      }
      fetchAllRideRequests()
    }
  }, [rides])

  const fetchMyRides = async () => {
    try {
      setLoading(true)
      const data = await rideService.getMyRides()
      setRides(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewRequests = async (ride) => {
    setSelectedRide(ride)
    setShowRequestsDialog(true)
    setRequestsLoading(true)

    try {
      // Use cached requests if available, otherwise fetch
      const cachedRequests = requestsByRide[ride._id]
      if (cachedRequests) {
        setRequests(cachedRequests)
        setRequestsLoading(false)
      } else {
        const data = await rideService.getRideRequests(ride._id)
        setRequests(data)
        // Update cache
        setRequestsByRide(prev => ({ ...prev, [ride._id]: data }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleChatClick = (ride) => {
    setSelectedRide(ride)
    setShowChatDialog(true)
  }

  const handleRespondToRequest = async (requestId, status) => {
    try {
      await rideService.respondToRequest(selectedRide._id, requestId, status)
      // Refresh requests
      const data = await rideService.getRideRequests(selectedRide._id)
      setRequests(data)
      // Update cache
      setRequestsByRide(prev => ({ ...prev, [selectedRide._id]: data }))
      // Refresh rides to update vacancy count
      fetchMyRides()
    } catch (err) {
      setError(err.message)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckIcon color="success" />
      case 'rejected':
        return <CancelIcon color="error" />
      case 'pending':
        return <PendingIcon color="warning" />
      default:
        return <PendingIcon color="disabled" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'success'
      case 'rejected':
        return 'error'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  const hasAcceptedRequests = (rideId) => {
    const rideRequests = requestsByRide[rideId] || []
    return rideRequests.some(req => req.requests && req.requests.some(r => r.status === 'accepted'))
  }

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
            My Rides
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/create-ride')}
          >
            Create New Ride
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {rides.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              You haven't created any rides yet
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/create-ride')}
              sx={{ mt: 2 }}
            >
              Create Your First Ride
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {rides.map((ride) => (
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
                          From: {ride.fromPlace}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body2">
                          To: {ride.toPlace}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ScheduleIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body2">
                          Date: {dayjs(ride.date).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ScheduleIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body2">
                          Time: {ride.starttime}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MoneyIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body2">
                          Cost: ${ride.cost}
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

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleViewRequests(ride)}
                      >
                        View Requests
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ChatIcon />}
                        onClick={() => handleChatClick(ride)}
                        disabled={!hasAcceptedRequests(ride._id)}
                      >
                        Chat
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Requests Dialog */}
      <Dialog 
        open={showRequestsDialog} 
        onClose={() => setShowRequestsDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Ride Requests - {selectedRide?.fromPlace} to {selectedRide?.toPlace}
        </DialogTitle>
        <DialogContent>
          {requestsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : requests.length === 0 ? (
            <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
              No requests for this ride yet
            </Typography>
          ) : (
            <List>
              {requests.map((requestGroup) => (
                requestGroup.requests.map((request) => (
                  <React.Fragment key={request._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${request.userId?.firstName || 'User'} ${request.userId?.lastName || ''}`}
                        secondary={
                          <>
                            <Typography variant="body2">
                              Seats requested: {request.seatsRequested}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Requested: {dayjs(request.requestedAt).format('MMM DD, YYYY HH:mm')}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              {getStatusIcon(request.status)}
                              <Chip
                                label={request.status}
                                size="small"
                                color={getStatusColor(request.status)}
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          </>
                        }
                      />
                      {request.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleRespondToRequest(
                              typeof request.userId === 'object' ? request.userId._id : request.userId, 
                              'accepted'
                            )}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleRespondToRequest(
                              typeof request.userId === 'object' ? request.userId._id : request.userId, 
                              'rejected'
                            )}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRequestsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Chat Dialog */}
      <ChatDialog
        open={showChatDialog}
        onClose={() => setShowChatDialog(false)}
        rideId={selectedRide?._id}
        rideInfo={selectedRide}
      />
    </Container>
  )
}

export default MyRides 