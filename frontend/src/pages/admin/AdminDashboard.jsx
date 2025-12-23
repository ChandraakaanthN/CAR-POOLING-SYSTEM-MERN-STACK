import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material'
import {
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Assignment as RequestIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { adminService } from '../../services/adminService'
import dayjs from 'dayjs'

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const data = await adminService.getDashboard()
      setDashboardData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!dashboardData) {
    return null
  }

  const { statistics, recentActivities } = dashboardData

  const statCards = [
    {
      title: 'Total Users',
      value: statistics.totalUsers,
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: '#1976d2',
    },
    {
      title: 'Active Users',
      value: statistics.activeUsers,
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: '#2e7d32',
    },
    {
      title: 'Total Rides',
      value: statistics.totalRides,
      icon: <CarIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: '#0288d1',
    },
    {
      title: 'Active Rides',
      value: statistics.activeRides,
      icon: <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: '#ed6c02',
    },
    {
      title: 'Total Requests',
      value: statistics.totalRequests,
      icon: <RequestIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: '#9c27b0',
    },
    {
      title: 'Pending Requests',
      value: statistics.pendingRequests,
      icon: <RequestIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      color: '#d32f2f',
    },
  ]

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" component="div" sx={{ color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Users
            </Typography>
            <List>
              {recentActivities.users.map((user, index) => (
                <React.Fragment key={user._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        {user.firstName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={user.email}
                    />
                    <Chip
                      label={dayjs(user.createdAt).format('MMM DD')}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                  {index < recentActivities.users.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Rides */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Rides
            </Typography>
            <List>
              {recentActivities.rides.map((ride, index) => (
                <React.Fragment key={ride._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <CarIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${ride.fromPlace} → ${ride.toPlace}`}
                      secondary={`by ${ride.owner.firstName} ${ride.owner.lastName}`}
                    />
                    <Chip
                      label={`₹${ride.cost}`}
                      size="small"
                      color="primary"
                    />
                  </ListItem>
                  {index < recentActivities.rides.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdminDashboard
