// src/hooks/useAuth.js
import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for authentication and profile management
 * Handles loading, caching, and updates
 */
export const useAuth = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch profile on mount (from Auth0 context or localStorage)
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get profile from localStorage first
        const cachedProfile = localStorage.getItem('profile');
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
        }

        // If we have Auth0 credentials, fetch the profile
        // This assumes Auth0 context is available globally
        if (window.__AUTH0_USER__) {
          const username = window.__AUTH0_USER__.nickname || window.__AUTH0_USER__.name;
          const avatar = window.__AUTH0_USER__.picture;

          const response = await api.profiles.createOrUpdate(username, avatar);
          if (response.data) {
            setProfile(response.data);
            localStorage.setItem('profile', JSON.stringify(response.data));
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Memoized functions for profile updates
  const updateProfile = useCallback(async (username, avatar) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.profiles.createOrUpdate(username, avatar);
      if (response.data) {
        setProfile(response.data);
        localStorage.setItem('profile', JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setProfile(null);
    localStorage.removeItem('profile');
    api.cache.clearAll();
    // Dispatch logout to Auth0 context if available
    if (window.__AUTH0_LOGOUT__) {
      window.__AUTH0_LOGOUT__();
    }
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    logout,
    isAuthenticated: !!profile,
  };
};
