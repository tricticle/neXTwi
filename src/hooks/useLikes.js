// src/hooks/useLikes.js
import { useCallback, useState } from 'react';
import api from '../services/api';

/**
 * Custom hook for managing likes with optimistic updates
 */
export const useLikes = () => {
  const [likedTweets, setLikedTweets] = useState(new Set());
  const [likeCount, setLikeCount] = useState({});
  const [error, setError] = useState(null);

  // Check if tweet is liked by user
  const isLiked = useCallback((tweetId, userId) => {
    return likedTweets.has(`${userId}:${tweetId}`);
  }, [likedTweets]);

  // Like tweet with optimistic update
  const likeTweet = useCallback(async (userId, tweetId) => {
    const key = `${userId}:${tweetId}`;
    
    // Optimistic update
    setLikedTweets(prev => new Set([...prev, key]));
    setLikeCount(prev => ({
      ...prev,
      [tweetId]: (prev[tweetId] || 0) + 1,
    }));

    try {
      setError(null);
      await api.likes.create(userId, tweetId);
      return true;
    } catch (err) {
      // Rollback on error
      console.error('Like error:', err);
      setLikedTweets(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      setLikeCount(prev => ({
        ...prev,
        [tweetId]: Math.max(0, (prev[tweetId] || 1) - 1),
      }));
      setError(err.message);
      throw err;
    }
  }, []);

  // Unlike tweet with optimistic update
  const unlikeTweet = useCallback(async (userId, tweetId) => {
    const key = `${userId}:${tweetId}`;

    // Optimistic update
    setLikedTweets(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
    setLikeCount(prev => ({
      ...prev,
      [tweetId]: Math.max(0, (prev[tweetId] || 1) - 1),
    }));

    try {
      setError(null);
      await api.likes.delete(userId, tweetId);
      return true;
    } catch (err) {
      // Rollback on error
      console.error('Unlike error:', err);
      setLikedTweets(prev => new Set([...prev, key]));
      setLikeCount(prev => ({
        ...prev,
        [tweetId]: (prev[tweetId] || 0) + 1,
      }));
      setError(err.message);
      throw err;
    }
  }, []);

  // Toggle like status
  const toggleLike = useCallback(async (userId, tweetId) => {
    if (isLiked(tweetId, userId)) {
      return unlikeTweet(userId, tweetId);
    } else {
      return likeTweet(userId, tweetId);
    }
  }, [isLiked, likeTweet, unlikeTweet]);

  // Initialize likes from API
  const initializeLikes = useCallback(async (userId) => {
    try {
      const response = await api.likes.list(userId);
      if (response.data && response.data.likes) {
        const likeSet = new Set(
          response.data.likes.map(l => `${l.user_id}:${l.tweet_id}`)
        );
        setLikedTweets(likeSet);

        // Aggregate like counts
        const counts = {};
        response.data.likes.forEach(l => {
          counts[l.tweet_id] = (counts[l.tweet_id] || 0) + 1;
        });
        setLikeCount(counts);
      }
    } catch (err) {
      console.error('Initialize likes error:', err);
      setError(err.message);
    }
  }, []);

  return {
    likedTweets,
    likeCount,
    error,
    isLiked,
    likeTweet,
    unlikeTweet,
    toggleLike,
    initializeLikes,
  };
};
