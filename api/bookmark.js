// api/bookmark.js
const mongoose = require('mongoose');
const connectDB = require('./db-connection');
const { Bookmark } = require('./database');
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
        const bookmark = new Bookmark({
          _id: new mongoose.Types.UUID(),
          user_id: new mongoose.Types.UUID(user_id),
          tweet_id: new mongoose.Types.UUID(tweet_id),
          created_at: new Date(),
        });

        await bookmark.save();

        return sendSuccess(
          res,
          {
            _id: bookmark._id.toString(),
            user_id: bookmark.user_id.toString(),
            tweet_id: bookmark.tweet_id.toString(),
          },
          201,
          'Bookmark created successfully'
        );
      } catch (err) {
        if (err.code === 11000) {
          return sendError(res, 'Tweet already bookmarked', 409, 'DUPLICATE_BOOKMARK');
        }
        throw err;
      }
    } else if (req.method === 'GET') {
      const { user_id, page = 1, limit = 20 } = req.query;

      if (!user_id) {
        return sendError(res, 'user_id is required', 400, 'MISSING_USER_ID');
      }

      const paginationValidation = validatePagination(page, limit);
      if (!paginationValidation.valid) {
        return sendError(res, paginationValidation.error, 400, 'INVALID_PAGINATION');
      }

      const { page: pageNum, limit: limitNum } = paginationValidation;
      const skip = (pageNum - 1) * limitNum;

      const [bookmarks, totalCount] = await Promise.all([
        Bookmark.find({ user_id: new mongoose.Types.UUID(user_id) })
          .skip(skip)
          .limit(limitNum)
          .sort({ created_at: -1 })
          .lean(),
        Bookmark.countDocuments({ user_id: new mongoose.Types.UUID(user_id) }),
      ]);

      return sendSuccess(res, {
        bookmarks: bookmarks.map(b => ({
          _id: b._id.toString(),
          user_id: b.user_id.toString(),
          tweet_id: b.tweet_id.toString(),
          created_at: b.created_at,
        })),
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

      const deletedBookmark = await Bookmark.findOneAndDelete({
        user_id: new mongoose.Types.UUID(user_id),
        tweet_id: new mongoose.Types.UUID(tweet_id),
      });

      if (!deletedBookmark) {
        return sendError(res, 'Bookmark not found', 404, 'NOT_FOUND');
      }

      return sendSuccess(res, { _id: deletedBookmark._id.toString() }, 200, 'Bookmark removed');
    } else {
      return sendError(res, 'Invalid request method', 400, 'INVALID_METHOD');
    }
  } catch (error) {
    console.error('Bookmark API error:', error);
    return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
};
