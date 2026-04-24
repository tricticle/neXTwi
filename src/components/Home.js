import React, { useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import SideNav from "./layouts/SideNav";
import { toast } from "react-toastify";
import SearchResults from "./layouts/SearchResults";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { ErrorMessage, SuccessMessage } from "./LoadingSpinner";

const Home = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { profile, loading: authLoading, error: authError } = useAuth();
  
  const [tweetText, setTweetText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [isTweetPostVisible, setIsTweetPostVisible] = useState(false);
  const [isPostingTweet, setIsPostingTweet] = useState(false);
  const [error, setError] = useState(null);

  const handleTweetButtonClick = useCallback(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    setIsTweetPostVisible(prev => !prev);
  }, [isAuthenticated, loginWithRedirect]);

  const handleSubscribeClick = useCallback(() => {
    toast.info("Feature coming soon!", {
      position: "top-right",
      autoClose: 3000,
    });
  }, []);

  const postTweet = useCallback(async () => {
    if (!profile) {
      setError("Profile not loaded");
      return;
    }

    try {
      setError(null);
      setIsPostingTweet(true);

      // Get location if enabled
      let location = null;
      if (useLocation && navigator.geolocation) {
        location = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            position => {
              resolve({
                type: "Point",
                coordinates: [position.coords.longitude, position.coords.latitude],
              });
            },
            reject
          );
        });
      }

      // Parse hashtags
      const parsedHashtags = hashtags
        .split(/[\s,]+/)
        .filter(tag => tag.trim() !== "");

      // Create tweet
      const response = await api.tweets.create(
        tweetText,
        profile._id,
        parsedHashtags,
        location
      );

      if (response.data) {
        toast.success("Tweet posted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        setTweetText("");
        setHashtags("");
        setUseLocation(false);
        setIsTweetPostVisible(false);
      }
    } catch (err) {
      const errorMsg = err.message || "Failed to post tweet";
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsPostingTweet(false);
    }
  }, [profile, useLocation, tweetText, hashtags]);

  return (
    <div className="container">
      <SideNav
        profileId={profile?._id}
        onTweetButtonClick={handleTweetButtonClick}
        onSomeClick={handleSubscribeClick}
      />
      <div className="post-section">
        <Outlet context={{ profile }} />
        <div className="tps">
          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError(null)}
            />
          )}
          {isTweetPostVisible && (
            <div className="tweet-post">
              <textarea
                placeholder="What's happening?"
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
                disabled={isPostingTweet}
                maxLength={280}
              />
              <div className="tweet-char-count">
                {tweetText.length}/280
              </div>
              <input
                type="text"
                placeholder="Add hashtags (comma or space separated)"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                disabled={isPostingTweet}
              />
              <div className="location">
                <input
                  type="checkbox"
                  checked={useLocation}
                  onChange={() => setUseLocation(!useLocation)}
                  disabled={isPostingTweet}
                />
                <label>Use my location</label>
              </div>
              <button 
                onClick={postTweet} 
                disabled={isPostingTweet || !tweetText.trim()}
              >
                {isPostingTweet ? "Posting..." : "Tweet"}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="widgets">
        <div className="ds-none">
          <SearchResults />
        </div>
        <div className="widgets__widgetContainer">
          <h2>Subscribe to Premium</h2>
          <p>
            Subscribe to unlock new features and if eligible, receive a share of
            ads revenue.
          </p>
          <div className="menu-btn">
            <button onClick={handleSubscribeClick}>Subscribe</button>
          </div>
        </div>
        <div className="widgets__widgetContainer">
          <h2>What's happening?</h2>
          <p>
            Stay updated with the latest tweets, trending topics, and interactions
            from accounts you follow. Join the conversation and share your thoughts
            with the community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
