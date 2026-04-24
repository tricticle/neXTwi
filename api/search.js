// api/search.js
const mongoose = require('mongoose');
const connectDB = require('./db-connection');
const { Profile, Tweet } = require('./database');
const { sendSuccess, sendError } = require('./utils/response-handler');
const { validatePagination } = require('./utils/validators');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      return sendError(res, 'Search query is required', 400, 'MISSING_QUERY');
    }

    const paginationValidation = validatePagination(page, limit);
    if (!paginationValidation.valid) {
      return sendError(res, paginationValidation.error, 400, 'INVALID_PAGINATION');
    }

    const { page: pageNum, limit: limitNum } = paginationValidation;
    const skip = (pageNum - 1) * limitNum;

    // Search profiles by username
    const profileResults = await Profile.find(
      { username: { $regex: query, $options: 'i' } },
      { username: 1, avatar: 1 }
    )
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Search tweets by text and hashtags using text index
    const tweetResults = await Tweet.find(
      {
        $or: [
          { text: { $regex: query, $options: 'i' } },
          { hashtags: { $regex: query, $options: 'i' } },
        ],
      },
      { text: 1, profile_id: 1, created_at: 1, hashtags: 1 }
    )
      .skip(skip)
      .limit(limitNum)
      .sort({ created_at: -1 })
      .lean();

    // Get total counts for pagination
    const [profileCount, tweetCount] = await Promise.all([
      Profile.countDocuments({ username: { $regex: query, $options: 'i' } }),
      Tweet.countDocuments({
        $or: [
          { text: { $regex: query, $options: 'i' } },
          { hashtags: { $regex: query, $options: 'i' } },
        ],
      }),
    ]);

    return sendSuccess(res, {
      profiles: {
        items: profileResults.map(profile => ({
          _id: profile._id.toString(),
          username: profile.username,
          avatar: profile.avatar,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: profileCount,
          pages: Math.ceil(profileCount / limitNum),
        },
      },
      tweets: {
        items: tweetResults.map(tweet => ({
          _id: tweet._id.toString(),
          text: tweet.text,
          profile_id: tweet.profile_id.toString(),
          created_at: tweet.created_at,
          hashtags: tweet.hashtags || [],
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: tweetCount,
          pages: Math.ceil(tweetCount / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
};
