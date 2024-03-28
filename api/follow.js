// api/follow.js

const mongoose = require('mongoose');
const { Follow, Profile } = require('./database');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { follower_id, follower_username, following_id, following_username } = req.body;

      // Check if follower_id and following_id are not the same
      if (follower_id === following_id) {
        return res.status(400).json({ error: 'Follower and following cannot be the same user' });
      }

      // Check if the follow relationship already exists
      const existingFollow = await Follow.findOne({
        follower_id,
        following_id,
      });

      if (existingFollow) {
        return res.status(302).json({ error: 'Follow relationship already exists' });
      }

      // Check if the user IDs exist in the Profile collection
      const followerExists = await Profile.exists({ _id: follower_id });
      const followingExists = await Profile.exists({ _id: following_id });

      if (!followerExists || !followingExists) {
        return res.status(404).json({ error: 'Follower or following user not found' });
      }

      const follow = new Follow({
        _id: new mongoose.Types.UUID(),
        follower_id,
        follower_username,
        following_id,
        following_username,
        created_at: new Date(),
      });

      await follow.save();
      res.status(201).json(follow);
    } else if (req.method === 'GET') {
      if (req.query.follower_id && req.query.following_id) {
        const query = {
          follower_id: req.query.follower_id,
          following_id: req.query.following_id,
        };

        const follow = await Follow.findOne(query).lean();

        if (follow) {
          res.json({
            _id: follow._id.toString(),
            follower_id: follow.follower_id,
            follower_username: follow.follower_username,
            following_id: follow.following_id,
            following_username: follow.following_username,
            created_at: follow.created_at,
          });
        } else {
          res.status(404).json({ error: 'Follow relationship not found' });
        }
      } else if (req.query.follower_id) {
    const follower_id = req.query.follower_id;

    const followerFollows = await Follow.find({ follower_id }).lean();

    if (followerFollows.length > 0) {
      res.json(followerFollows);
    } else {
      res.status(404).json({ error: 'No follows found for the given follower ID' });
    }
  } else if (req.query.following_id) {
    const following_id = req.query.following_id;

    const followingFollows = await Follow.find({ following_id }).lean();

    if (followingFollows.length > 0) {
      res.json(followingFollows);
    } else {
      res.status(404).json({ error: 'No follows found for the given following ID' });
    }
  } else {
    const allFollows = await Follow.find().lean();
    res.json(allFollows);
  }
    } else if (req.method === 'DELETE') {
      const { follower_id, following_id } = req.body;

      if (follower_id && following_id) {
        const result = await Follow.deleteOne({ follower_id, following_id });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Follow relationship not found' });
        }

        res.json({ message: 'Follow relationship deleted successfully' });
      } else {
        res.status(400).json({ error: 'Both follower_id and following_id are required for deleting a follow relationship' });
      }
    } else {
      res.status(400).json({ error: 'Invalid request method' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};