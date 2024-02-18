// api/hashtag.js
const mongoose = require('mongoose');
const { Hashtag } = require('./database');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const hashtagSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.UUID },
  name: { type: String, required: true },
});

const Hashtag = mongoose.model('Hashtag', hashtagSchema);

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { name } = req.body;
      const hashtag = new Hashtag({
        _id: new mongoose.Types.UUID(),
        name,
      });
      await hashtag.save();
      res.status(201).json({ message: 'Hashtag added successfully' });
    } else if (req.method === 'GET') {
      const hashtags = await Hashtag.find().lean(); // Use .lean() to convert to plain JavaScript objects
      const stringifiedHashtags = hashtags.map(hashtag => ({
        ...hashtag,
        _id: hashtag._id.toString(),
      }));
      res.json(stringifiedHashtags);
    } else {
      res.status(400).json({ error: 'Invalid request method' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
