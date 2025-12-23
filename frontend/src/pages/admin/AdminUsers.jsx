import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  Switch,
  Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { adminService } from '../../services/adminService'
import dayjs from 'dayjs'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [page, rowsPerPage, search, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await adminService.getUsers(
        page + 1,
        rowsPerPage,
        search,
        statusFilter
      )
      setUsers(data.users)
      setTotalUsers(data.pagination.totalUsers)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearch = (event) => {
    setSearch(event.target.value)
    setPage(0)
  }

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value)
    setPage(0)
  }

  const handleViewUser = async (user) => {
    try {
      const userDetails = await adminService.getUserDetails(user._id)
      setSelectedUser(userDetails)
      setViewDialogOpen(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setActionLoading(true)
      await adminService.updateUserStatus(userId, !currentStatus)
      fetchUsers() // Refresh the list
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)
      await adminService.deleteUser(selectedUser.user._id)
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers() // Refresh the list
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error'
  }

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircleIcon /> : <BlockIcon />
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Search Users"
            variant="outlined"
            size="small"
            value={search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilter}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>License</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar>
                        {user.firstName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.gender}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.license}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(user.isActive)}
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={getStatusColor(user.isActive)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {dayjs(user.createdAt).format('MMM DD, YYYY')}
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewUser(user)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          color={user.isActive ? 'warning' : 'success'}
                          disabled={actionLoading}
                        >
                          {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser({ user })
                            setDeleteDialogOpen(true)
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* View User Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedUser.user.firstName} {selectedUser.user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email: {selectedUser.user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Phone: {selectedUser.user.phone}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                License: {selectedUser.user.license}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gender: {selectedUser.user.gender}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Status: {selectedUser.user.isActive ? 'Active' : 'Inactive'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Joined: {dayjs(selectedUser.user.createdAt).format('MMMM DD, YYYY')}
              </Typography>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                User Statistics
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Rides Created: {selectedUser.rides.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Requests Made: {selectedUser.requests.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Reviews Given: {selectedUser.reviews.length}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedUser?.user.firstName} {selectedUser?.user.lastName}?
            This action cannot be undone and will delete all associated data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AdminUsers
