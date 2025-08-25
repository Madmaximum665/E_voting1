const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');

// @route   POST api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { fullName, email, password, studentId, year, department } = req.body;

  try {
    // Check if user already exists - check both email and studentId together
    let userByEmail = await User.findOne({ email });
    let userByStudentId = await User.findOne({ studentId });
    
    // Provide specific error messages for each case
    if (userByEmail) {
      console.log(`Registration failed: Email ${email} already exists`);
      return res.status(400).json({ msg: 'User already exists with this email' });
    }

    if (userByStudentId) {
      console.log(`Registration failed: Student ID ${studentId} already exists`);
      return res.status(400).json({ msg: 'Student ID already registered' });
    }

    // Create new user
    user = new User({
      fullName,
      email,
      password,
      studentId,
      year,
      department // Add department here
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();
    console.log(`User registered successfully: ${email}, ${studentId}`);

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if user is approved (for students)
    if (user.role === 'student' && !user.approved) {
      return res.status(403).json({ msg: 'Your account is pending approval' });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users
// @desc    Get all users (for admin)
// @access  Private/Admin
router.get('/', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/:id/approve
// @desc    Approve a student account
// @access  Private/Admin
router.put('/:id/approve', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    user.approved = true;
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', [auth, admin], async (req, res) => {
  const { fullName, email, studentId, department, year, approved } = req.body;
  
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update fields
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (studentId) user.studentId = studentId;
    if (department) user.department = department;
    if (year) user.year = year;
    if (approved !== undefined) user.approved = approved;
    
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/all
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/all', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords from the result
    res.json(users);
  } catch (err) {
    console.error('Error fetching all users:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 