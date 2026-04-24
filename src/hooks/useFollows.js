// src/hooks/useFollows.js
import { useCallback, useState } from 'react';
import api from '../services/api';

/**
 * Custom hook for managing follow relationships
 */
export const useFollows = () => {
  const [following, setFollowing] = useState(new Set());
  const [followers, setFollowers] = useState(new Set());
  const [error, setError] = useState(null);

  // Check if following user
  const isFollowing = useCallback((userId, targetId) => {
    return following.has(`${userId}:${targetId}`);
  }, [following]);

  // Follow user with optimistic update
  const followUser = useCallback(async (followerId, followerUsername, followingId, followingUsername) => {
    const key = `${followerId}:${followingId}`;

    // Optimistic update
    setFollowing(prev => new Set([...prev, key]));

    try {
      setError(null);
      await api.follows.create(followerId, followerUsername, followingId, followingUsername);
      return true;
    } catch (err) {
      // Rollback on error
      console.error('Follow error:', err);
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      setError(err.message);
      throw err;
    }
  }, []);

  // Unfollow user with optimistic update
  const unfollowUser = useCallback(async (followerId, followingId) => {
    const key = `${followerId}:${followingId}`;

    // Optimistic update
    setFollowing(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });

    try {
      setError(null);
      await api.follows.delete(followerId, followingId);
      return true;
    } catch (err) {
      // Rollback on error
      console.error('Unfollow error:', err);
      setFollowing(prev => new Set([...prev, key]));
      setError(err.message);
      throw err;
    }
  }, []);

  // Toggle follow status
  const toggleFollow = useCallback(async (followerId, followerUsername, followingId, followingUsername) => {
    if (isFollowing(followerId, followingId)) {
      return unfollowUser(followerId, followingId);
    } else {
      return followUser(followerId, followerUsername, followingId, followingUsername);
    }
  }, [isFollowing, followUser, unfollowUser]);

  return {
    following,
    followers,
    error,
    isFollowing,
    followUser,
    unfollowUser,
    toggleFollow,
  };
};
