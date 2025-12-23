import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import Navbar from './components/Navbar'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Rides from './pages/Rides'
import MyRides from './pages/MyRides'
import MyRequests from './pages/MyRequests'
import CreateRide from './pages/CreateRide'
import RideDetails from './pages/RideDetails'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f5f5f5'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          isAuthenticated && isAdmin() ? (
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/users" element={<AdminUsers />} />
                {/* Add more admin routes here */}
              </Routes>
            </AdminLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />

        {/* User Routes */}
        <Route path="/*" element={
          <>
            <Navbar />
            <Box sx={{ pt: 8 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
                <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/rides" element={isAuthenticated ? <Rides /> : <Navigate to="/login" />} />
                <Route path="/my-rides" element={isAuthenticated ? <MyRides /> : <Navigate to="/login" />} />
                <Route path="/my-requests" element={isAuthenticated ? <MyRequests /> : <Navigate to="/login" />} />
                <Route path="/create-ride" element={isAuthenticated ? <CreateRide /> : <Navigate to="/login" />} />
                <Route path="/ride/:id" element={isAuthenticated ? <RideDetails /> : <Navigate to="/login" />} />
              </Routes>
            </Box>
          </>
        } />
      </Routes>
    </Box>
  )
}

export default App 