# Implementation Guide: Using Optimized Features

## Quick Start

### 1. Verify Database Setup

The database indexes are automatically created in the schema. Verify they're working:

```bash
# Connect to MongoDB
mongo your_connection_string

# Check indexes
db.profiles.getIndexes()
db.tweets.getIndexes()
db.likes.getIndexes()
```

### 2. Update Component Imports

Replace old axios/fetch calls with the new API service:

```javascript
// OLD
import axios from 'axios';
const response = await axios.get('/api/tweet');

// NEW
import api from '../services/api';
const response = await api.tweets.list(profileId, 1, 20);
```

### 3. Use New Hooks in Components

```javascript
import { useTweets } from '../hooks/useTweets';
import { useLikes } from '../hooks/useLikes';
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { tweets, loading, pagination } = useTweets();
  const { likedTweets, toggleLike } = useLikes();
  const { profile } = useAuth();

  return (
    // Use hooks for state management
  );
}
```

---

## API Service Usage Examples

### Tweets

```javascript
import api from '../services/api';

// List tweets with pagination
const { data } = await api.tweets.list(profileId, page = 1, limit = 20);
console.log(data.tweets);
console.log(data.pagination);

// Create tweet
const { data } = await api.tweets.create(text, profileId, hashtags, location);

// Delete tweet
await api.tweets.delete(tweetId);
```

### Profiles

```javascript
// Get profile
const { data } = await api.profiles.get(id, username);

// List profiles
const { data } = await api.profiles.list(page, limit);

// Create/update profile
const { data } = await api.profiles.createOrUpdate(username, avatar);

// Delete profile
await api.profiles.delete(userId);
```

### Likes

```javascript
// List likes (paginated)
const { data } = await api.likes.list(userId, tweetId, page, limit);

// Like tweet
await api.likes.create(userId, tweetId);

// Unlike tweet
await api.likes.delete(userId, tweetId);
```

### Follows

```javascript
// Check if following
const { data } = await api.follows.get(followerId, followingId);

// List followers/following
const { data } = await api.follows.list(followerId, followingId, page, limit);

// Follow user
await api.follows.create(followerId, followerUsername, followingId, followingUsername);

// Unfollow user
await api.follows.delete(followerId, followingId);
```

### Replies

```javascript
// List replies (paginated)
const { data } = await api.replies.list(tweetId, replyId, userId, page, limit);

// Create reply
await api.replies.create(text, userId, tweetId, replyId);
```

### Bookmarks

```javascript
// List bookmarks
const { data } = await api.bookmarks.list(userId, page, limit);

// Create bookmark
await api.bookmarks.create(userId, tweetId);

// Delete bookmark
await api.bookmarks.delete(userId, tweetId);
```

### Search

```javascript
// Search profiles and tweets
const { data } = await api.search.all(query, page, limit);
console.log(data.profiles);
console.log(data.tweets);
```

---

## Error Handling

### API Errors

The API service provides detailed error information:

```javascript
try {
  await api.tweets.create(text, profileId);
} catch (error) {
  console.log(error.message);    // User-friendly message
  console.log(error.status);     // HTTP status (400, 404, 409, 500)
  console.log(error.code);       // Error code (INVALID_TEXT, NOT_FOUND, etc.)
  console.log(error.details);    // Additional details
}
```

### Component Error Handling

Wrap components with ErrorBoundary:

```javascript
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MainComponent />
    </ErrorBoundary>
  );
}
```

---

## Pagination

All list endpoints support pagination:

```javascript
const response = await api.tweets.list(profileId, page = 1, limit = 20);

// Response structure:
{
  data: {
    tweets: [...],
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      pages: 8
    }
  }
}
```

**Default Limits**: 20 items per page, max 100 items

---

## Caching

The API service automatically caches READ requests (GET) for 5 minutes:

```javascript
// First call: Hits database
const response1 = await api.profiles.get(userId);

// Second call within 5 minutes: Returns cached data
const response2 = await api.profiles.get(userId);

// Clear specific cache
api.cache.clear('profile');

// Clear all cache
api.cache.clearAll();
```

Mutations (POST, DELETE) automatically clear relevant caches.

---

## Using Hooks for State Management

### useAuth Hook

```javascript
import { useAuth } from '../hooks/useAuth';

function Component() {
  const { profile, loading, error, isAuthenticated, updateProfile, logout } = useAuth();

  // profile: Current user's profile data
  // loading: Boolean, true while fetching
  // error: Error message if any
  // isAuthenticated: Boolean
  // updateProfile(username, avatar): Update profile
  // logout(): Clear auth state
}
```

### useTweets Hook

```javascript
import { useTweets } from '../hooks/useTweets';

function Component() {
  const {
    tweets,
    page,
    loading,
    pagination,
    addTweet,      // Optimistic add
    removeTweet,   // Optimistic remove
    updateTweet,   // Update tweet in list
    nextPage,
    prevPage,
    goToPage,
  } = useTweets(profileId);
}
```

### useLikes Hook

```javascript
import { useLikes } from '../hooks/useLikes';

function Component() {
  const {
    likedTweets,
    likeCount,
    error,
    isLiked,           // isLiked(tweetId, userId)
    likeTweet,         // Optimistic like
    unlikeTweet,       // Optimistic unlike
    toggleLike,        // Like/unlike
    initializeLikes,   // Load user's likes
  } = useLikes();
}
```

---

## WebSocket Real-Time Updates

### Setup WebSocket Connection

```javascript
import { useWebSocket } from '../hooks/useWebSocket';

function Component() {
  const { isConnected, isUsingPolling, subscribe, emit, disconnect } = 
    useWebSocket(authToken);

  // Subscribe to events
  useEffect(() => {
    const unsubscribe = subscribe('new_tweet', (tweet) => {
      console.log('New tweet:', tweet);
    });

    return unsubscribe;
  }, [subscribe]);

  // Emit events
  const handleTweet = () => {
    emit('new_tweet', {
      tweetId: '123',
      text: 'Hello world',
    });
  };
}
```

### WebSocket Events

Supported events:

```javascript
subscribe('connected', (data) => {
  console.log('WebSocket connected', data.socketId);
});

subscribe('new_tweet', (tweet) => {
  // Broadcast to all users
});

subscribe('tweet_liked', (notification) => {
  // User's tweet was liked
});

subscribe('new_follower', (notification) => {
  // User gained a follower
});

subscribe('new_reply', (reply) => {
  // User's tweet was replied to
});

subscribe('error', (error) => {
  console.error('WebSocket error:', error);
});

subscribe('fallback_polling', () => {
  // WebSocket unavailable, switching to polling
});
```

---

## Performance Optimization Tips

### 1. Memoize Components

```javascript
const TweetCard = React.memo(({ tweet, onLike }) => {
  // Component only re-renders if props change
  return <div>{tweet.text}</div>;
});
```

### 2. Use useCallback for Event Handlers

```javascript
const handleLike = useCallback(async (tweetId) => {
  await api.likes.create(userId, tweetId);
}, [userId]);
```

### 3. Lazy Load Images

```javascript
<img 
  src={avatar} 
  alt="avatar" 
  loading="lazy"
/>
```

### 4. Virtual Scrolling for Large Lists

Use `react-window` for large tweet feeds:

```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={tweets.length}
  itemSize={100}
>
  {({ index, style }) => (
    <TweetCard tweet={tweets[index]} style={style} />
  )}
</FixedSizeList>
```

---

## Testing

### Test Hooks

```javascript
import { renderHook, act } from '@testing-library/react';
import { useTweets } from '../hooks/useTweets';

test('useTweets loads tweets', async () => {
  const { result } = renderHook(() => useTweets());
  
  await act(async () => {
    // Wait for loading
  });

  expect(result.current.tweets).toBeDefined();
});
```

### Test API Service

```javascript
import api from '../services/api';

test('api.tweets.list returns paginated tweets', async () => {
  const response = await api.tweets.list(null, 1, 20);
  
  expect(response.data.tweets).toBeArray();
  expect(response.data.pagination).toBeDefined();
});
```

---

## Deployment Checklist

- [ ] Database indexes created
- [ ] Environment variables set (MONGODB_URI, AUTH0_SECRET if using WebSocket)
- [ ] API response handlers tested
- [ ] Pagination tested (20, 50, 100 items)
- [ ] Error handling verified
- [ ] Optimistic updates tested
- [ ] WebSocket fallback to polling tested
- [ ] Cache invalidation tested
- [ ] Performance metrics logged
- [ ] Error logging configured

---

## Troubleshooting

### High Database Query Time

Check if indexes are created:
```bash
mongo
db.tweets.getIndexes()
```

### Pagination Not Working

Ensure limit is between 1-100:
```javascript
// Valid
await api.tweets.list(null, 1, 50);

// Invalid (over limit)
await api.tweets.list(null, 1, 150);
```

### Cache Not Clearing

For mutations, cache is auto-cleared. For manual clear:
```javascript
api.cache.clear('tweet');
```

### WebSocket Not Connecting

Check if WebSocket URL is correct:
```javascript
// In useWebSocket hook
// Default: ws://localhost:3000 or wss://yourdomain.com
```

If WebSocket fails, the hook automatically switches to polling.

---

## Migration Timeline

### Day 1: Database
- [ ] Create indexes
- [ ] Test query performance

### Day 2: API Layer
- [ ] Update all API files
- [ ] Test pagination
- [ ] Test error responses

### Day 3: Hooks & Services
- [ ] Update Home.js
- [ ] Use api service
- [ ] Test cache behavior

### Day 4: Components
- [ ] Replace Tweet.js with Tweet.optimized.js
- [ ] Use new hooks
- [ ] Test optimistic updates

### Day 5: Real-Time
- [ ] Setup WebSocket
- [ ] Test fallback to polling
- [ ] Test events

### Day 6: Testing & Deployment
- [ ] Load testing
- [ ] Performance verification
- [ ] Deploy to production

---

## Support & Questions

For issues or questions:

1. Check OPTIMIZATION_SUMMARY.md for detailed explanations
2. Review the hook source code for API contracts
3. Check console logs for error details
4. Test with a simple component first before integrating

---

**Last Updated**: 2024
**Status**: Ready for Production
