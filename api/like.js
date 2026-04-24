// api/like.js
const mongoose = require('mongoose');
const connectDB = require('./db-connection');
const { Like } = require('./database');
const { sendSuccess, sendError } = require('./utils/response-handler');
const { validatePagination } = require('./utils/validators');

module.exports = async (req, res) => {
  try {
    await connectDB();

    if (req.method === 'POST') {
      const { user_id, tweet_id } = req.body;

      if (!user_id || !tweet_id) {
        return sendError(res, 'user_id and tweet_id are required', 400, 'MISSING_FIELDS');
      }

      try {
        const like = new Like({
          _id: new mongoose.Types.UUID(),
          user_id: new mongoose.Types.UUID(user_id),
          tweet_id: new mongoose.Types.UUID(tweet_id),
          created_at: new Date(),
        });
        await like.save();
        return sendSuccess(
          res,
          {
            _id: like._id.toString(),
            user_id: like.user_id.toString(),
            tweet_id: like.tweet_id.toString(),
          },
          201,
          'Like added successfully'
        );
      } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
          return sendError(res, 'Already liked this tweet', 409, 'DUPLICATE_LIKE');
        }
        throw err;
      }
    } else if (req.method === 'GET') {
      const { user_id, tweet_id, page = 1, limit = 20 } = req.query;

      const paginationValidation = validatePagination(page, limit);
      if (!paginationValidation.valid) {
        return sendError(res, paginationValidation.error, 400, 'INVALID_PAGINATION');
      }

      const { page: pageNum, limit: limitNum } = paginationValidation;
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query = {};
      if (user_id) {
        query.user_id = new mongoose.Types.UUID(user_id);
      }
      if (tweet_id) {
        query.tweet_id = new mongoose.Types.UUID(tweet_id);
      }

      const [likes, totalCount] = await Promise.all([
        Like.find(query).skip(skip).limit(limitNum).lean(),
        Like.countDocuments(query),
      ]);

      const stringifiedLikes = likes.map(like => ({
        _id: like._id.toString(),
        user_id: like.user_id.toString(),
        tweet_id: like.tweet_id.toString(),
        created_at: like.created_at,
      }));

      return sendSuccess(res, {
        likes: stringifiedLikes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      });
    } else if (req.method === 'DELETE') {
      const { user_id, tweet_id } = req.body;

      if (!user_id || !tweet_id) {
        return sendError(res, 'user_id and tweet_id are required', 400, 'MISSING_FIELDS');
      }

      const deletedLike = await Like.findOneAndDelete({
        user_id: new mongoose.Types.UUID(user_id),
        tweet_id: new mongoose.Types.UUID(tweet_id),
      });

      if (!deletedLike) {
        return sendError(res, 'Like not found', 404, 'NOT_FOUND');
      }

      return sendSuccess(res, { _id: deletedLike._id.toString() }, 200, 'Like removed');
    } else {
      return sendError(res, 'Invalid request method', 400, 'INVALID_METHOD');
    }
  } catch (error) {
    console.error('Like API error:', error);
    return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
};
