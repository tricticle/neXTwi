// api/profile.js
const mongoose = require('mongoose');
const connectDB = require('./db-connection');
const { Profile, Tweet, Reply, Follow } = require('./database');
const { sendSuccess, sendError } = require('./utils/response-handler');
const { validateUsername, validatePagination } = require('./utils/validators');

module.exports = async (req, res) => {
  try {
    await connectDB();

    if (req.method === 'POST') {
      const { username, avatar } = req.body;

      // Validate username
      const validation = validateUsername(username);
      if (!validation.valid) {
        return sendError(res, validation.error, 400, 'INVALID_USERNAME');
      }

      // Find or create profile
      let profile = await Profile.findOne({ username });
      if (!profile) {
        profile = new Profile({
          _id: new mongoose.Types.UUID(),
          updated_at: new Date(),
          username,
          avatar,
        });
      } else if (avatar) {
        // Update avatar if provided
        profile.avatar = avatar;
        profile.updated_at = new Date();
      }

      await profile.save();

      return sendSuccess(
        res,
        {
          _id: profile._id.toString(),
          username: profile.username,
          avatar: profile.avatar,
          updated_at: profile.updated_at,
        },
        201,
        'Profile created/updated successfully'
      );
    } else if (req.method === 'GET') {
      if (req.query.id || req.query.username) {
        const query = req.query.id 
          ? { _id: req.query.id } 
          : { username: req.query.username };
        
        const userProfile = await Profile.findOne(query).select('-__v').lean();

        if (!userProfile) {
          return sendError(res, 'Profile not found', 404, 'NOT_FOUND');
        }

        return sendSuccess(res, {
          _id: userProfile._id.toString(),
          username: userProfile.username,
          avatar: userProfile.avatar,
          updated_at: userProfile.updated_at,
        });
      } else {
        // Fetch paginated profiles
        const { page = 1, limit = 20 } = req.query;
        const paginationValidation = validatePagination(page, limit);
        
        if (!paginationValidation.valid) {
          return sendError(res, paginationValidation.error, 400, 'INVALID_PAGINATION');
        }

        const { page: pageNum, limit: limitNum } = paginationValidation;
        const skip = (pageNum - 1) * limitNum;

        const [profiles, totalCount] = await Promise.all([
          Profile.find()
            .select('-__v')
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Profile.countDocuments(),
        ]);

        return sendSuccess(res, {
          profiles: profiles.map(p => ({
            _id: p._id.toString(),
            username: p.username,
            avatar: p.avatar,
            updated_at: p.updated_at,
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: Math.ceil(totalCount / limitNum),
          },
        });
      }
    } else if (req.method === 'DELETE') {
      if (!req.query.id) {
        return sendError(res, 'User ID is required for deletion', 400, 'MISSING_USER_ID');
      }

      const userId = new mongoose.Types.UUID(req.query.id);

      // Delete cascading data in parallel
      const [deletedTweets, deletedReplies, deletedFollows, deletedProfile] = await Promise.all([
        Tweet.deleteMany({ profile_id: userId }),
        Reply.deleteMany({ user_id: userId }),
        Follow.deleteMany({
          $or: [{ follower_id: userId }, { following_id: userId }],
        }),
        Profile.findByIdAndDelete(userId),
      ]);

      if (!deletedProfile) {
        return sendError(res, 'Profile not found', 404, 'NOT_FOUND');
      }

      return sendSuccess(res, {
        message: 'Profile deleted successfully',
        deletedProfile: {
          _id: deletedProfile._id.toString(),
          username: deletedProfile.username,
        },
        deletedCounts: {
          tweets: deletedTweets.deletedCount,
          replies: deletedReplies.deletedCount,
          follows: deletedFollows.deletedCount,
        },
      });
    } else {
      return sendError(res, 'Invalid request method', 400, 'INVALID_METHOD');
    }
  } catch (error) {
    console.error('Profile API error:', error);
    return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
};
