// src/hooks/useTweets.js
import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching and managing tweets with pagination
 */
export const useTweets = (profileId = null, initialPage = 1, limit = 20) => {
  const [tweets, setTweets] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchTweets = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.tweets.list(profileId, pageNum, limit);
      if (response.data) {
        setTweets(response.data.tweets);
        setPagination(response.data.pagination);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Tweets fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId, limit]);

  useEffect(() => {
    fetchTweets(initialPage);
  }, [profileId, initialPage, limit, fetchTweets]);

  // Optimistic update for new tweet (prepend to list)
  const addTweet = useCallback((tweet) => {
    setTweets(prev => [tweet, ...prev]);
    if (pagination) {
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1,
      }));
    }
  }, [pagination]);

  // Optimistic update for deleted tweet
  const removeTweet = useCallback((tweetId) => {
    setTweets(prev => prev.filter(t => t._id !== tweetId));
    if (pagination) {
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    }
  }, [pagination]);

  // Update tweet in list
  const updateTweet = useCallback((tweetId, updates) => {
    setTweets(prev => 
      prev.map(t => t._id === tweetId ? { ...t, ...updates } : t)
    );
  }, []);

  const nextPage = useCallback(() => {
    if (pagination && page < pagination.pages) {
      fetchTweets(page + 1);
    }
  }, [page, pagination, fetchTweets]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      fetchTweets(page - 1);
    }
  }, [page, fetchTweets]);

  const goToPage = useCallback((pageNum) => {
    fetchTweets(pageNum);
  }, [fetchTweets]);

  return {
    tweets,
    page,
    loading,
    error,
    pagination,
    fetchTweets,
    addTweet,
    removeTweet,
    updateTweet,
    nextPage,
    prevPage,
    goToPage,
  };
};
