import api from './api'

export const adminService = {
  // Dashboard
  async getDashboard() {
    try {
      const response = await api.get('/admin/dashboard')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to fetch dashboard data')
    }
  },

  // Users Management
  async getUsers(page = 1, limit = 10, search = '', status = '') {
    try {
      const response = await api.get('/admin/users', {
        params: { page, limit, search, status }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to fetch users')
    }
  },

  async getUserDetails(userId) {
    try {
      const response = await api.get(`/admin/users/${userId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to fetch user details')
    }
  },

  async updateUserStatus(userId, isActive) {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, { isActive })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to update user status')
    }
  },

  async deleteUser(userId) {
    try {
      const response = await api.delete(`/admin/users/${userId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to delete user')
    }
  },

  // Rides Management
  async getRides(page = 1, limit = 10, status = '', search = '') {
    try {
      const response = await api.get('/admin/rides', {
        params: { page, limit, status, search }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to fetch rides')
    }
  },

  async getRideDetails(rideId) {
    try {
      const response = await api.get(`/admin/rides/${rideId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to fetch ride details')
    }
  },

  async deleteRide(rideId) {
    try {
      const response = await api.delete(`/admin/rides/${rideId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to delete ride')
    }
  },

  // Requests Management
  async getRequests(page = 1, limit = 10, status = '') {
    try {
      const response = await api.get('/admin/requests', {
        params: { page, limit, status }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to fetch requests')
    }
  },

  // Statistics
  async getStatistics(period = 30) {
    try {
      const response = await api.get('/admin/statistics', {
        params: { period }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to fetch statistics')
    }
  }
}
