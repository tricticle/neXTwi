// src/services/api.js
/**
 * Centralized API service with error handling, retries, and caching
 */

const API_BASE = '/api';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default
const cache = new Map();

/**
 * Get cached value if not expired
 */
const getFromCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

/**
 * Set cache with TTL
 */
const setCache = (key, value, ttl = CACHE_TTL) => {
  cache.set(key, {
    value,
    expiry: Date.now() + ttl,
  });
};

/**
 * Clear cache by pattern
 */
const clearCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

/**
 * Fetch with retry logic
 */
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  const maxRetries = retries;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        const err = new Error(error.error || `HTTP ${response.status}`);
        err.status = response.status;
        err.code = error.code;
        err.details = error.details;
        throw err;
      }

      return await response.json();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      if (isLastAttempt) {
        throw error;
      }
      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = Math.pow(2, attempt) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * API request wrapper
 */
const request = async (endpoint, options = {}, useCache = false) => {
  const cacheKey = `${endpoint}:${JSON.stringify(options.body || {})}`;

  if (useCache && options.method !== 'POST' && options.method !== 'DELETE') {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetchWithRetry(url, options);

  if (useCache) {
    setCache(cacheKey, response);
  }

  return response;
};

// ============ TWEET OPERATIONS ============

const tweets = {
  /**
   * Fetch tweets with pagination
   */
  list: async (profileId = null, page = 1, limit = 20) => {
    const params = new URLSearchParams();
    if (profileId) params.append('profile_id', profileId);
    params.append('page', page);
    params.append('limit', limit);
    
    return request(`/tweet?${params}`, { method: 'GET' }, true);
  },

  /**
   * Create new tweet
   */
  create: async (text, profileId, hashtags = [], location = null) => {
    const response = await request('/tweet', {
      method: 'POST',
      body: JSON.stringify({ text, profile_id: profileId, hashtags, location }),
    });
    clearCache('tweet');
    return response;
  },

  /**
   * Delete tweet
   */
  delete: async (tweetId) => {
    const response = await request('/tweet', {
      method: 'DELETE',
      body: JSON.stringify({ tweet_id: tweetId }),
    });
    clearCache('tweet');
    return response;
  },
};

// ============ PROFILE OPERATIONS ============

const profiles = {
  /**
   * Get single profile
   */
  get: async (id = null, username = null) => {
    const params = new URLSearchParams();
    if (id) params.append('id', id);
    if (username) params.append('username', username);
    
    return request(`/profile?${params}`, { method: 'GET' }, true);
  },

  /**
   * List profiles with pagination
   */
  list: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    return request(`/profile?${params}`, { method: 'GET' }, true);
  },

  /**
   * Create or update profile
   */
  createOrUpdate: async (username, avatar = null) => {
    const response = await request('/profile', {
      method: 'POST',
      body: JSON.stringify({ username, avatar }),
    });
    clearCache('profile');
    return response;
  },

  /**
   * Delete profile
   */
  delete: async (userId) => {
    const response = await request(`/profile?id=${userId}`, {
      method: 'DELETE',
    });
    clearCache('profile');
    return response;
  },
};

// ============ LIKE OPERATIONS ============

const likes = {
  /**
   * Get likes
   */
  list: async (userId = null, tweetId = null, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (userId) params.append('user_id', userId);
    if (tweetId) params.append('tweet_id', tweetId);
    
    return request(`/like?${params}`, { method: 'GET' }, true);
  },

  /**
   * Like a tweet
   */
  create: async (userId, tweetId) => {
    const response = await request('/like', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, tweet_id: tweetId }),
    });
    clearCache('like');
    clearCache('tweet');
    return response;
  },

  /**
   * Unlike a tweet
   */
  delete: async (userId, tweetId) => {
    const response = await request('/like', {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId, tweet_id: tweetId }),
    });
    clearCache('like');
    clearCache('tweet');
    return response;
  },
};

// ============ REPLY OPERATIONS ============

const replies = {
  /**
   * Get replies
   */
  list: async (tweetId = null, replyId = null, userId = null, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (tweetId) params.append('tweet_id', tweetId);
    if (replyId) params.append('reply_id', replyId);
    if (userId) params.append('user_id', userId);
    
    return request(`/reply?${params}`, { method: 'GET' }, true);
  },

  /**
   * Create reply
   */
  create: async (text, userId, tweetId = null, replyId = null) => {
    const response = await request('/reply', {
      method: 'POST',
      body: JSON.stringify({ text, user_id: userId, tweet_id: tweetId, reply_id: replyId }),
    });
    clearCache('reply');
    clearCache('tweet');
    return response;
  },
};

// ============ FOLLOW OPERATIONS ============

const follows = {
  /**
   * Get follow relationship
   */
  get: async (followerId, followingId) => {
    const params = new URLSearchParams({ follower_id: followerId, following_id: followingId });
    return request(`/follow?${params}`, { method: 'GET' }, true);
  },

  /**
   * Get followers/following with pagination
   */
  list: async (followerId = null, followingId = null, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (followerId) params.append('follower_id', followerId);
    if (followingId) params.append('following_id', followingId);
    
    return request(`/follow?${params}`, { method: 'GET' }, true);
  },

  /**
   * Follow user
   */
  create: async (followerId, followerUsername, followingId, followingUsername) => {
    const response = await request('/follow', {
      method: 'POST',
      body: JSON.stringify({ 
        follower_id: followerId, 
        follower_username: followerUsername,
        following_id: followingId,
        following_username: followingUsername,
      }),
    });
    clearCache('follow');
    return response;
  },

  /**
   * Unfollow user
   */
  delete: async (followerId, followingId) => {
    const response = await request('/follow', {
      method: 'DELETE',
      body: JSON.stringify({ follower_id: followerId, following_id: followingId }),
    });
    clearCache('follow');
    return response;
  },
};

// ============ BOOKMARK OPERATIONS ============

const bookmarks = {
  /**
   * Get bookmarks
   */
  list: async (userId, page = 1, limit = 20) => {
    const params = new URLSearchParams({ user_id: userId, page, limit });
    return request(`/bookmark?${params}`, { method: 'GET' }, true);
  },

  /**
   * Create bookmark
   */
  create: async (userId, tweetId) => {
    const response = await request('/bookmark', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, tweet_id: tweetId }),
    });
    clearCache('bookmark');
    return response;
  },

  /**
   * Delete bookmark
   */
  delete: async (userId, tweetId) => {
    const response = await request('/bookmark', {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId, tweet_id: tweetId }),
    });
    clearCache('bookmark');
    return response;
  },
};

// ============ SEARCH OPERATIONS ============

const search = {
  /**
   * Search profiles and tweets
   */
  all: async (query, page = 1, limit = 20) => {
    const params = new URLSearchParams({ query, page, limit });
    return request(`/search?${params}`, { method: 'GET' }, true);
  },
};

// ============ CACHE MANAGEMENT ============

const cache_ops = {
  clear: (pattern) => clearCache(pattern || ''),
  clearAll: () => cache.clear(),
};

export default {
  tweets,
  profiles,
  likes,
  replies,
  follows,
  bookmarks,
  search,
  cache: cache_ops,
};
