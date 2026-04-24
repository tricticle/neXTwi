// src/hooks/useWebSocket.js
import { useEffect, useState, useCallback } from 'react';
import wsClient from '../utils/websocket';

/**
 * Custom hook for WebSocket real-time updates
 * Automatically switches to polling if WebSocket fails
 */
export const useWebSocket = (authToken) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isUsingPolling, setIsUsingPolling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authToken) return;

    // Connect WebSocket
    wsClient.connect(authToken);

    // Listen for connection events
    const unsubscribeConnected = wsClient.on('connected', () => {
      setIsConnected(true);
      setIsUsingPolling(false);
      setError(null);
    });

    const unsubscribeDisconnected = wsClient.on('disconnected', () => {
      setIsConnected(false);
    });

    const unsubscribeError = wsClient.on('error', (err) => {
      setError(err?.message || 'WebSocket error');
    });

    const unsubscribeFallback = wsClient.on('fallback_polling', () => {
      console.log('[useWebSocket] Falling back to polling');
      setIsUsingPolling(true);
      setIsConnected(false);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
      unsubscribeFallback();
    };
  }, [authToken]);

  // Function to subscribe to specific events
  const subscribe = useCallback((event, callback) => {
    return wsClient.on(event, callback);
  }, []);

  // Function to emit events
  const emit = useCallback((type, data) => {
    wsClient.send(type, data);
  }, []);

  // Function to disconnect
  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);

  return {
    isConnected,
    isUsingPolling,
    error,
    subscribe,
    emit,
    disconnect,
  };
};
