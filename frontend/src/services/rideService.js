import api from './api'

const normalizeError = (error, fallback) => {
  if (error.response) {
    const data = error.response.data
    if (typeof data === 'string') return data
    if (data?.message) return data.message
    if (data?.error) return data.error
  }
  if (error.message) return error.message
  return fallback
}

export const rideService = {
  async getAllRides() {
    try {
      const response = await api.get('/rides')
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error, 'Failed to fetch rides'))
    }
  },

  async getMyRides() {
    try {
      const response = await api.get('/rides/my-rides')
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error, 'Failed to fetch my rides'))
    }
  },

  async createRide(rideData) {
    try {
      const response = await api.post('/rides', rideData)
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error, 'Failed to create ride'))
    }
  },

  async getRideById(rideId) {
    try {
      const response = await api.get(`/rides/${rideId}`)
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error, 'Failed to fetch ride'))
    }
  },

  async searchRides(fromLng, fromLat, toLng, toLat) {
    try {
      const response = await api.get('/rides/search', {
        params: { fromLng, fromLat, toLng, toLat }
      })
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error, 'Failed to search rides'))
    }
  },

  async requestRide(rideId, seats = 1) {
    try {
      const response = await api.post(`/requests/ride/${rideId}`, { seats })
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error, 'Failed to request ride'))
    }
  },

  async getRideRequests(rideId) {
    try {
      const response = await api.get(`/requests/ride/${rideId}`)
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error, 'Failed to fetch requests'))
    }
  },

  async respondToRequest(rideId, requestId, status) {
    try {
      const response = await api.post(`/requests/ride/${rideId}/${requestId}`, { status })
      return response.data
    } catch (error) {
      const message = normalizeError(error, 'Failed to respond to request')
      throw new Error(message)
    }
  },

  async getRiderReviews(riderId) {
    try {
      const response = await api.get(`/reviews/rider/${riderId}`)
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error, 'Failed to fetch reviews'))
    }
  },

  async postReview(rideId, rating, comment) {
    try {
      const response = await api.post(`/reviews/${rideId}`, { rating, comment })
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error, 'Failed to post review'))
    }
  },

  async getMyRequests(userId) {
    try {
      const response = await api.get(`/requests/${userId}`)
      return response.data
    } catch (error) {
      // Treat 404 (no requests) as an empty list instead of an error
      if (error.response?.status === 404) {
        return []
      }

      // Normalize server error messages to avoid "[object Object]" in UI
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === 'string'
          ? error.response.data
          : null) ||
        "Failed to fetch your requests"

      throw new Error(message)
    }
  },
} 