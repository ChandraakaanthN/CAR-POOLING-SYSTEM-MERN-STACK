import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material'
import { Send as SendIcon, Close as CloseIcon } from '@mui/icons-material'
import { chatService, chatSocket } from '../services/chatService'
import { useAuth } from '../context/AuthContext'
import Cookies from 'js-cookie'
import dayjs from 'dayjs'

const ChatDialog = ({ open, onClose, rideId, rideInfo }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Stable message handler using useCallback
  const handleNewMessage = useCallback((message) => {
    console.log('handleNewMessage called with:', message)
    if (!message || !message.content) {
      console.warn('Invalid message received:', message)
      return
    }
    
    // Update state immediately (React will batch if needed, but this ensures it happens)
    setMessages(prev => {
      // Check if message already exists (to avoid duplicates from optimistic updates)
      const existingIndex = prev.findIndex(m => 
        (m._id && m._id.startsWith('temp-')) && // It's an optimistic message
        m.content === message.content && 
        m.sender?._id === message.sender?._id &&
        Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 5000 // Within 5 seconds
      )
      
      if (existingIndex !== -1) {
        // Replace optimistic message with real one
        const updated = [...prev]
        updated[existingIndex] = message
        console.log('Replaced optimistic message, new count:', updated.length)
        return updated
      }
      
      // Check if this exact message already exists (from socket broadcast)
      const messageExists = prev.some(m => {
        if (m._id && message._id && m._id === message._id) return true
        if (
          m.content === message.content && 
          m.sender?._id === message.sender?._id &&
          Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 1000
        ) return true
        return false
      })
      
      if (messageExists) {
        console.log('Message already exists, skipping')
        return prev
      }
      
      console.log('Adding new message to state, previous count:', prev.length)
      const newMessages = [...prev, message]
      console.log('New message count:', newMessages.length)
      return newMessages
    })
  }, [])

  useEffect(() => {
    if (open && rideId) {
      loadChat()
      
      const token = Cookies.get('jwt')
      if (!token) {
        setError('Authentication required')
        return
      }

      // Connect socket
      chatSocket.connect(token)
      
      // Subscribe immediately (will work if already connected, or queue if not)
      chatSocket.onNewMessage(rideId, handleNewMessage)
      console.log('Subscribed to messages for ride:', rideId)
      
      // Set up connection handler
      const connectionHandler = (connected) => {
        console.log('Connection status changed:', connected, 'for ride:', rideId)
        setIsConnected(connected)
        if (connected && rideId) {
          // Join the ride room
          chatSocket.joinRide(rideId)
          // Ensure subscription (in case it wasn't already done)
          chatSocket.onNewMessage(rideId, handleNewMessage)
          console.log('Socket connected, joined ride and subscribed:', rideId)
        }
      }
      
      chatSocket.onConnectionChange(connectionHandler)
      
      // If already connected, join immediately
      if (chatSocket.isConnected) {
        chatSocket.joinRide(rideId)
        setIsConnected(true)
      }
      
      // Cleanup
      return () => {
        console.log('Cleaning up chat for ride:', rideId)
        chatSocket.offNewMessage(rideId, handleNewMessage)
      }
    }
  }, [open, rideId, handleNewMessage])

  const loadChat = async () => {
    try {
      setLoading(true)
      const chat = await chatService.getChat(rideId)
      // Populate sender info if not already populated
      const populatedMessages = (chat.messages || []).map(msg => ({
        ...msg,
        sender: msg.sender && typeof msg.sender === 'object' ? msg.sender : {
          _id: msg.sender,
          firstName: 'User',
          lastName: ''
        }
      }))
      setMessages(populatedMessages)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return

    const messageContent = newMessage.trim()
    
    // Optimistically add message to UI immediately
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      content: messageContent,
      sender: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName
      },
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    
    // Send via socket
    chatSocket.sendMessage(rideId, messageContent)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const isOwnMessage = (message) => {
    return message.sender._id === user._id
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              Chat - {rideInfo?.fromPlace} to {rideInfo?.toPlace}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rideInfo?.date && dayjs(rideInfo.date).format('MMM DD, YYYY')} at {rideInfo?.starttime}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography color="text.secondary">
                    No messages yet. Start the conversation!
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {messages.map((message, index) => (
                    <ListItem
                      key={message._id || `msg-${index}-${message.timestamp}`}
                      sx={{
                        flexDirection: 'column',
                        alignItems: isOwnMessage(message) ? 'flex-end' : 'flex-start',
                        p: 0,
                        mb: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', maxWidth: '70%' }}>
                        {!isOwnMessage(message) && (
                          <Avatar sx={{ width: 32, height: 32, mr: 1, mb: 1 }}>
                            {message.sender.firstName?.charAt(0)}
                          </Avatar>
                        )}
                        <Paper
                          sx={{
                            p: 1.5,
                            backgroundColor: isOwnMessage(message) ? 'primary.main' : 'grey.100',
                            color: isOwnMessage(message) ? 'white' : 'text.primary',
                            borderRadius: 2,
                            maxWidth: '100%'
                          }}
                        >
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {message.content}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              opacity: 0.7,
                              display: 'block',
                              mt: 0.5
                            }}
                          >
                            {dayjs(message.timestamp).format('HH:mm')}
                          </Typography>
                        </Paper>
                        {isOwnMessage(message) && (
                          <Avatar sx={{ width: 32, height: 32, ml: 1, mb: 1 }}>
                            {message.sender.firstName?.charAt(0)}
                          </Avatar>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                  <div ref={messagesEndRef} />
                </List>
              )}
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isConnected}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  color="primary"
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
              {!isConnected && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  Connecting to chat server...
                </Typography>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ChatDialog 