import React, { useState, useEffect } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Like = ({ profileId }) => {
      const { isAuthenticated, user, loginWithRedirect } = useAuth0();
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
              if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
        setIsTweetPostVisible(!isTweetPostVisible);
      };

  const handleSubscribeClick = () => {
        if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
        alert("feature coming soon!");
      };

      const handleLike = async (tweetId) => {
        try {
         if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
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
            toast.success(`Tweet ${isLiked ? "unliked" : "liked"} successfully`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
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
         if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
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
              `Tweet ${
                isBookmarked ? "unbookmarked" : "bookmarked"
              } successfully`
            );
        toast.success(`Tweet ${isBookmarked ? "unbookmarked" : "bookmarked"} successfully`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
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
        if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
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
            toast.success( `User ${isFollowing ? "unfollowed" : "followed"} successfully`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
            setFollowStatus((prevStatus) => ({
              ...prevStatus,
              [followingId]: newFollowStatus,
            }));
          } else {
            console.error(
              `Failed to ${isFollowing ? "unfollow" : "follow"} user`
            );
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
            const response = await fetch(
              `/api/like?user_id=${profileData._id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

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
              setBookmarkedTweets(
                bookmarks.map((bookmark) => bookmark.tweet_id)
              );
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
        setShowOptions((prevTweetId) =>
          prevTweetId === tweetId ? null : tweetId
        );
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
                if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
          // Use navigator.geolocation to get the user's current location
          let location = null;
          if (navigator.geolocation && useLocation) {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            location = {
              type: "Point",
              coordinates: [
                position.coords.longitude,
                position.coords.latitude,
              ],
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
toast.success("Tweet posted successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
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
                if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
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
            toast.success("Tweet deleted successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
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
    const response = await fetch(`/api/tweet?profileId=${profileId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const tweets = await response.json();

      // Fetch profile information for each tweet's author
      const tweetsWithProfile = await Promise.all(
        tweets.map(async (tweet) => {
          const profileResponse = await fetch(`/api/profile?id=${tweet.profile_id}`);
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
                if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
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
            toast.success("reply posted successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
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
  <>
      <div className="post-section">
          <div className="tweet-grid">
          <div className="twee-map">
            {tweets
              .filter((tweet) => likedTweets.includes(tweet._id))
              .map((tweet) => (
            <div className="tweet" key={tweet._id}>
              <div className="opos">
                <div className="avatar">
                  {tweet.avatar && (
                    <img
                      src={tweet.avatar}
                      alt={`${tweet.profile_id} Avatar`}
                    />
                  )}
                  <div className="user-info">
                    <h3>{tweet.username}</h3>
                    {tweet.location && tweet.location.placeName && (
                      <h6>
                        &nbsp;&nbsp;,
                        <i className="fa-solid fa-location-dot"></i>
                        {tweet.location.placeName}
                      </h6>
                    )}
                    {profileData?._id !== tweet.profile_id && (
                      <button
                        className="fbtn"
                        onClick={() =>
                          handleFollow(tweet.profile_id, tweet.username)
                        }
                      >
                        {followStatus[tweet.profile_id] === "Following"
                          ? "Following"
                          : "Follow"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="options">
                  <i
                    className="fa-solid fa-ellipsis-vertical"
                    onClick={() => toggleOptions(tweet._id)}
                  ></i>
                  {showOptions === tweet._id && (
                    <div className="options-menu">
                      {profileData?._id !== tweet.profile_id && (
                        <button
                          className="opb"
                          onClick={() => handleBookmark(tweet._id)}
                        >
                          <i className="fa-regular fa-bookmark"></i>
                          {bookmarkedTweets.includes(tweet._id)
                            ? "remove"
                            : "Bookmark"}
                        </button>
                      )}
                      {isAuthenticated &&
                        (user.name === "tricticle" ||
                          profileData?._id === tweet.profile_id) && (
                          <button
                            className="opb"
                            onClick={() => handleDeleteTweet(tweet._id)}
                          >
                            <i className="fa-regular fa-trash-can"></i>
                            Delete
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
              <div className="tweet-area">
                {tweet.hashtags && (
                  <p>
                    {tweet.hashtags.map((tag, index) => (
                      <span key={index} className="hashtag">
                        {" "}
                        #{tag}
                      </span>
                    ))}
                  </p>
                )}
                <h5>{tweet.text}</h5>
              </div>
              <div className="button-group">
                {selectedTweetId === tweet._id ? (
                  <>
                    <input
                      type="text"
                      placeholder="Type your reply here"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button onClick={() => postReply(tweet._id)}>Reply</button>
                  </>
                ) : (
                  <button onClick={() => setSelectedTweetId(tweet._id)}>
                    Reply
                  </button>
                )}
                <button
                  className={likedTweets.includes(tweet._id) ? "liked" : ""}
                  onClick={() => handleLike(tweet._id)}
                >
                  <i className="fas fa-heart"></i>
                </button>
              </div>
              {repliesTweets.map((reply) => {
                if (reply.tweet_id === tweet._id) {
                  return (
                    <div className="replies" key={reply._id}>
                      <div className="user-info">
                        <img
                          className="avatar"
                          src={reply.avatar}
                          alt={`${reply.user_id} Avatar`}
                        />
                        <h3>{reply.username}</h3>
                      </div>
                      <div className="reptext">
                        <p>{reply.text}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))}
          </div>
        </div>
      </div>
      </>
  );
};

export default Like;
