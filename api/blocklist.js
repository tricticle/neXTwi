// api/blocklist.js
const mongoose = require('mongoose');
const { Blocklist } = require('./database');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const blocklistWords = await Blocklist.find({}, 'word');
      res.json(blocklistWords.map(item => item.word));
    } else if (req.method === 'POST') {
      const { word } = req.body;
      const existingWord = await Blocklist.findOne({ word });
      if (existingWord) {
        return res.status(400).json({ error: 'Word already exists in blocklist' });
      }
      const newWord = new Blocklist({ word });
      await newWord.save();
      res.status(201).json(newWord);
    } else if (req.method === 'DELETE') {
      const { word } = req.body;
      const deletedWord = await Blocklist.findOneAndDelete({ word });
      if (!deletedWord) {
        return res.status(404).json({ error: 'Word not found in blocklist' });
      }
      res.json({ message: 'Word deleted successfully' });
    } else {
      res.status(400).json({ error: 'Invalid request method' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};