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
  Divider,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material'
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Star as StarIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { rideService } from '../services/rideService'
import { useAuth } from '../context/AuthContext'
import dayjs from 'dayjs'

const RideDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ride, setRide] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [seatsRequested, setSeatsRequested] = useState(1)
  const [requestLoading, setRequestLoading] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    fetchRideDetails()
  }, [id])

  const fetchRideDetails = async () => {
    try {
      setLoading(true)
      const rideData = await rideService.getRideById(id)
      setRide(rideData)
      
      // Fetch reviews for the ride owner
      const reviewsData = await rideService.getRiderReviews(rideData.owner._id)
      setReviews(reviewsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRide = () => {
    setSeatsRequested(1)
    setShowRequestDialog(true)
  }

  const handleSubmitRequest = async () => {
    try {
      setRequestLoading(true)
      await rideService.requestRide(ride._id, seatsRequested)
      setShowRequestDialog(false)
      // Refresh ride data to update vacancy count
      fetchRideDetails()
    } catch (err) {
      setError(err.message)
    } finally {
      setRequestLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    try {
      setReviewLoading(true)
      await rideService.postReview(ride.owner._id, reviewRating, reviewComment)
      setShowReviewDialog(false)
      setReviewRating(5)
      setReviewComment('')
      // Refresh reviews
      const reviewsData = await rideService.getRiderReviews(ride.owner._id)
      setReviews(reviewsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setReviewLoading(false)
    }
  }

  const isOwner = user?._id === ride?.owner?._id

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!ride) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Ride not found
          </Typography>
          <Button onClick={() => navigate('/rides')} sx={{ mt: 2 }}>
            Back to Rides
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Button onClick={() => navigate('/rides')} sx={{ mb: 2 }}>
          ← Back to Rides
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Ride Details */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h4" component="h1">
                    {ride.vehicleName}
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body1">
                          <strong>From:</strong> {ride.fromPlace}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body1">
                          <strong>To:</strong> {ride.toPlace}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ScheduleIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body1">
                          <strong>Date:</strong> {dayjs(ride.date).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ScheduleIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body1">
                          <strong>Time:</strong> {ride.starttime}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body1">
                          <strong>Driver:</strong> {ride.owner.firstName} {ride.owner.lastName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MoneyIcon sx={{ mr: 1, fontSize: 'small' }} />
                        <Typography variant="body1">
                          <strong>Cost:</strong> ${ride.cost}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Vehicle Type:</strong> {ride.vehicleType}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Vehicle Number:</strong> {ride.vehicleNumber}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Chip
                      label={`${ride.vehicleType}`}
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${ride.noOfVacancies} seats available`}
                      color={ride.noOfVacancies > 0 ? 'success' : 'error'}
                    />
                  </Box>
                  {!isOwner && ride.noOfVacancies > 0 && (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleRequestRide}
                    >
                      Request Ride
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Driver Info & Reviews */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Driver Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>
                    {ride.owner.firstName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {ride.owner.firstName} {ride.owner.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ride.owner.email}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Driver Reviews
                  </Typography>
                  {!isOwner && (
                    <Button
                      size="small"
                      startIcon={<ReviewIcon />}
                      onClick={() => setShowReviewDialog(true)}
                    >
                      Write Review
                    </Button>
                  )}
                </Box>

                {reviews.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No reviews yet
                  </Typography>
                ) : (
                  <List>
                    {reviews.slice(0, 3).map((review) => (
                      <ListItem key={review._id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar>
                            {review.reviewer.firstName?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Rating value={review.rating} readOnly size="small" />
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {review.reviewer.firstName} {review.reviewer.lastName}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {review.comment}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {dayjs(review.createdAt).format('MMM DD, YYYY')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onClose={() => setShowRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Ride</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Request a seat for the ride from <strong>{ride.fromPlace}</strong> to <strong>{ride.toPlace}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Number of Seats"
            type="number"
            value={seatsRequested}
            onChange={(e) => setSeatsRequested(parseInt(e.target.value))}
            inputProps={{ min: 1, max: ride.noOfVacancies }}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Available seats: {ride.noOfVacancies}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRequestDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitRequest}
            variant="contained"
            disabled={requestLoading}
          >
            {requestLoading ? 'Sending Request...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onClose={() => setShowReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Rate your experience with {ride.owner.firstName} {ride.owner.lastName}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={reviewRating}
              onChange={(event, newValue) => setReviewRating(newValue)}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            label="Comment (optional)"
            multiline
            rows={4}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReviewDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={reviewLoading}
          >
            {reviewLoading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default RideDetails 