// api/tweet.js
const mongoose = require('mongoose');
const axios = require('axios');
const connectDB = require('./db-connection');
const { Tweet, Like, Reply, Bookmark, Blocklist, Profile } = require('./database');
const { sendSuccess, sendError } = require('./utils/response-handler');
const { validateTweetText, validatePagination } = require('./utils/validators');

const getPlaceName = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { timeout: 5000 }
    );

    const place = response.data;
    if (place.locality) {
      return place.locality;
    }

    return null;
  } catch (error) {
    console.error('Error fetching place name:', error.message);
    return null;
  }
};

module.exports = async (req, res) => {
  try {
    await connectDB();

    if (req.method === 'POST') {
      const { text, profile_id, hashtags, location } = req.body;

      // Validate input
      const textValidation = validateTweetText(text);
      if (!textValidation.valid) {
        return sendError(res, textValidation.error, 400, 'INVALID_TEXT');
      }

      if (!profile_id) {
        return sendError(res, 'profile_id is required', 400, 'MISSING_PROFILE_ID');
      }

      // Check blocklist
      const blocklistWords = await Blocklist.find({}, 'word').lean();
      const blockedWords = blocklistWords.map((item) => item.word);
      const blockedWord = blockedWords.find((word) => text.includes(word));

      if (blockedWord) {
        return sendError(res, `Tweet contains blocked word: "${blockedWord}"`, 400, 'BLOCKED_WORD');
      }

      const tweet = new Tweet({
        _id: new mongoose.Types.UUID(),
        text,
        profile_id: new mongoose.Types.UUID(profile_id),
        created_at: new Date(),
        updated_at: new Date(),
        hashtags: hashtags || [],
        location,
      });

      // Fetch place name if location is provided
      if (location && location.coordinates && location.coordinates.length === 2) {
        const [longitude, latitude] = location.coordinates;
        const placeName = await getPlaceName(latitude, longitude);
        if (placeName) {
          tweet.location.placeName = placeName;
        }
      }

      await tweet.save();
      return sendSuccess(
        res,
        { _id: tweet._id.toString(), ...tweet._doc },
        201,
        'Tweet created successfully'
      );
    } else if (req.method === 'GET') {
      const { profile_id, page = 1, limit = 20 } = req.query;

      // Validate pagination
      const paginationValidation = validatePagination(page, limit);
      if (!paginationValidation.valid) {
        return sendError(res, paginationValidation.error, 400, 'INVALID_PAGINATION');
      }

      const { page: pageNum, limit: limitNum } = paginationValidation;
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const matchStage = profile_id
        ? { $match: { profile_id: new mongoose.Types.UUID(profile_id) } }
        : { $match: {} };

      // Use aggregation to join with Profile and optimize query
      const tweets = await Tweet.aggregate([
        matchStage,
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'profiles',
            localField: 'profile_id',
            foreignField: '_id',
            as: 'profile',
          },
        },
        { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      ]);

      // Get total count for pagination
      const totalCount = await Tweet.countDocuments(
        profile_id ? { profile_id: new mongoose.Types.UUID(profile_id) } : {}
      );

      const tweetsWithStrings = tweets.map(tweet => ({
        _id: tweet._id.toString(),
        text: tweet.text,
        profile_id: tweet.profile_id.toString(),
        created_at: tweet.created_at,
        updated_at: tweet.updated_at,
        hashtags: tweet.hashtags || [],
        location: tweet.location,
        profile: tweet.profile ? {
          _id: tweet.profile._id.toString(),
          username: tweet.profile.username,
          avatar: tweet.profile.avatar,
        } : null,
      }));

      return sendSuccess(res, {
        tweets: tweetsWithStrings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      });
    } else if (req.method === 'DELETE') {
      const { tweet_id } = req.body;

      if (!tweet_id) {
        return sendError(res, 'tweet_id is required for deletion', 400, 'MISSING_TWEET_ID');
      }

      // Delete associated data
      await Promise.all([
        Like.deleteMany({ tweet_id: new mongoose.Types.UUID(tweet_id) }),
        Reply.deleteMany({ tweet_id: new mongoose.Types.UUID(tweet_id) }),
        Bookmark.deleteMany({ tweet_id: new mongoose.Types.UUID(tweet_id) }),
      ]);

      const deletedTweet = await Tweet.findByIdAndDelete(tweet_id);
      if (!deletedTweet) {
        return sendError(res, 'Tweet not found', 404, 'NOT_FOUND');
      }

      return sendSuccess(res, { _id: tweet_id }, 200, 'Tweet deleted successfully');
    } else {
      return sendError(res, 'Invalid request method', 400, 'INVALID_METHOD');
    }
  } catch (error) {
    console.error('Tweet API error:', error);
    return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
};
