// api/like.js
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const likeSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.UUID },
  user_id: { type: mongoose.Schema.Types.UUID, required: true },
  tweet_id: { type: mongoose.Schema.Types.UUID, required: true },
  created_at: { type: Date, required: true },
});

const Like = mongoose.model('Like', likeSchema);

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { user_id, tweet_id } = req.body;
      const like = new Like({
        _id: new mongoose.Types.UUID(),
        user_id,
        tweet_id,
        created_at: new Date(),
      });
      await like.save();
      res.status(201).json({ message: 'Like added successfully' });
    } else if (req.method === 'GET') {
      const { user_id } = req.query; // Retrieve user_id from query parameters
      if (user_id) {
        // If user_id is provided, fetch likes only for that user
        const likes = await Like.find({ user_id }).lean();
        const stringifiedLikes = likes.map(like => ({
          ...like,
          user_id: like.user_id.toString(),
          tweet_id: like.tweet_id.toString(),
        }));
        res.json(stringifiedLikes);
      } else {
        // If user_id is not provided, fetch all likes
        const likes = await Like.find().lean();
        const stringifiedLikes = likes.map(like => ({
          ...like,
          user_id: like.user_id.toString(),
          tweet_id: like.tweet_id.toString(),
        }));
        res.json(stringifiedLikes);
      }
    } else if (req.method === 'DELETE') {
      const { user_id, tweet_id } = req.body;
      await Like.findOneAndDelete({ user_id, tweet_id });
      res.json({ message: 'Like deleted successfully' });
    } else {
      res.status(400).json({ error: 'Invalid request method' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
