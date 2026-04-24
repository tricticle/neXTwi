// api/websocket-handler.js
/**
 * WebSocket handler for real-time updates
 * Supports: new tweets, likes, comments, follows, notifications
 * 
 * NOTE: Vercel's serverless functions have limitations for WebSockets.
 * For production, consider:
 * 1. Using Socket.io with a dedicated server
 * 2. Using Pusher/Ably for managed WebSocket service
 * 3. Deploying to railway.app or similar with persistent connections
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// In-memory store for active connections
const connections = new Map();
const userConnections = new Map();

/**
 * Authenticate WebSocket connection via token
 */
const authenticateToken = (token) => {
  try {
    if (!process.env.AUTH0_SECRET) {
      console.warn('AUTH0_SECRET not set, skipping validation');
      return { userId: 'anonymous', username: 'anonymous' };
    }

    const decoded = jwt.verify(token, process.env.AUTH0_SECRET);
    return {
      userId: decoded.sub,
      username: decoded.preferred_username || decoded.name,
    };
  } catch (err) {
    console.error('Token validation failed:', err.message);
    return null;
  }
};

/**
 * Broadcast message to specific user's connections
 */
const broadcastToUser = (userId, type, data) => {
  const userSockets = userConnections.get(userId) || [];
  userSockets.forEach(socketId => {
    const connection = connections.get(socketId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({ type, data }));
    }
  });
};

/**
 * Broadcast to all connections (for new tweets, global events)
 */
const broadcastToAll = (type, data, excludeUserId = null) => {
  connections.forEach((connection, socketId) => {
    if (
      connection.ws.readyState === WebSocket.OPEN &&
      connection.user.userId !== excludeUserId
    ) {
      connection.ws.send(JSON.stringify({ type, data }));
    }
  });
};

/**
 * Broadcast to users following the author (for new tweets)
 */
const broadcastToFollowers = (authorId, type, data, followerIds) => {
  followerIds.forEach(followerId => {
    broadcastToUser(followerId, type, data);
  });
};

/**
 * Handle new WebSocket connection
 */
const handleNewConnection = (ws, req) => {
  // Extract token from URL query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(1008, 'Missing authentication token');
    return;
  }

  // Authenticate user
  const user = authenticateToken(token);
  if (!user) {
    ws.close(1008, 'Invalid authentication token');
    return;
  }

  // Generate unique socket ID
  const socketId = `${user.userId}-${Date.now()}-${Math.random()}`;

  // Store connection
  const connection = {
    ws,
    user,
    socketId,
    connectedAt: new Date(),
  };
  connections.set(socketId, connection);

  // Map user to socket for broadcasting
  if (!userConnections.has(user.userId)) {
    userConnections.set(user.userId, []);
  }
  userConnections.get(user.userId).push(socketId);

  console.log(`[WebSocket] User ${user.username} connected (${socketId})`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    data: {
      socketId,
      userId: user.userId,
      username: user.username,
      timestamp: new Date().toISOString(),
    },
  }));

  // Handle incoming messages
  ws.on('message', (rawData) => {
    try {
      const message = JSON.parse(rawData);
      handleMessage(socketId, message, user);
    } catch (err) {
      console.error('[WebSocket] Message parse error:', err);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' },
      }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    connections.delete(socketId);
    const userSockets = userConnections.get(user.userId);
    if (userSockets) {
      const index = userSockets.indexOf(socketId);
      if (index > -1) {
        userSockets.splice(index, 1);
      }
      if (userSockets.length === 0) {
        userConnections.delete(user.userId);
      }
    }
    console.log(`[WebSocket] User ${user.username} disconnected (${socketId})`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('[WebSocket] Connection error:', error);
  });
};

/**
 * Handle incoming WebSocket messages
 */
const handleMessage = (socketId, message, user) => {
  const { type, data } = message;

  switch (type) {
    case 'new_tweet':
      handleNewTweet(user, data);
      break;

    case 'like':
      handleLike(user, data);
      break;

    case 'unlike':
      handleUnlike(user, data);
      break;

    case 'follow':
      handleFollow(user, data);
      break;

    case 'unfollow':
      handleUnfollow(user, data);
      break;

    case 'reply':
      handleReply(user, data);
      break;

    case 'notification:read':
      handleNotificationRead(user, data);
      break;

    case 'ping':
      // Respond to ping to keep connection alive
      const connection = connections.get(socketId);
      if (connection) {
        connection.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
      break;

    default:
      console.warn(`[WebSocket] Unknown message type: ${type}`);
  }
};

/**
 * Handle new tweet event
 */
const handleNewTweet = async (user, data) => {
  try {
    const { tweetId, text, hashtags, createdAt } = data;

    // Get user's followers from database (implement based on your Follow model)
    // const followers = await Follow.find({ following_id: user.userId });
    // const followerIds = followers.map(f => f.follower_id);

    // Broadcast to all users for now (in production, broadcast only to followers)
    broadcastToAll('new_tweet', {
      tweetId,
      authorId: user.userId,
      authorUsername: user.username,
      text,
      hashtags,
      createdAt,
    });

    console.log(`[WebSocket] New tweet from ${user.username}`);
  } catch (err) {
    console.error('[WebSocket] Handle new tweet error:', err);
  }
};

/**
 * Handle like event
 */
const handleLike = async (user, data) => {
  try {
    const { tweetId, tweetAuthorId } = data;

    // Notify tweet author
    broadcastToUser(tweetAuthorId, 'tweet_liked', {
      tweetId,
      likedBy: user.username,
      userId: user.userId,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] ${user.username} liked tweet ${tweetId}`);
  } catch (err) {
    console.error('[WebSocket] Handle like error:', err);
  }
};

/**
 * Handle unlike event
 */
const handleUnlike = async (user, data) => {
  try {
    const { tweetId, tweetAuthorId } = data;

    // Notify tweet author
    broadcastToUser(tweetAuthorId, 'tweet_unliked', {
      tweetId,
      unlikedBy: user.username,
      userId: user.userId,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] ${user.username} unliked tweet ${tweetId}`);
  } catch (err) {
    console.error('[WebSocket] Handle unlike error:', err);
  }
};

/**
 * Handle follow event
 */
const handleFollow = async (user, data) => {
  try {
    const { followingId, followingUsername } = data;

    // Notify user being followed
    broadcastToUser(followingId, 'new_follower', {
      followerId: user.userId,
      followerUsername: user.username,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] ${user.username} followed ${followingUsername}`);
  } catch (err) {
    console.error('[WebSocket] Handle follow error:', err);
  }
};

/**
 * Handle unfollow event
 */
const handleUnfollow = async (user, data) => {
  try {
    const { followingId, followingUsername } = data;

    // Notify user being unfollowed
    broadcastToUser(followingId, 'user_unfollowed', {
      userId: user.userId,
      username: user.username,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] ${user.username} unfollowed ${followingUsername}`);
  } catch (err) {
    console.error('[WebSocket] Handle unfollow error:', err);
  }
};

/**
 * Handle reply event
 */
const handleReply = async (user, data) => {
  try {
    const { replyId, tweetId, tweetAuthorId, replyText } = data;

    // Notify tweet author
    broadcastToUser(tweetAuthorId, 'new_reply', {
      replyId,
      tweetId,
      repliedBy: user.username,
      userId: user.userId,
      text: replyText,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] ${user.username} replied to tweet ${tweetId}`);
  } catch (err) {
    console.error('[WebSocket] Handle reply error:', err);
  }
};

/**
 * Handle notification read event
 */
const handleNotificationRead = async (user, data) => {
  // Could store notification read status in database
  console.log(`[WebSocket] ${user.username} read notification`);
};

/**
 * Export handler for serverless function
 */
module.exports = {
  handleNewConnection,
  broadcastToUser,
  broadcastToAll,
  broadcastToFollowers,
};
