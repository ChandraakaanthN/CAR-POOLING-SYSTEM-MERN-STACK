import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE_URL = 'http://localhost:1511'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('jwt')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      // Enhance network error messages
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
        error.message = 'Unable to connect to server. Please make sure the backend server is running on port 1511.'
      } else if (error.code === 'ERR_INTERNET_DISCONNECTED') {
        error.message = 'No internet connection. Please check your network.'
      } else if (error.code === 'ETIMEDOUT') {
        error.message = 'Connection timeout. The server is taking too long to respond.'
      }
    }
    
    if (error.response?.status === 401) {
      // Clear invalid token
      Cookies.remove('jwt')
      // Don't redirect here - let the component handle it
      // This prevents redirect loops during auth checks
    }
    return Promise.reject(error)
  }
)

export default api 