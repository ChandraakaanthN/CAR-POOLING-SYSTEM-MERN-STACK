const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/carpool-main');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@carpool.com'.toLowerCase() });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('If you need to reset the password, delete the existing admin user first.');
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@carpool.com'.toLowerCase(),
      password: 'Admin@123',
      phone: '9876543210',
      license: 'ADMIN123456',
      gender: 'Other',
      role: 'admin',
      isActive: true
    };

    // Hash password
    const passwordHash = await bcrypt.hash(adminData.password, 10);
    adminData.password = passwordHash;

    // Create user
    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('Admin user created successfully!');
    console.log('Email: admin@carpool.com');
    console.log('Password: Admin@123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdminUser();
