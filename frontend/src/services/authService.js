import api from './api'

export const authService = {
  async register(userData) {
    try {
      const response = await api.post('/auth/signup', userData)
      return response.data
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Unable to connect to server. Please make sure the backend server is running on port 1511.')
        }
        throw new Error('Network error: ' + (error.message || 'Unable to connect to server'))
      }
      throw new Error(error.response?.data?.error || error.response?.data || 'Registration failed')
    }
  },

  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password })
      return response.data
    } catch (error) {
      // Handle network errors (server not running, connection refused, etc.)
      if (!error.response) {
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Unable to connect to server. Please make sure the backend server is running on port 1511.')
        }
        throw new Error('Network error: ' + (error.message || 'Unable to connect to server'))
      }
      // Handle API errors with response
      const errorMessage = error.response?.data?.error || error.response?.data || error.message || 'Login failed'
      throw new Error(errorMessage)
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/profile')
      return response.data
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Unable to connect to server. Please make sure the backend server is running on port 1511.')
        }
        throw new Error('Network error: ' + (error.message || 'Unable to connect to server'))
      }
      throw new Error(error.response?.data?.error || error.response?.data || 'Failed to get profile')
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.patch('/profile/edit', profileData)
      return response.data
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Unable to connect to server. Please make sure the backend server is running on port 1511.')
        }
        throw new Error('Network error: ' + (error.message || 'Unable to connect to server'))
      }
      throw new Error(error.response?.data?.error || error.response?.data || 'Failed to update profile')
    }
  },

  async changePassword(oldPassword, newPassword) {
    try {
      const response = await api.patch('/auth/changepassword', {
        oldPassword,
        newPassword,
      })
      return response.data
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Unable to connect to server. Please make sure the backend server is running on port 1511.')
        }
        throw new Error('Network error: ' + (error.message || 'Unable to connect to server'))
      }
      const errorMessage = error.response?.data?.error || error.response?.data || error.message || 'Failed to change password'
      throw new Error(errorMessage)
    }
  },
} 