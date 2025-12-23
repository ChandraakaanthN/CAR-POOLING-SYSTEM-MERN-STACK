import React, { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Button,
} from '@mui/material'
import { Chat as ChatIcon } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { rideService } from '../services/rideService'
import ChatDialog from '../components/ChatDialog'
import dayjs from 'dayjs'

const MyRequests = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedRide, setSelectedRide] = useState(null)

  useEffect(() => {
    if (!user?._id) return
    const load = async () => {
      try {
        setLoading(true)
        const data = await rideService.getMyRequests(user._id)
        setRequests(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?._id])

  const handleChatClick = (request) => {
    setSelectedRide(request.rideId)
    setChatOpen(true)
  }

  const handleCloseChat = () => {
    setChatOpen(false)
    setSelectedRide(null)
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
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          My Ride Requests
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {(!requests || requests.length === 0) ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              You haven't requested any rides yet
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {requests.map((req) => (
              <Grid item xs={12} md={6} lg={4} key={`${req.rideId?._id}-${req.requestedAt}`}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {req.rideId?.vehicleName}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      From: {req.rideId?.fromPlace}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      To: {req.rideId?.toPlace}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Date: {req.rideId?.date ? dayjs(req.rideId.date).format('MMM DD, YYYY') : '-'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Seats requested: {req.seatsRequested}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={req.status} color={
                        req.status === 'accepted' ? 'success' :
                        req.status === 'rejected' ? 'error' :
                        req.status === 'pending' ? 'warning' : 'default'
                      } />
                      {req.status === 'accepted' && (
                        <Button
                          size="small"
                          startIcon={<ChatIcon />}
                          onClick={() => handleChatClick(req)}
                          variant="outlined"
                        >
                          Chat
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <ChatDialog
        open={chatOpen}
        onClose={handleCloseChat}
        rideId={selectedRide?._id}
        rideInfo={selectedRide}
      />
    </Container>
  )
}

export default MyRequests;