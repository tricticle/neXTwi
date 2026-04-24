// src/hooks/useProfile.js
import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching and managing profile data
 */
export const useProfile = (profileId = null, username = null) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!profileId || !!username);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId && !username) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.profiles.get(profileId, username);
        setProfile(response.data);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, username]);

  const refetch = useCallback(async () => {
    if (!profileId && !username) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.profiles.get(profileId, username);
      setProfile(response.data);
    } catch (err) {
      console.error('Profile refetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId, username]);

  return { profile, loading, error, refetch };
};
