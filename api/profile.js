// api/profile.js
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

const Profile = mongoose.model('Profile', profileSchema);

const tweetSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.UUID },
  text: { type: String, required: true },
  profile_id: { type: mongoose.Schema.Types.UUID, required: true },
  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true },
  hashtags: [{ type: String }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      index: '2dsphere',
    },
    placeName: String,
  },
});

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { username, avatar } = req.body;
      const profile = new Profile({
        _id: new mongoose.Types.UUID(),
        updated_at: new Date(),
        username,
        avatar,
      });
      await profile.save();
      res.status(201).json({ message: 'Profile added successfully' });
    } else if (req.method === 'GET') {
      if (req.query.id || req.query.username) {
        // Fetch profile by ID or username
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

        // Delete tweets posted by the user
        const deletedTweets = await Tweet.deleteMany({ profile_id: new mongoose.Types.UUID(userId) });

        // Delete the user profile
        const deletedProfile = await Profile.findByIdAndDelete(userId);

        if (deletedProfile) {
          res.json({
            message: 'Profile deleted successfully',
            deletedProfile: {
              _id: deletedProfile._id.toString(),
              username: deletedProfile.username,
              avatar: deletedProfile.avatar,
            },
            deletedTweets: deletedTweets.deletedCount, // Number of deleted tweets
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
