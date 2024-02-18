// api/search.js
const mongoose = require('mongoose');
const axios = require('axios');
const { Profile, Tweet } = require('./database');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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