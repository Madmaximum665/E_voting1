const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  year: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'student',
    enum: ['student', 'admin']
  },
  approved: {
    type: Boolean,
    default: false
  },
  department: {
    type: String,
    required: function() { return this.role === 'student'; }, // Conditionally required for students
    enum: ['Engineering', 'AIML', 'Science', 'Arts', 'Commerce', 'Management', 'Other'], // Define allowed departments
    default: function() { return this.role === 'student' ? undefined : ''; } // Default based on role
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  votes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('User', UserSchema); 