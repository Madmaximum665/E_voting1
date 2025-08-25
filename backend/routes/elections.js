const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Election = require('../models/Election');
const User = require('../models/User');

// @route   GET api/elections
// @desc    Get all elections
// @access  Public
router.get('/', async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/elections/active
// @desc    Get all active elections
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const elections = await Election.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ createdAt: -1 });
    
    res.json(elections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/elections/:id
// @desc    Get election by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ msg: 'Election not found' });
    }
    
    res.json(election);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Election not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/elections
// @desc    Create a new election
// @access  Private/Admin
router.post('/', [auth, admin], async (req, res) => {
  const { title, description, startDate, endDate, status, positions } = req.body;
  
  try {
    const newElection = new Election({
      title,
      description,
      startDate,
      endDate,
      status: status || 'draft',
      positions: positions || []
    });
    
    const election = await newElection.save();
    res.json(election);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/elections/:id
// @desc    Update an election
// @access  Private/Admin
router.put('/:id', [auth, admin], async (req, res) => {
  const { title, description, startDate, endDate, status, positions } = req.body;
  
  try {
    let election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ msg: 'Election not found' });
    }
    
    // Update fields
    if (title) election.title = title;
    if (description !== undefined) election.description = description;
    if (startDate) election.startDate = startDate;
    if (endDate) election.endDate = endDate;
    if (status) election.status = status;
    if (positions) election.positions = positions;
    
    election.updatedAt = Date.now();
    
    await election.save();
    res.json(election);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/elections/:id
// @desc    Delete an election
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ msg: 'Election not found' });
    }
    
    await Election.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Election removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/elections/:id/vote
// @desc    Vote in an election
// @access  Private
router.post('/:id/vote', auth, async (req, res) => {
  const { positionId, candidateId } = req.body;
  
  try {
    // Check if user is an admin - admins shouldn't vote
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ msg: 'Administrators are not allowed to vote in elections' });
    }
    
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ msg: 'Election not found' });
    }
    
    // Check if election is active
    const now = new Date();
    if (
      election.status !== 'active' ||
      new Date(election.startDate) > now ||
      new Date(election.endDate) < now
    ) {
      return res.status(400).json({ msg: 'Election is not active' });
    }
    
    // Check if user has already voted for this position
    const existingVoter = election.voters.find(
      voter => voter.userId.toString() === req.user.id
    );
    
    if (existingVoter) {
      const alreadyVotedForPosition = existingVoter.votedPositions.some(
        vote => vote.positionId === positionId
      );
      
      if (alreadyVotedForPosition) {
        return res.status(400).json({ msg: 'You have already voted for this position' });
      }
    }
    
    // Find position and candidate
    const position = election.positions.id(positionId);
    if (!position) {
      return res.status(404).json({ msg: 'Position not found' });
    }
    
    const candidate = position.candidates.find(c => c._id.toString() === candidateId);
    if (!candidate) {
      return res.status(404).json({ msg: 'Candidate not found' });
    }
    
    // Increment candidate votes
    candidate.votes += 1;
    
    // Add voter record
    if (existingVoter) {
      existingVoter.votedPositions.push({
        positionId,
        candidateId,
        votedAt: Date.now()
      });
    } else {
      election.voters.push({
        userId: req.user.id,
        votedPositions: [{
          positionId,
          candidateId,
          votedAt: Date.now()
        }]
      });
    }
    
    await election.save();

    // Now, update the User model with the vote information
    if (!user.votes || typeof user.votes !== 'object') {
      user.votes = {};
    }
    if (!user.votes[req.params.id] || typeof user.votes[req.params.id] !== 'object') {
      user.votes[req.params.id] = {};
    }
    user.votes[req.params.id][positionId] = candidateId;
    user.markModified('votes'); // Important for Mixed types
    await user.save();
    
    res.json({ msg: 'Vote cast successfully', election, userVotes: user.votes }); // Send back updated user votes for debugging/confirmation
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/elections/:id/results
// @desc    Get election results
// @access  Public (could be restricted if needed)
router.get('/:id/results', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ msg: 'Election not found' });
    }
    
    // Format results
    const results = election.positions.map(position => {
      return {
        positionId: position._id,
        title: position.title,
        candidates: position.candidates.map(candidate => {
          return {
            candidateId: candidate._id,
            name: candidate.name,
            votes: candidate.votes
          };
        }).sort((a, b) => b.votes - a.votes) // Sort by votes in descending order
      };
    });
    
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 