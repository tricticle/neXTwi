// api/bookmark.js
const mongoose = require('mongoose');
const { Bookmark } = require('./database');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { user_id, tweet_id } = req.body;
      const bookmark = new Bookmark({
        _id: new mongoose.Types.UUID(),
        user_id,
        tweet_id,
        created_at: new Date(),
      });
      await bookmark.save();
      res.status(201).json({ message: 'Bookmark added successfully' });
    } else if (req.method === 'GET') {
      const { user_id } = req.query; // Extract user_id from query parameters
      const bookmarks = await Bookmark.find({ user_id }).lean(); // Only fetch bookmarks for the current user
      const stringifiedBookmarks = bookmarks.map(bookmark => ({
        ...bookmark,
        user_id: bookmark.user_id.toString(),
        tweet_id: bookmark.tweet_id.toString(),
      }));
      res.json(stringifiedBookmarks);
    } else if (req.method === 'DELETE') {
      const { user_id, tweet_id } = req.body;
      await Bookmark.findOneAndDelete({ user_id, tweet_id });
      res.json({ message: 'Bookmark deleted successfully' });
    } else {
      res.status(400).json({ error: 'Invalid request method' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
