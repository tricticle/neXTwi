// api/profile.js
const mongoose = require('mongoose');
const { Profile, Tweet, Reply, Follow } = require('./database');
const axios = require('axios');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { username, avatar } = req.body;

      // Input validation (optional but recommended)
      if (!username) {
        return res.status(400).json({ error: 'Missing required field: username' });
      }

      // Find the profile or create a new one
      let profile = await Profile.findOne({ username });
      if (!profile) {
        profile = new Profile({
          _id: new mongoose.Types.UUID(),
          updated_at: new Date(),
          username,
        });
      }

      // Update avatar only if a new URL is provided
      if (avatar) {
        profile.avatar = avatar;
        await profile.save();
      }

      res.status(201).json({ message: 'Profile added/updated successfully', profile });
    } else if (req.method === 'GET') {
      if (req.query.id || req.query.username) {
        const query = req.query.id ? { _id: req.query.id } : { username: req.query.username };
        const userProfile = await Profile.findOne(query, '-__v').lean();

        if (userProfile) {
          res.json({
            _id: userProfile._id.toString(),
            username: userProfile.username,
            avatar: userProfile.avatar,
          });
        } else {
          res.status(404).json({ error: 'Profile not found' });
        }
      } else {
        // Fetch all profiles
        const profiles = await Profile.find({}, '-__v').lean();
        res.json(profiles.map(profile => ({
          _id: profile._id.toString(),
          username: profile.username,
          avatar: profile.avatar,
        })));
      }
    } else if (req.method === 'DELETE') {
      if (req.query.id) {
        const userId = req.query.id;
        const deletedTweets = await Tweet.deleteMany({ profile_id: new mongoose.Types.UUID(userId) });
        const deletedReply = await Reply.deleteMany({ user_id: new mongoose.Types.UUID(userId) });
        const deletedFollows = await Follow.deleteMany({
          $or: [{ follower_id: userId }, { following_id: userId }],
        });
        const deletedProfile = await Profile.findByIdAndDelete(userId);

        if (deletedProfile) {
          res.json({
            message: "Profile deleted successfully",
            deletedProfile: {
              _id: deletedProfile._id.toString(),
              username: deletedProfile.username,
              avatar: deletedProfile.avatar,
            },
            deletedTweets: deletedTweets.deletedCount,
            deletedReply: deletedReply.deletedCount,
            deletedFollows: deletedFollows.deletedCount,
          });
        } else {
          res.status(404).json({ error: 'Profile not found' });
        }
      } else {
        res.status(400).json({ error: 'User ID is required for profile deletion' });
      }
    } else {
      res.status(400).json({ error: 'Invalid request method' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
