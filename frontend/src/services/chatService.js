import api from './api'
import { io } from 'socket.io-client'

export const chatService = {
  async getChat(rideId) {
    try {
      const response = await api.get(`/chat/${rideId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to get chat')
    }
  },

  async getAllChats() {
    try {
      const response = await api.get('/chat')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to get chats')
    }
  }
}

// WebSocket connection management
class ChatSocket {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.messageHandlers = new Map() // rideId -> handlers[]
    this.connectionCallbacks = []
    this.joinedRides = new Set()
  }

  connect(token) {
    if (this.socket && this.isConnected) return // Already connected

    if (this.socket) this.socket.disconnect()

    this.socket = io('http://localhost:1511', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.socket.on('connect', () => {
      console.log('Connected to chat server')
      this.isConnected = true
      // Re-join all rides on reconnect (before notifying callbacks)
      this.joinedRides.forEach(rideId => {
        console.log(`Re-joining ride ${rideId} after reconnect`)
        if (this.socket) {
          this.socket.emit('join-ride', rideId)
        }
      })
      // Notify all connection callbacks
      this.connectionCallbacks.forEach(cb => cb(true))
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server')
      this.isConnected = false
      this.connectionCallbacks.forEach(cb => cb(false))
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.isConnected = false
      this.connectionCallbacks.forEach(cb => cb(false))
    })

    this.socket.on('new-message', (data) => {
      console.log('Socket received new-message event:', {
        rideId: data.rideId,
        messageContent: data.message?.content,
        sender: data.message?.sender?.firstName
      })
      const rideIdKey = data.rideId?.toString()
      if (!rideIdKey) {
        console.warn('Received message without rideId')
        return
      }
      const handlers = this.messageHandlers.get(rideIdKey) || []
      console.log(`Found ${handlers.length} handler(s) for ride ${rideIdKey}`)
      if (handlers.length === 0) {
        console.warn(`No handlers registered for ride ${rideIdKey}`)
      }
      handlers.forEach((handler, index) => {
        console.log(`Calling handler ${index + 1} for ride ${rideIdKey} synchronously`)
        try {
          handler(data.message)
          console.log(`Handler ${index + 1} completed successfully`)
        } catch (error) {
          console.error(`Error in message handler ${index + 1}:`, error)
        }
      })
    })

    this.socket.on('message-error', (data) => {
      console.error('Message error:', data.error)
    })
  }

  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback)
    // Immediately call with current status
    callback(this.isConnected)
  }

  subscribe(rideId, handler) {
    const key = rideId?.toString()
    if (!key) {
      console.warn('Cannot subscribe: invalid rideId', rideId)
      return
    }
    if (!this.messageHandlers.has(key)) {
      this.messageHandlers.set(key, [])
    }
    const handlers = this.messageHandlers.get(key)
    if (!handlers.includes(handler)) {
      handlers.push(handler)
      console.log(`Subscribed handler for ride ${key}. Total handlers: ${handlers.length}`)
    } else {
      console.log(`Handler already subscribed for ride ${key}`)
    }
    // Join the ride room (will join immediately if connected, or queue for when connected)
    this.joinRide(key)
  }

  unsubscribe(rideId, handler) {
    const key = rideId?.toString()
    if (!key) return
    if (this.messageHandlers.has(key)) {
      const handlers = this.messageHandlers.get(key)
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
      if (handlers.length === 0) {
        this.messageHandlers.delete(key)
        this.leaveRide(key)
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  joinRide(rideId) {
    const key = rideId?.toString()
    if (!key) {
      console.warn('Cannot join ride: invalid rideId', rideId)
      return
    }
    this.joinedRides.add(key)
    if (this.socket && this.isConnected) {
      console.log(`Joining ride room: ${key}`)
      this.socket.emit('join-ride', key)
    } else {
      console.log(`Socket not connected, will join ride ${key} when connected`)
    }
  }

  leaveRide(rideId) {
    const key = rideId?.toString()
    if (!key) return
    this.joinedRides.delete(key)
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-ride', key)
    }
  }

  sendMessage(rideId, content) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-message', { rideId, content })
    }
  }

  onNewMessage(rideId, handler) {
    this.subscribe(rideId, handler)
  }

  offNewMessage(rideId, handler) {
    this.unsubscribe(rideId, handler)
  }
}

export const chatSocket = new ChatSocket() 