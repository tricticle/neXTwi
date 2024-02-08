// App.js
import React, { useState, useEffect } from "react";
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const [profileData, setProfileData] = useState(null);
  const [tweetText, setTweetText] = useState('');
  const [tweets, setTweets] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [selectedTweetId, setSelectedTweetId] = useState(null);
  const [repliesTweets, setRepliesTweets] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [bookmarkedTweets, setBookmarkedTweets] = useState([]);
  const [hashtags, setHashtags] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const [isTweetPostVisible, setIsTweetPostVisible] = useState(false);
  
  const toggleTweetPost = () => {
    setIsTweetPostVisible(!isTweetPostVisible);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.menu-btn')) {
        closeMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen) {
        closeMenu();
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMenuOpen]);

  const handleLike = async (tweetId) => {
    try {
      const isLiked = likedTweets.includes(tweetId);
      const method = isLiked ? 'DELETE' : 'POST';

      const response = await fetch('/api/like', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: profileData._id,
          tweet_id: tweetId,
        }),
      });

      if (response.ok) {
        console.log(`Tweet ${isLiked ? 'unliked' : 'liked'} successfully`);
        fetchLikes();
      } else {
        console.error(`Failed to ${isLiked ? 'unlike' : 'like'} tweet`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleBookmark = async (tweetId) => {
    try {
      const isBookmarked = bookmarkedTweets.includes(tweetId);
      const method = isBookmarked ? 'DELETE' : 'POST';

      const response = await fetch('/api/bookmark', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: profileData._id,
          tweet_id: tweetId,
        }),
      });

      if (response.ok) {
        console.log(`Tweet ${isBookmarked ? 'unbookmarked' : 'bookmarked'} successfully`);
        fetchBookmarks();
      } else {
        console.error(`Failed to ${isBookmarked ? 'unbookmark' : 'bookmark'} tweet`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchLikes = async () => {
    try {
      if (profileData) {
        const response = await fetch(`/api/like?user_id=${profileData._id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const likes = await response.json();
          setLikedTweets(likes.map(like => like.tweet_id));
          console.log('Likes:', likes);
        } else {
          console.error('Failed to fetch likes');
        }
      } else {
        console.error('Profile data is not available');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const fetchBookmarks = async () => {
    try {
      if (profileData) {
        const response = await fetch(`/api/bookmark?user_id=${profileData._id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const bookmarks = await response.json();
          setBookmarkedTweets(bookmarks.map(bookmark => bookmark.tweet_id));
          console.log('Bookmarks:', bookmarks);
        } else {
          console.error('Failed to fetch bookmarks');
        }
      } else {
        console.error('Profile data is not available');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  

  const toggleOptions = (tweetId) => {
    setShowOptions((prevTweetId) => (prevTweetId === tweetId ? null : tweetId));
  };

  const handleProfile = async () => {
    try {
      const response = await axios.post('/api/profile', {
        username: user.name,
        avatar: user.picture, // Include the avatar from Auth0
      });
      console.log(response.data.message);
      await addProfile();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const addProfile = async () => {
    try {
      const response = await fetch(`/api/profile?username=${user.name || user.sub}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        const profileData = await response.json();
  
        if (profileData.username === user.name) {
          setProfileData(profileData);
          console.log('Profile ID:', profileData._id);
          console.log('Profile added successfully');
        } else {
          console.error('Profile username does not match Auth0 user name');
        }
      } else {
        console.error('Failed to add profile');
        // Throw an error to trigger the catch block
        throw new Error('Failed to add profile');
      }
    } catch (error) {
      console.error('Error:', error);
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
          type: 'Point',
          coordinates: [position.coords.longitude, position.coords.latitude],
        };
      }

      const response = await fetch('/api/tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: tweetText,
          profile_id: profileData._id,
          hashtags: hashtags.split(/[\s,]+/).filter(tag => tag !== ''), // Extract hashtags from input
          location, // Include the user's location if available
        }),
      });

      if (response.ok) {
        console.log('Tweet posted successfully');
        fetchTweets();
        setTweetText('');
        setHashtags('');
      } else {
        console.error('Failed to post tweet');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    try {
      const response = await fetch('/api/tweet', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweet_id: tweetId,
        }),
      });

      if (response.ok) {
        console.log('Tweet deleted successfully');
        fetchTweets();
      } else {
        console.error('Failed to delete tweet');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTweets = async () => {
    try {
      const response = await fetch('/api/tweet', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        const tweets = await response.json();
  
        // Fetch profile information for each tweet
        const tweetsWithProfile = await Promise.all(
          tweets.map(async (tweet) => {
            const profileResponse = await fetch(`/api/profile?id=${tweet.profile_id}`);
            const profileData = await profileResponse.json();
            return { ...tweet, avatar: profileData.avatar, username: profileData.username };
          })
        );
  
        setTweets(tweetsWithProfile);
      } else {
        console.error('Failed to fetch tweets');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  

  const postReply = async (tweetId) => {
    try {
      const response = await fetch('/api/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: replyText,
          user_id: profileData._id,
          tweet_id: tweetId,
        }),
      });

      if (response.ok) {
        console.log('Reply posted successfully');
        fetchReplies();
        setReplyText('');
      } else {
        console.error('Failed to post reply');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await fetch('/api/reply', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const replies = await response.json();

        // Fetch profile information for each reply
        const repliesWithProfile = await Promise.all(
          replies.map(async (reply) => {
            const profileResponse = await fetch(`/api/profile?id=${reply.user_id}`);
            const profileData = await profileResponse.json();
            return { ...reply, avatar: profileData.avatar, username: profileData.username };
          })
        );

        setRepliesTweets(repliesWithProfile);
      } else {
        console.error('Failed to fetch replies');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAdmin = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const adminData = await response.json();
        setAdminData(adminData);
        console.log('Admin data:', adminData);
      } else {
        console.error('Failed to fetch admin data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteProfile = async (username) => {
    try {
      const response = await fetch(`/api/profile?username=${username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
        }),
      });
  
      if (response.ok) {
        console.log('Profile deleted successfully');
        handleAdmin(); // Reload admin data after deletion
      } else {
        console.error('Failed to delete profile');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

useEffect(() => {
  if (isAuthenticated) {
    addProfile();
    fetchTweets();
    fetchReplies();
  }
}, [isAuthenticated, user]);

useEffect(() => {
  if (profileData && profileData._id) {
    fetchLikes();
    fetchBookmarks();
  }
}, [profileData]);

  return (
    <div>
    <section className="wrapper">
      <header className="header">
        <h1>twitter</h1>
        <div className="menu-btn">
          <button onClick={toggleMenu}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="profile">
            <div className={`dropdown ${isMenuOpen ? 'open' : ''}`}>
              {isAuthenticated ? (
                <>
                  <img loading="lazy" src={user.picture} alt={user.name} />
                  <h4>{user.name}!</h4>
                  {profileData && (
                    <>
                      <h4>{profileData._id}</h4>
                    </>
                  )}
                  <h4 className="link">
                    <a href="https://zaap.bio/tricticle">about us</a>
                  </h4>
                  <button onClick={() => { logout(); handleProfile(); }}>Log Out</button>
                </>
              ) : (
                <button onClick={() => { loginWithRedirect(); handleProfile(); }}>Log In</button>
              )}
              {isAuthenticated && user.name === 'tricticle' && (
            <div className="admin-section">
              <button onClick={handleAdmin}>AdminUser</button>
              {adminData && (
                <div className="admin-data">
                  <h3>Admin Data</h3>
                    {adminData.map((adminProfile) => (
                      <h4 key={adminProfile._id}>
                        {adminProfile.username}{' '}
                        <button onClick={() => handleDeleteProfile(adminProfile.username)}>
                          Delete Profile
                        </button>
                      </h4>
                    ))}
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </header>
      </section>
      <div className="adjust">
      <div className="container">
        <div className="post-section">
          <h2>Tweets</h2>
          <div className="tweet-grid">
  {tweets.map((tweet) => (
    <div className="tweet" key={tweet._id}>
      <div className="opos">
      <div className="avatar">
      {tweet.avatar && <img src={tweet.avatar} alt={`${tweet.profile_id} Avatar`} />}
      <div className="user-info">
      <h3>{tweet.username}</h3>
      {tweet.location && tweet.location.placeName && (
        <h6>&nbsp;&nbsp;,<i class="fa-solid fa-location-dot"></i>{tweet.location.placeName}</h6>
      )}
      </div>
    </div>
      <div className="options">
        <i className="fa-solid fa-ellipsis-vertical" onClick={() => toggleOptions(tweet._id)}></i>
        {showOptions === tweet._id && (
          <div className="options-menu">
            {profileData?._id !== tweet.profile_id && (
              <button className="opb" onClick={() => handleBookmark(tweet._id)}>
                <i class="fa-regular fa-bookmark"></i>
                {bookmarkedTweets.includes(tweet._id) ? 'remove' : 'Bookmark'}
              </button>
            )}
            {profileData?._id === tweet.profile_id && (
              <button className="opb" onClick={() => handleDeleteTweet(tweet._id)}>
                <i class="fa-regular fa-trash-can"></i>Delete
              </button>
            )}
          </div>
        )}
      </div>
      </div>
      <div className="tweet-area">
      {tweet.hashtags && (
      <p>{tweet.hashtags.map((tag, index) => (
        <span key={index} className="hashtag"> #{tag}</span>
      ))}</p>
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
                  <button onClick={() => postReply(tweet._id, replyText)}>
                    Reply
                  </button>
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
        <img className="avatar" src={reply.avatar} alt={`${reply.user_id} Avatar`} />
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
      <div className="pos">
          <button className="post-btn" onClick={toggleTweetPost}>
          <i class="fa-regular fa-pen-to-square"></i>
          </button>
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
    </div>
  );
}

const AuthenticatedApp = () => {
  return (
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN || 'your-auth0-domain'}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID || 'your-auth0-client-id'}
      redirectUri={window.location.origin}
    >
      <App />
    </Auth0Provider>
  );
};

export default AuthenticatedApp;
