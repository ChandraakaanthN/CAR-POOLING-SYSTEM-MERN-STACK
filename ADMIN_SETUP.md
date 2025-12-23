# CarPool Admin Panel Setup Guide

## Overview
This guide will help you set up the admin panel for your CarPool application. The admin panel allows administrators to manage users, rides, requests, and view system statistics.

## Features Implemented

### Admin Dashboard
- **Statistics Overview**: Total users, active users, total rides, active rides, total requests, pending requests
- **Recent Activities**: Latest user registrations and ride creations
- **Visual Cards**: Easy-to-read statistics with icons and colors

### User Management
- **User List**: View all users with pagination and search functionality
- **User Details**: View comprehensive user information including rides, requests, and reviews
- **User Status Management**: Activate/deactivate users
- **User Deletion**: Delete users and all associated data
- **Search & Filter**: Search by name, email, phone and filter by status

### Security Features
- **Role-based Access**: Only users with admin role can access admin panel
- **JWT Authentication**: Secure token-based authentication
- **Middleware Protection**: Admin-specific middleware for route protection

## Setup Instructions

### Step 1: Backend Setup

1. **Install Dependencies** (if not already done):
   ```bash
   cd backend
   npm install
   ```

2. **Create Admin User**:
   ```bash
   npm run create-admin
   ```
   This will create an admin user with the following credentials:
   - Email: `admin@carpool.com`
   - Password: `Admin@123`
   - Role: `admin`

3. **Start Backend Server**:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:1511`

### Step 2: Frontend Setup

1. **Install Dependencies** (if not already done):
   ```bash
   cd frontend
   npm install
   ```

2. **Start Frontend Development Server**:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

### Step 3: Access Admin Panel

1. **Login as Admin**:
   - Go to `http://localhost:3000/login`
   - Use the admin credentials:
     - Email: `admin@carpool.com`
     - Password: `Admin@123`

2. **Access Admin Panel**:
   - After login, you'll see an "Admin Panel" button in the navigation
   - Click on it to access the admin dashboard
   - Or directly navigate to `http://localhost:3000/admin`

## Admin Panel Features

### Dashboard (`/admin`)
- Overview of system statistics
- Recent user registrations
- Recent ride creations
- Quick access to all admin functions

### User Management (`/admin/users`)
- **View All Users**: Paginated list of all registered users
- **Search Users**: Search by name, email, or phone number
- **Filter by Status**: Filter active/inactive users
- **User Actions**:
  - View detailed user information
  - Activate/deactivate users
  - Delete users (with confirmation)

### User Details View
When viewing a user, you can see:
- Personal information (name, email, phone, license, gender)
- Account status and join date
- User statistics:
  - Total rides created
  - Total requests made
  - Total reviews given

## API Endpoints

### Admin Routes (Protected by adminAuth middleware)

#### Dashboard
- `GET /admin/dashboard` - Get dashboard statistics and recent activities

#### User Management
- `GET /admin/users` - Get all users with pagination and search
- `GET /admin/users/:userId` - Get detailed user information
- `PATCH /admin/users/:userId/status` - Update user status (activate/deactivate)
- `DELETE /admin/users/:userId` - Delete user and all associated data

#### Ride Management
- `GET /admin/rides` - Get all rides with pagination and filters
- `GET /admin/rides/:rideId` - Get detailed ride information
- `DELETE /admin/rides/:rideId` - Delete ride and associated data

#### Request Management
- `GET /admin/requests` - Get all requests with pagination

#### Statistics
- `GET /admin/statistics` - Get system statistics and trends

## Security Considerations

### Authentication
- All admin routes are protected by `adminAuth` middleware
- JWT tokens include user role information
- Only users with `role: 'admin'` can access admin functionality

### Authorization
- Admin middleware checks both JWT token and user role
- Inactive admin accounts cannot access admin panel
- Regular users cannot access admin routes

### Data Protection
- User passwords are hashed using bcrypt
- Sensitive user data is filtered out in responses
- Admin actions are logged and validated

## File Structure

```
backend/
├── middlewares/
│   ├── auth.js          # Regular user authentication
│   └── adminAuth.js     # Admin-specific authentication
├── routes/
│   └── admin.js         # Admin API routes
├── models/
│   └── user.js          # Updated with role and isActive fields
└── scripts/
    └── createAdmin.js   # Admin user creation script

frontend/
├── src/
│   ├── components/
│   │   └── AdminLayout.jsx      # Admin panel layout
│   ├── pages/admin/
│   │   ├── AdminDashboard.jsx   # Dashboard page
│   │   └── AdminUsers.jsx       # User management page
│   ├── services/
│   │   └── adminService.js      # Admin API service
│   └── context/
│       └── AuthContext.jsx      # Updated with admin role support
```

## Customization

### Adding New Admin Features

1. **Backend**:
   - Add new routes in `backend/routes/admin.js`
   - Use `adminAuth` middleware for protection
   - Follow existing patterns for consistency

2. **Frontend**:
   - Create new admin pages in `frontend/src/pages/admin/`
   - Add routes to `AdminLayout.jsx`
   - Update `adminService.js` with new API calls

### Styling
- The admin panel uses Material-UI components
- Colors and themes can be customized in the theme configuration
- Responsive design works on mobile and desktop

## Troubleshooting

### Common Issues

1. **Admin user not created**:
   - Ensure MongoDB is running
   - Check if admin user already exists
   - Verify the script ran successfully

2. **Cannot access admin panel**:
   - Verify you're logged in with admin credentials
   - Check browser console for errors
   - Ensure backend server is running

3. **API errors**:
   - Check backend server logs
   - Verify JWT token is valid
   - Ensure user has admin role

### Debug Mode
To enable debug logging, add to your `.env` file:
```
DEBUG=true
```

## Next Steps

This admin panel provides a solid foundation for managing your CarPool application. You can extend it with:

1. **Payment Management**: Integrate Razorpay for payment processing
2. **Ride Management**: Add ride approval/rejection features
3. **Analytics**: Add charts and detailed reporting
4. **Notifications**: Add email/SMS notifications for admin actions
5. **Audit Logs**: Track all admin actions for security

## Support

If you encounter any issues during setup or have questions about the admin panel, please refer to the main project documentation or create an issue in the project repository.
