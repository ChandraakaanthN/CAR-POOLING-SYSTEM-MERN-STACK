import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
} from '@mui/material'
import {
  DirectionsCar as CarIcon,
  AccountCircle,
  Menu as MenuIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null)

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMobileMenuAnchor(null)
  }

  const handleLogout = () => {
    logout()
    handleMenuClose()
    navigate('/')
  }

  const handleProfile = () => {
    handleMenuClose()
    navigate('/profile')
  }

  const handleMyRides = () => {
    handleMenuClose()
    navigate('/my-rides')
  }

  const handleCreateRide = () => {
    handleMenuClose()
    navigate('/create-ride')
  }

  const handleRides = () => {
    handleMenuClose()
    navigate('/rides')
  }

  const menuItems = [
    { text: 'Available Rides', onClick: () => navigate('/rides') },
    { text: 'My Rides', onClick: () => navigate('/my-rides') },
    { text: 'My Requests', onClick: () => navigate('/my-requests') },
    { text: 'Create Ride', onClick: () => navigate('/create-ride') },
  ]

  const adminMenuItems = [
    { text: 'Admin Dashboard', onClick: () => navigate('/admin') },
    { text: 'Manage Users', onClick: () => navigate('/admin/users') },
  ]

  return (
    <AppBar position="fixed">
      <Container maxWidth="lg">
        <Toolbar>
          {/* Logo and Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              flexGrow: 1,
            }}
            onClick={() => navigate('/')}
          >
            <CarIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              CarPool
            </Typography>
          </Box>

          {/* Desktop Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                {!isAdmin() && menuItems.map((item) => (
                  <Button
                    key={item.text}
                    color="inherit"
                    onClick={item.onClick}
                    sx={{ mx: 1 }}
                  >
                    {item.text}
                  </Button>
                ))}
                {isAdmin() && (
                  <Button
                    color="inherit"
                    onClick={() => navigate('/admin')}
                    sx={{ mx: 1 }}
                  >
                    Admin Panel
                  </Button>
                )}
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls="profile-menu"
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user?.firstName?.charAt(0) || <AccountCircle />}
                  </Avatar>
                </IconButton>
              </>
            ) : (
              <>
                <Button color="inherit" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button color="inherit" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            )}
          </Box>

          {/* Mobile Menu Button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="show more"
              aria-controls="mobile-menu"
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Desktop Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfile}>Profile</MenuItem>
        {!isAdmin() && (
          <>
            <MenuItem onClick={handleMyRides}>My Rides</MenuItem>
            <MenuItem onClick={handleCreateRide}>Create Ride</MenuItem>
          </>
        )}
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>

      {/* Mobile Menu */}
      <Menu
        id="mobile-menu"
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {isAuthenticated ? (
          <>
            {!isAdmin() && menuItems.map((item) => (
              <MenuItem key={item.text} onClick={item.onClick}>
                {item.text}
              </MenuItem>
            ))}
            {isAdmin() && (
              <>
                <MenuItem onClick={() => navigate('/admin')}>Admin Dashboard</MenuItem>
                <MenuItem onClick={() => navigate('/admin/users')}>Manage Users</MenuItem>
              </>
            )}
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={() => navigate('/login')}>Login</MenuItem>
            <MenuItem onClick={() => navigate('/register')}>Register</MenuItem>
          </>
        )}
      </Menu>
    </AppBar>
  )
}

export default Navbar 