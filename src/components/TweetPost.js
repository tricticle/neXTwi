import React, { useState, useEffect } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const TweetPost = () => {
  const [tweetText, setTweetText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const { isAuthenticated, user } = useAuth0();
  const [profileData, setProfileData] = useState(null);

  const handleProfile = async () => {
    try {
      const response = await axios.post("/api/profile", {
        username: user.name,
        avatar: user.picture,
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
        throw new Error("Failed to add profile");
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

  const postTweet = async () => {
    try {
      // Check if profileData is available
      if (!profileData || !profileData._id) {
        console.error("Profile data is not available");
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
          hashtags: hashtags.split(/[\s,]+/).filter((tag) => tag !== ""),
          location,
        }),
      });

      if (response.ok) {
        console.log("Tweet posted successfully");
        setTweetText("");
        setHashtags("");
      } else {
        console.error("Failed to post tweet");
      }
    } catch (error) {
      console.error("Error:", error);
    }
    };


  return (
    <div className="tpsec">
      <div className="tweet-post-2">
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
    </div>
  );
};

export default TweetPost;
