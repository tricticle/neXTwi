// api/follow.js

const mongoose = require('mongoose');
const connectDB = require('./db-connection');
const { Follow, Profile } = require('./database');
const { sendSuccess, sendError } = require('./utils/response-handler');
const { validatePagination } = require('./utils/validators');

module.exports = async (req, res) => {
  try {
    await connectDB();

    if (req.method === 'POST') {
      const { follower_id, follower_username, following_id, following_username } = req.body;

      if (!follower_id || !following_id) {
        return sendError(res, 'follower_id and following_id are required', 400, 'MISSING_FIELDS');
      }

      // Prevent self-follow
      if (follower_id === following_id) {
        return sendError(res, 'Cannot follow yourself', 400, 'SELF_FOLLOW');
      }

      // Validate users exist
      const [followerExists, followingExists] = await Promise.all([
        Profile.exists({ _id: new mongoose.Types.UUID(follower_id) }),
        Profile.exists({ _id: new mongoose.Types.UUID(following_id) }),
      ]);

      if (!followerExists || !followingExists) {
        return sendError(res, 'One or both users do not exist', 404, 'USER_NOT_FOUND');
      }

      try {
        const follow = new Follow({
          _id: new mongoose.Types.UUID(),
          follower_id: new mongoose.Types.UUID(follower_id),
          follower_username: follower_username || '',
          following_id: new mongoose.Types.UUID(following_id),
          following_username: following_username || '',
          created_at: new Date(),
        });

        await follow.save();

        return sendSuccess(
          res,
          {
            _id: follow._id.toString(),
            follower_id: follow.follower_id.toString(),
            following_id: follow.following_id.toString(),
          },
          201,
          'Followed successfully'
        );
      } catch (err) {
        if (err.code === 11000) {
          return sendError(res, 'Already following this user', 409, 'DUPLICATE_FOLLOW');
        }
        throw err;
      }
    } else if (req.method === 'GET') {
      const { follower_id, following_id, page = 1, limit = 20 } = req.query;

      const paginationValidation = validatePagination(page, limit);
      if (!paginationValidation.valid) {
        return sendError(res, paginationValidation.error, 400, 'INVALID_PAGINATION');
      }

      const { page: pageNum, limit: limitNum } = paginationValidation;
      const skip = (pageNum - 1) * limitNum;

      // Both IDs provided - check specific relationship
      if (follower_id && following_id) {
        const follow = await Follow.findOne({
          follower_id: new mongoose.Types.UUID(follower_id),
          following_id: new mongoose.Types.UUID(following_id),
        }).lean();

        if (!follow) {
          return sendError(res, 'Follow relationship not found', 404, 'NOT_FOUND');
        }

        return sendSuccess(res, {
          _id: follow._id.toString(),
          follower_id: follow.follower_id.toString(),
          following_id: follow.following_id.toString(),
          created_at: follow.created_at,
        });
      }

      // Build query for paginated results
      const query = {};
      if (follower_id) {
        query.follower_id = new mongoose.Types.UUID(follower_id);
      }
      if (following_id) {
        query.following_id = new mongoose.Types.UUID(following_id);
      }

      const [follows, totalCount] = await Promise.all([
        Follow.find(query)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Follow.countDocuments(query),
      ]);

      return sendSuccess(res, {
        follows: follows.map(f => ({
          _id: f._id.toString(),
          follower_id: f.follower_id.toString(),
          following_id: f.following_id.toString(),
          created_at: f.created_at,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      });
    } else if (req.method === 'DELETE') {
      const { follower_id, following_id } = req.body;

      if (!follower_id || !following_id) {
        return sendError(res, 'follower_id and following_id are required', 400, 'MISSING_FIELDS');
      }

      const result = await Follow.deleteOne({
        follower_id: new mongoose.Types.UUID(follower_id),
        following_id: new mongoose.Types.UUID(following_id),
      });

      if (result.deletedCount === 0) {
        return sendError(res, 'Follow relationship not found', 404, 'NOT_FOUND');
      }

      return sendSuccess(res, {}, 200, 'Unfollowed successfully');
    } else {
      return sendError(res, 'Invalid request method', 400, 'INVALID_METHOD');
    }
  } catch (error) {
    console.error('Follow API error:', error);
    return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
};
