const mongoose = require('mongoose');
const { Profile } = require('./database');
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
    } else {
      // Handle other HTTP methods (GET, PUT, DELETE) as needed for profile management
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
