const mongoose = require('mongoose');
const { User } = require('./db');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = async (req, res) => {
  try {
    const { method, body, query } = req;

    if (method === 'POST') {
      // Create a new user profile
      const { username, name, email, bio, profilePicture } = body;
      const user = new User({
        username,
        name,
        email,
        bio,
        profilePicture,
      });
      await user.save();
      res.status(201).json({ message: 'Profile added successfully' });
    } else if (method === 'DELETE') {
      // Remove a user by userId
      const userId = query.userId;
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId in query parameters' });
      }

      try {
        const removedUser = await User.findOneAndDelete({ _id: userId });
        if (!removedUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User removed successfully', removedUser });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else if (method === 'PUT') {
      // Update user profile with tweets, bookmarks, likes, followers, and following
      const { userId, action, tweetId } = body;

      try {
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        switch (action) {
          case 'addTweet':
            // Add a new tweet to the user's profile
            const { content, images } = body;
            user.tweets.push({ content, timestamp: new Date(), images });
            break;
          case 'addBookmark':
            // Add a bookmark to the user's profile
            user.bookmarks.push({ userId, tweetId });
            break;
          case 'addLike':
            // Add a like to the user's profile
            user.likes.push({ userId, tweetId });
            break;
          case 'addFollower':
            // Add a follower to the user's profile
            user.followers.push({ userId });
            break;
          case 'addFollowing':
            // Add a following user to the user's profile
            user.following.push({ userId });
            break;
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }

        await user.save();
        res.json({ message: 'Profile updated successfully', user });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      // Handling other requests (GET) to fetch users
      const users = await User.find();
      res.json(users);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
