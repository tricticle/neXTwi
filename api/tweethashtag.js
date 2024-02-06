// api/tweethashtag.js
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const tweetHashtagSchema = new mongoose.Schema({
  tweet_id: { type: mongoose.Schema.Types.UUID, required: true },
  hashtag_id: { type: mongoose.Schema.Types.UUID, required: true },
});

const TweetHashtag = mongoose.model('TweetHashtag', tweetHashtagSchema);

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      // Handle adding data for tweetHashtags
      const { tweet_id, hashtag_id } = req.body;
      const tweetHashtag = new TweetHashtag({
        tweet_id,
        hashtag_id,
      });
      await tweetHashtag.save();
      res.status(201).json({ message: 'TweetHashtag added successfully' });
    } else if (req.method === 'GET') {
      const tweethashtags = await TweetHashtag.find().lean(); // Use .lean() to convert to plain JavaScript objects
      const stringifiedTweethashtags = tweethashtags.map(tweethashtag => ({
        ...tweethashtag,
        tweet_id: tweethashtag.tweet_id.toString(),
        hashtag_id: tweethashtag.hashtag_id.toString(),
      }));
      res.json(stringifiedTweethashtags);
    } else {
      res.status(400).json({ error: 'Invalid request method' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
