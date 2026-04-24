// src/utils/websocket.js
/**
 * WebSocket wrapper with reconnection and fallback to polling
 */

const WS_URL = process.env.REACT_APP_WS_URL || `ws${window.location.protocol === 'https:' ? 's' : ''}://${window.location.host}`;
const RECONNECT_INTERVALS = [1000, 2000, 5000, 10000]; // Exponential backoff

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.isConnecting = false;
    this.authToken = null;
  }

  /**
   * Connect to WebSocket with authentication
   */
  connect(authToken) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.authToken = authToken;

    try {
      const url = `${WS_URL}?token=${encodeURIComponent(authToken)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.emit(message.type, message.data);
        } catch (err) {
          console.error('[WebSocket] Parse error:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.isConnecting = false;
        this.emit('disconnected');
        this.attemptReconnect();
      };
    } catch (err) {
      console.error('[WebSocket] Connection error:', err);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= RECONNECT_INTERVALS.length) {
      console.warn('[WebSocket] Max reconnection attempts reached, using polling fallback');
      this.emit('fallback_polling');
      return;
    }

    const delay = RECONNECT_INTERVALS[this.reconnectAttempts];
    this.reconnectAttempts += 1;

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => {
      if (this.authToken) {
        this.connect(this.authToken);
      }
    }, delay);
  }

  /**
   * Send message to server
   */
  send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WebSocket] Not connected, message queued:', type);
    }
  }

  /**
   * Listen to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`[WebSocket] Listener error for ${event}:`, err);
        }
      });
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Check connection status
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const wsClient = new WebSocketClient();

export default wsClient;
