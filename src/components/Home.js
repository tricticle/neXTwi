import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import SideNav from "./layouts/SideNav";
import { toast } from "react-toastify";
import SearchResults from "./layouts/SearchResults";
import { Outlet } from "react-router-dom";

const Home = () => {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [profileData, setProfileData] = useState(null);
  const [tweetText, setTweetText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [isTweetPostVisible, setIsTweetPostVisible] = useState(false);

  const handleTweetButtonClick = () => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    setIsTweetPostVisible(!isTweetPostVisible);
  };

  const handleSubscribeClick = () => {
    alert("feature coming soon!");
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
        toast.success("Tweet posted successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setTweetText("");
        setHashtags("");
      } else {
        const data = await response.json();
        if (
          response.status === 400 &&
          data.error === "Tweet contains blocked words"
        ) {
          alert(`Tweet contains blocked word: ${data.blockedWord}`);
        } else {
          console.error("Failed to post tweet");
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      addProfile();
    }
  }, [isAuthenticated, user]);

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
