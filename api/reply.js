// api/reply.js
const mongoose = require('mongoose');
const connectDB = require('./db-connection');
const { Reply } = require('./database');
const { sendSuccess, sendError } = require('./utils/response-handler');
const { validateTweetText, validatePagination } = require('./utils/validators');

module.exports = async (req, res) => {
  try {
    await connectDB();

    if (req.method === 'POST') {
      const { text, user_id, tweet_id, reply_id } = req.body;

      // Validate input
      const textValidation = validateTweetText(text);
      if (!textValidation.valid) {
        return sendError(res, textValidation.error, 400, 'INVALID_TEXT');
      }

      if (!user_id) {
        return sendError(res, 'user_id is required', 400, 'MISSING_USER_ID');
      }

      if (!tweet_id && !reply_id) {
        return sendError(res, 'tweet_id or reply_id is required', 400, 'MISSING_CONTEXT');
      }

      const reply = new Reply({
        _id: new mongoose.Types.UUID(),
        text,
        user_id: new mongoose.Types.UUID(user_id),
        tweet_id: tweet_id ? new mongoose.Types.UUID(tweet_id) : null,
        reply_id: reply_id ? new mongoose.Types.UUID(reply_id) : null,
      });

      await reply.save();

      return sendSuccess(
        res,
        {
          _id: reply._id.toString(),
          text: reply.text,
          user_id: reply.user_id.toString(),
          tweet_id: reply.tweet_id?.toString() || null,
          reply_id: reply.reply_id?.toString() || null,
        },
        201,
        'Reply created successfully'
      );
    } else if (req.method === 'GET') {
      const { tweet_id, reply_id, user_id, page = 1, limit = 20 } = req.query;

      const paginationValidation = validatePagination(page, limit);
      if (!paginationValidation.valid) {
        return sendError(res, paginationValidation.error, 400, 'INVALID_PAGINATION');
      }

      const { page: pageNum, limit: limitNum } = paginationValidation;
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query = {};
      if (tweet_id) {
        query.tweet_id = new mongoose.Types.UUID(tweet_id);
      }
      if (reply_id) {
        query.reply_id = new mongoose.Types.UUID(reply_id);
      }
      if (user_id) {
        query.user_id = new mongoose.Types.UUID(user_id);
      }

      const [replies, totalCount] = await Promise.all([
        Reply.find(query)
          .skip(skip)
          .limit(limitNum)
          .sort({ _id: -1 })
          .lean(),
        Reply.countDocuments(query),
      ]);

      const stringifiedReplies = replies.map(reply => ({
        _id: reply._id.toString(),
        text: reply.text,
        user_id: reply.user_id.toString(),
        tweet_id: reply.tweet_id?.toString() || null,
        reply_id: reply.reply_id?.toString() || null,
      }));

      return sendSuccess(res, {
        replies: stringifiedReplies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      });
    } else {
      return sendError(res, 'Invalid request method', 400, 'INVALID_METHOD');
    }
  } catch (error) {
    console.error('Reply API error:', error);
    return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
};
