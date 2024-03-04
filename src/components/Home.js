import React, { useState, useEffect } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import SideNav from "./layouts/SideNav";
import SearchResults from "./layouts/SearchResults";
import TweetPost from "./TweetPost";
import { Outlet } from "react-router-dom";

const Home = () => {
  const { isAuthenticated, user } = useAuth0();
  const [profileData, setProfileData] = useState(null);
  const [tweetText, setTweetText] = useState("");
  const [tweets, setTweets] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [selectedTweetId, setSelectedTweetId] = useState(null);
  const [repliesTweets, setRepliesTweets] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [bookmarkedTweets, setBookmarkedTweets] = useState([]);
  const [hashtags, setHashtags] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [showOptions, setShowOptions] = useState(null);
  const [isTweetPostVisible, setIsTweetPostVisible] = useState(false);
  const [followStatus, setFollowStatus] = useState({});

  const handleTweetButtonClick = () => {
    setIsTweetPostVisible(!isTweetPostVisible);
  };

  const handleSubscribeClick = () => {
    alert("feature coming soon!");
  };

  const handleLike = async (tweetId) => {
    try {
      const isLiked = likedTweets.includes(tweetId);
      const method = isLiked ? "DELETE" : "POST";

      const response = await fetch("/api/like", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: profileData._id,
          tweet_id: tweetId,
        }),
      });

      if (response.ok) {
        console.log(`Tweet ${isLiked ? "unliked" : "liked"} successfully`);
        fetchLikes();
      } else {
        console.error(`Failed to ${isLiked ? "unlike" : "like"} tweet`);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleBookmark = async (tweetId) => {
    try {
      const isBookmarked = bookmarkedTweets.includes(tweetId);
      const method = isBookmarked ? "DELETE" : "POST";

      const response = await fetch("/api/bookmark", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: profileData._id,
          tweet_id: tweetId,
        }),
      });

      if (response.ok) {
        console.log(
          `Tweet ${isBookmarked ? "unbookmarked" : "bookmarked"} successfully`
        );
        fetchBookmarks();
      } else {
        console.error(
          `Failed to ${isBookmarked ? "unbookmark" : "bookmark"} tweet`
        );
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFollow = async (followingId, followingUsername) => {
    try {
      const isFollowing = followStatus[followingId];
      const method = isFollowing ? "DELETE" : "POST";

      const response = await fetch("/api/follow", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          follower_id: profileData._id,
          follower_username: profileData.username,
          following_id: followingId,
          following_username: followingUsername,
        }),
      });

      if (response.ok) {
        // Instead of relying on the current state, check the response from the server
        const newFollowStatus = await fetchFollowStatus(followingId);
        console.log(
          `User ${isFollowing ? "unfollowed" : "followed"} successfully`
        );
        setFollowStatus((prevStatus) => ({
          ...prevStatus,
          [followingId]: newFollowStatus,
        }));
      } else {
        console.error(`Failed to ${isFollowing ? "unfollow" : "follow"} user`);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchFollowStatus = async (userId) => {
    try {
      const response = await fetch(
        `/api/follow?follower_id=${profileData._id}&following_id=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const follow = await response.json();
        setFollowStatus((prevStatus) => ({
          ...prevStatus,
          [userId]: follow ? "Following" : "Follow",
        }));
        return follow ? "Following" : "Follow"; // Return the follow status
      } else if (
        response.status === 404 &&
        response.statusText === "Not Found"
      ) {
        // Follow relationship not found, assuming not being followed
        setFollowStatus((prevStatus) => ({
          ...prevStatus,
          [userId]: "Follow",
        }));
        console.log(
          "Follow relationship not found, assuming not being followed"
        );
        return "Follow";
      } else {
        console.error("Failed to fetch follow status");
        return null; // or handle the error appropriately
      }
    } catch (error) {
      console.error("Error:", error);
      return null; // or handle the error appropriately
    }
  };

  const fetchLikes = async () => {
    try {
      if (profileData) {
        const response = await fetch(`/api/like?user_id=${profileData._id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const likes = await response.json();
          setLikedTweets(likes.map((like) => like.tweet_id));
          console.log("Likes:", likes);
        } else {
          console.error("Failed to fetch likes");
        }
      } else {
        console.error("Profile data is not available");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchBookmarks = async () => {
    try {
      if (profileData) {
        const response = await fetch(
          `/api/bookmark?user_id=${profileData._id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const bookmarks = await response.json();
          setBookmarkedTweets(bookmarks.map((bookmark) => bookmark.tweet_id));
          console.log("Bookmarks:", bookmarks);
        } else {
          console.error("Failed to fetch bookmarks");
        }
      } else {
        console.error("Profile data is not available");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleOptions = (tweetId) => {
    setShowOptions((prevTweetId) => (prevTweetId === tweetId ? null : tweetId));
  };

  const handleProfile = async () => {
    try {
      const response = await axios.post("/api/profile", {
        username: user.name,
        avatar: user.picture, // Include the avatar from Auth0
      });
      console.log(response.data.message);
      await addProfile();
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };

  const addProfile = async () => {
    try {
      const response = await fetch(
        `/api/profile?username=${user.name || user.sub}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const profileData = await response.json();

        if (profileData.username === user.name) {
          setProfileData(profileData);
          console.log("Profile ID:", profileData._id);
          console.log("Profile added successfully");
        } else {
          console.error("Profile username does not match Auth0 user name");
        }
      } else {
        console.error("Failed to add profile");
        // Throw an error to trigger the catch block
        throw new Error("Failed to add profile");
      }
    } catch (error) {
      console.error("Error:", error);
      // If an error occurs, run handleProfile
      await handleProfile();
    }
  };

  const postTweet = async () => {
    try {
      // Use navigator.geolocation to get the user's current location
      let location = null;
      if (navigator.geolocation && useLocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        location = {
          type: "Point",
          coordinates: [position.coords.longitude, position.coords.latitude],
        };
      }

      const response = await fetch("/api/tweet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: tweetText,
          profile_id: profileData._id,
          hashtags: hashtags.split(/[\s,]+/).filter((tag) => tag !== ""), // Extract hashtags from input
          location, // Include the user's location if available
        }),
      });

      if (response.ok) {
        console.log("Tweet posted successfully");
        fetchTweets();
        setTweetText("");
        setHashtags("");
      } else {
        console.error("Failed to post tweet");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    try {
      const response = await fetch("/api/tweet", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tweet_id: tweetId,
        }),
      });

      if (response.ok) {
        console.log("Tweet deleted successfully");
        fetchTweets();
      } else {
        console.error("Failed to delete tweet");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchTweets = async () => {
    try {
      const response = await fetch("/api/tweet", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const tweets = await response.json();

        // Fetch profile information for each tweet
        const tweetsWithProfile = await Promise.all(
          tweets.map(async (tweet) => {
            const profileResponse = await fetch(
              `/api/profile?id=${tweet.profile_id}`
            );
            const profileData = await profileResponse.json();
            return {
              ...tweet,
              avatar: profileData.avatar,
              username: profileData.username,
            };
          })
        );

        setTweets(tweetsWithProfile);
      } else {
        console.error("Failed to fetch tweets");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const postReply = async (tweetId) => {
    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: replyText,
          user_id: profileData._id,
          tweet_id: tweetId,
        }),
      });

      if (response.ok) {
        console.log("Reply posted successfully");
        fetchReplies();
        setReplyText("");
      } else {
        console.error("Failed to post reply");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await fetch("/api/reply", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const replies = await response.json();

        // Fetch profile information for each reply
        const repliesWithProfile = await Promise.all(
          replies.map(async (reply) => {
            const profileResponse = await fetch(
              `/api/profile?id=${reply.user_id}`
            );
            const profileData = await profileResponse.json();
            return {
              ...reply,
              avatar: profileData.avatar,
              username: profileData.username,
            };
          })
        );

        setRepliesTweets(repliesWithProfile);
      } else {
        console.error("Failed to fetch replies");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      addProfile();
      fetchReplies();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (profileData && profileData._id) {
      fetchLikes();
      fetchBookmarks();
      tweets.forEach((tweet) => fetchFollowStatus(tweet.profile_id));
    }
  }, [profileData]);

  useEffect(() => {
    if (profileData && profileData._id) {
      tweets.forEach((tweet) => fetchFollowStatus(tweet.profile_id));
    }
  }, [tweets]);

  return (
    <div className="container">
      <SideNav
        profileId={profileData ? profileData._id : null}
        onTweetButtonClick={handleTweetButtonClick}
        onSomeClick={handleSubscribeClick}
      />
      <div className="post-section">
        <Outlet />
        <div className="tps">
          {isTweetPostVisible && (
            <div className="tweet-post">
              <textarea
                placeholder="What's happening?"
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
              />
              <input
                type="text"
                placeholder="Add hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
              <div className="location">
                <input
                  type="checkbox"
                  checked={useLocation}
                  onChange={() => setUseLocation(!useLocation)}
                />
                location
              </div>
              <button onClick={postTweet}>Tweet</button>
            </div>
          )}
        </div>
      </div>
      <div className="widgets">
        <SearchResults />
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
            This part handles the addition of a new profile when the HTTP method
            is a POST request. If you're looking for an alternative way to add
            data, you might consider making slight modifications based on your
            specific requirements. If you have a different data structure or
            need additional functionality, please provide more details about the
            specific changes or features you're looking for, and I'll be happy
            to help you modify the code accordingly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
