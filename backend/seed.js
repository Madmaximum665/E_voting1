const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing users
    await User.deleteMany({});
    console.log('Existing users cleared');

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      studentId: 'ADMIN001',
      year: 'N/A',
      role: 'admin',
      approved: true
    });

    await admin.save();
    console.log('Admin user created');

    // Create a test student user
    const studentSalt = await bcrypt.genSalt(10);
    const studentHashedPassword = await bcrypt.hash('student123', salt);

    const student = new User({
      fullName: 'Test Student',
      email: 'student@example.com',
      password: studentHashedPassword,
      studentId: 'S12345',
      year: '2nd Year',
      role: 'student',
      approved: true,
      department: 'Computer Science'
    });

    await student.save();
    console.log('Test student user created');

    console.log('Database seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase(); 