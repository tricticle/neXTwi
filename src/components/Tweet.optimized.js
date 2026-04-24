// src/components/Tweet.optimized.js
import React, { useState, useCallback, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import TweetPost from "./TweetPost";
import { useTweets } from "../hooks/useTweets";
import { useLikes } from "../hooks/useLikes";
import { useFollows } from "../hooks/useFollows";
import api from "../services/api";
import LoadingSpinner, { TweetSkeleton, ErrorMessage } from "./LoadingSpinner";

/**
 * Optimized Tweet component with memoized actions and efficient state management
 */
const Tweet = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { tweets, loading, error, pagination, addTweet, removeTweet } = useTweets();
  const { likedTweets, isLiked, toggleLike } = useLikes();
  const { following, isFollowing, toggleFollow } = useFollows();
  
  const [replyText, setReplyText] = useState("");
  const [selectedTweetId, setSelectedTweetId] = useState(null);
  const [bookmarkedTweets, setBookmarkedTweets] = useState(new Set());
  const [activeTab, setActiveTab] = useState("recentTweet");
  const [profileData, setProfileData] = useState(null);
  const [error as apiError, setApiError] = useState(null);

  // Memoized handlers with useCallback to prevent unnecessary re-renders
  const handleTabClick = useCallback((tab) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    setActiveTab(tab);
  }, [isAuthenticated, loginWithRedirect]);

  const handleLike = useCallback(async (tweetId) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    if (!profileData) {
      setApiError("Profile not loaded");
      return;
    }

    try {
      setApiError(null);
      await toggleLike(profileData._id, tweetId);
    } catch (err) {
      console.error("Like error:", err);
      toast.error(err.message);
    }
  }, [isAuthenticated, loginWithRedirect, profileData, toggleLike]);

  const handleBookmark = useCallback(async (tweetId) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    if (!profileData) {
      setApiError("Profile not loaded");
      return;
    }

    try {
      setApiError(null);
      const isBookmarked = bookmarkedTweets.has(tweetId);

      if (isBookmarked) {
        await api.bookmarks.delete(profileData._id, tweetId);
        setBookmarkedTweets(prev => {
          const newSet = new Set(prev);
          newSet.delete(tweetId);
          return newSet;
        });
      } else {
        await api.bookmarks.create(profileData._id, tweetId);
        setBookmarkedTweets(prev => new Set([...prev, tweetId]));
      }

      toast.success(`Tweet ${isBookmarked ? "unbookmarked" : "bookmarked"}`);
    } catch (err) {
      console.error("Bookmark error:", err);
      toast.error(err.message);
    }
  }, [isAuthenticated, loginWithRedirect, profileData, bookmarkedTweets]);

  const handleFollow = useCallback(async (followingId, followingUsername) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    if (!profileData) {
      setApiError("Profile not loaded");
      return;
    }

    try {
      setApiError(null);
      await toggleFollow(
        profileData._id,
        profileData.username,
        followingId,
        followingUsername
      );
      toast.success(`User ${isFollowing(profileData._id, followingId) ? "followed" : "unfollowed"}`);
    } catch (err) {
      console.error("Follow error:", err);
      toast.error(err.message);
    }
  }, [isAuthenticated, loginWithRedirect, profileData, toggleFollow, isFollowing]);

  const handleReply = useCallback(async (tweetId) => {
    if (!replyText.trim()) return;
    
    if (!profileData) {
      setApiError("Profile not loaded");
      return;
    }

    try {
      setApiError(null);
      await api.replies.create(replyText, profileData._id, tweetId);
      setReplyText("");
      setSelectedTweetId(null);
      toast.success("Reply posted successfully");
    } catch (err) {
      console.error("Reply error:", err);
      toast.error(err.message);
    }
  }, [replyText, profileData]);

  const handleDeleteTweet = useCallback(async (tweetId) => {
    if (!window.confirm("Are you sure you want to delete this tweet?")) return;

    try {
      setApiError(null);
      await api.tweets.delete(tweetId);
      removeTweet(tweetId);
      toast.success("Tweet deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message);
    }
  }, [removeTweet]);

  // Render loading state
  if (loading && tweets.length === 0) {
    return (
      <div>
        {[...Array(5)].map((_, i) => (
          <TweetSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="tweet-container">
      {apiError && (
        <ErrorMessage 
          message={apiError} 
          onDismiss={() => setApiError(null)}
        />
      )}

      <div className="tweet-tabs">
        <button 
          className={activeTab === "recentTweet" ? "active" : ""}
          onClick={() => handleTabClick("recentTweet")}
        >
          Recent Tweets
        </button>
        <button 
          className={activeTab === "myTweets" ? "active" : ""}
          onClick={() => handleTabClick("myTweets")}
        >
          My Tweets
        </button>
      </div>

      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => {}}
        />
      )}

      <div className="tweets-list">
        {tweets.length === 0 ? (
          <p className="no-tweets">No tweets to display</p>
        ) : (
          tweets.map((tweet) => (
            <TweetCard
              key={tweet._id}
              tweet={tweet}
              profileData={profileData}
              isLiked={isLiked(tweet._id, profileData?._id)}
              isBookmarked={bookmarkedTweets.has(tweet._id)}
              isFollowing={isFollowing(profileData?._id, tweet.profile_id)}
              onLike={() => handleLike(tweet._id)}
              onBookmark={() => handleBookmark(tweet._id)}
              onFollow={() => handleFollow(tweet.profile_id, tweet.profile?.username)}
              onReply={() => setSelectedTweetId(tweet._id)}
              onDelete={() => handleDeleteTweet(tweet._id)}
            />
          ))
        )}
      </div>

      {selectedTweetId && (
        <div className="reply-section">
          <textarea
            placeholder="What's your reply?"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={280}
          />
          <button 
            onClick={() => handleReply(selectedTweetId)}
            disabled={!replyText.trim()}
          >
            Reply
          </button>
          <button onClick={() => setSelectedTweetId(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

/**
 * Memoized tweet card component for efficient rendering
 */
const TweetCard = React.memo(({
  tweet,
  profileData,
  isLiked,
  isBookmarked,
  isFollowing,
  onLike,
  onBookmark,
  onFollow,
  onReply,
  onDelete,
}) => {
  return (
    <div className="tweet-card">
      <div className="tweet-header">
        {tweet.profile && (
          <>
            <img src={tweet.profile.avatar} alt={tweet.profile.username} className="avatar" />
            <Link to={`/profile/${tweet.profile.username}`}>
              <strong>{tweet.profile.username}</strong>
            </Link>
          </>
        )}
      </div>

      <div className="tweet-content">
        <p>{tweet.text}</p>
        {tweet.hashtags && tweet.hashtags.length > 0 && (
          <div className="hashtags">
            {tweet.hashtags.map(tag => (
              <Link key={tag} to={`/search?q=${tag}`}>
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="tweet-meta">
        <span>{new Date(tweet.created_at).toLocaleDateString()}</span>
      </div>

      <div className="tweet-actions">
        <button onClick={onLike} className={isLiked ? "liked" : ""}>
          ♥ Like
        </button>
        <button onClick={onBookmark} className={isBookmarked ? "bookmarked" : ""}>
          🔖 Bookmark
        </button>
        <button onClick={onReply}>💬 Reply</button>
        <button onClick={onFollow}>
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
        {profileData?.._id === tweet.profile_id && (
          <button onClick={onDelete} className="delete">
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  );
});

TweetCard.displayName = "TweetCard";

export default Tweet;
