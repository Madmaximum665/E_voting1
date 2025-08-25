const mongoose = require('mongoose');

const PositionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  maxSelections: {
    type: Number,
    required: true,
    default: 1
  },
  candidates: [{
    name: {
      type: String,
      required: true
    },
    studentId: {
      type: String,
      default: ''
    },
    manifesto: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    votes: {
      type: Number,
      default: 0
    }
  }]
});

const ElectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  positions: [PositionSchema],
  voters: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedPositions: [{
      positionId: String,
      candidateId: String,
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Election', ElectionSchema); 