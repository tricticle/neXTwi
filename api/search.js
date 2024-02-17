// api/search.js
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
      const { query } = req.query;
  
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
  
      // Search for profiles
      const profileResults = await Profile.find({
        username: { $regex: query, $options: 'i' }, // Case-insensitive search
      }).lean();
  
      // Search for tweets
      const tweetResults = await Tweet.find({
        text: { $regex: query, $options: 'i' }, // Case-insensitive search
      }).lean();
  
      res.json({
        profiles: profileResults.map(profile => ({
          _id: profile._id.toString(),
          username: profile.username,
          avatar: profile.avatar,
        })),
        tweets: tweetResults.map(tweet => ({
          _id: tweet._id.toString(),
          text: tweet.text,
          profile_id: tweet.profile_id.toString(),
          created_at: tweet.created_at,
          updated_at: tweet.updated_at,
          hashtags: tweet.hashtags,
          location: tweet.location,
        })),
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };