// api/tweet.js
const mongoose = require('mongoose');
const axios = require('axios');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const tweetSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.UUID },
  text: { type: String, required: true },
  profile_id: { type: mongoose.Schema.Types.UUID, required: true },
  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true },
  hashtags: [{ type: String }], // Array of hashtag strings
  location: {
    type: {
      type: String,
      enum: ['Point'], // Enable only 'Point' type for geolocation
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere', // Create a 2dsphere index for geolocation queries
    },
    placeName: String, // New field to store the place name
  },
});

const Tweet = mongoose.model('Tweet', tweetSchema);

const getPlaceName = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );

    const place = response.data;
    if (place.locality) {
      // Example: extracting the name of the locality (city)
      return place.locality;
    }

    return null;
  } catch (error) {
    console.error('Error fetching place name:', error);
    return null;
  }
};

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { text, profile_id, hashtags, location } = req.body;
      const tweet = new Tweet({
        _id: new mongoose.Types.UUID(),
        text,
        profile_id,
        created_at: new Date(),
        updated_at: new Date(),
        hashtags,
        location,
      });

      // Check if location is provided
      if (location && location.coordinates && location.coordinates.length === 2) {
        const [longitude, latitude] = location.coordinates;
        const placeName = await getPlaceName(latitude, longitude);
        tweet.location.placeName = placeName;
      }

      await tweet.save();
      res.status(201).json({ message: 'Tweet added successfully' });
    } else if (req.method === 'GET') {
      // Update the logic to fetch tweets for a specific user
      const { profile_id } = req.query;
      const query = profile_id ? { profile_id: new mongoose.Types.UUID(profile_id) } : {};
      const tweets = await Tweet.find(query);

      // Convert _id and profile_id to strings
      const tweetsWithStrings = tweets.map(tweet => ({
        ...tweet._doc,
        _id: tweet._id.toString(),
        profile_id: tweet.profile_id.toString(),
      }));

      res.json(tweetsWithStrings);
    } else if (req.method === 'DELETE') {
      const { tweet_id } = req.body;
      if (!tweet_id) {
        return res.status(400).json({ error: 'tweet_id is required for deletion' });
      }

      const deletedTweet = await Tweet.findByIdAndDelete(tweet_id);
      if (!deletedTweet) {
        return res.status(404).json({ error: 'Tweet not found' });
      }

      res.json({ message: 'Tweet deleted successfully' });
    } else {
      res.status(400).json({ error: 'Invalid request method' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
