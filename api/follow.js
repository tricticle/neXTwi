// api/follow.js
const mongoose = require('mongoose');
const axios = require('axios');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const profileSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.UUID },
    updated_at: { type: Date, required: true },
    username: { type: String, minLength: 3, required: true, unique: true },
    avatar: { type: String },
});

const Profile = mongoose.model('Profile', profileSchema); // Move Profile model definition above followSchema

const followSchema = new mongoose.Schema({
  follower_id: { type: mongoose.Schema.Types.UUID, required: true, unique: true },
  following_id: { type: mongoose.Schema.Types.UUID, required: true },
});

const Follow = mongoose.model('Follow', followSchema);

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { follower_id, following_id } = req.body;
      const follow = new Follow({ follower_id, following_id });
      await follow.save();
      res.status(201).json({ message: 'Follow relationship added successfully' });
    } else if (req.method === 'GET') {
      if (req.query.follower_id) {
        const followerId = req.query.follower_id;
        const followingList = await Follow.find({ follower_id: followerId }, 'following_id').lean();
        const followingIds = followingList.map(entry => entry.following_id);
        
        // Fetch usernames for the following list
        const followingProfiles = await Profile.find({ _id: { $in: followingIds } }, 'username').lean();
        
        res.json(followingProfiles.map(profile => profile.username));
      } else if (req.query.following_id) {
        const followingId = req.query.following_id;
        const followerList = await Follow.find({ following_id: followingId }, 'follower_id').lean();
        const followerIds = followerList.map(entry => entry.follower_id);
        
        // Fetch usernames for the follower list
        const followerProfiles = await Profile.find({ _id: { $in: followerIds } }, 'username').lean();
        
        res.json(followerProfiles.map(profile => profile.username));
      } else {
        res.status(400).json({ error: 'Invalid query parameters' });
      }
    } else if (req.method === 'DELETE') {
      const { follower_id, following_id } = req.body;
      const deletedFollow = await Follow.findOneAndDelete({ follower_id, following_id });
      
      if (deletedFollow) {
        res.json({
          message: 'Follow relationship deleted successfully',
          deletedFollow: {
            follower_id: deletedFollow.follower_id.toString(),
            following_id: deletedFollow.following_id.toString(),
          },
        });
      } else {
        res.status(404).json({ error: 'Follow relationship not found' });
      }
    } else {
      res.status(400).json({ error: 'Invalid request method' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
