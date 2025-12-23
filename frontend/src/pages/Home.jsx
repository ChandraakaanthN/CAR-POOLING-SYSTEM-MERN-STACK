import React from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material'
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: <CarIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Share Your Ride',
      description: 'Create rides and share your journey with others, making travel more social and sustainable.',
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Find Companions',
      description: 'Discover people traveling to the same destination and make new connections.',
    },
    {
      icon: <SavingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Save Money',
      description: 'Split fuel costs and reduce your travel expenses significantly.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Safe & Verified',
      description: 'All users are verified with proper identification and license information.',
    },
  ]

  return (
    <Box>
     
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Share Your Journey
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom>
                Connect with fellow travelers and make every trip an adventure
              </Typography>
              <Typography variant="body1" paragraph>
                Join our community of drivers and passengers. Save money, reduce your carbon footprint,
                and make new friends along the way.
              </Typography>
              <Box sx={{ mt: 3 }}>
                {isAuthenticated ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/rides')}
                    sx={{ mr: 2, mb: 2 }}
                  >
                    Find Rides
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/register')}
                      sx={{ mr: 2, mb: 2 }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{ color: 'white', borderColor: 'white', mb: 2 }}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 300,
                }}
              >
                <CarIcon sx={{ fontSize: 200, opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Why Choose CarPool?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          py: 6,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            Ready to Start Your Journey?
          </Typography>
          <Typography variant="h6" align="center" paragraph>
            Join thousands of users who are already sharing rides and saving money
          </Typography>
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            {isAuthenticated ? (
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/create-ride')}
                sx={{ backgroundColor: 'white', color: 'primary.main' }}
              >
                Create Your First Ride
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ backgroundColor: 'white', color: 'primary.main' }}
              >
                Join Now
              </Button>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default Home 