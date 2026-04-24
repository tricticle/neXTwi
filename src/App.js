import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import SearchResults from "./components/layouts/SearchResults";
import Tweet from "./components/Tweet";
import Admin from "./components/layouts/Admin";
import Bookmarks from "./components/layouts/Bookmarks";
import Like from "./components/Like";
import Profile from "./components/layouts/Profile";
import UserProfile from "./components/UserProfile";

function App() {
  const { isAuthenticated, user } = useAuth0();
  const [profileData, setProfileData] = useState(null);

  const addProfile = useCallback(async () => {
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
        const data = await response.json();

        if (data.username === user.name) {
          setProfileData(data);
          console.log("Profile ID:", data._id);
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
      try {
        const response = await axios.post("/api/profile", {
          username: user.name,
          avatar: user.picture,
        });
        console.log(response.data.message);
        await addProfile();
      } catch (err) {
        console.error("Error creating profile:", err);
      }
    }
  }, [user?.name, user?.sub, user?.picture]);

  useEffect(() => {
    if (isAuthenticated && user) {
      addProfile();
    }
  }, [isAuthenticated, user, addProfile]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route index element={<Tweet />} />
          <Route path="home" element={<Tweet />} />
          <Route path="explore" element={<SearchResults />} />
          <Route path="Like" element={<Like />} />
          <Route path="Bookmarks" element={<Bookmarks />} />
          <Route path="userprofile/:userId" element={<UserProfile />} />
          <Route
            path="Profile"
            element={
              <Profile profileId={profileData ? profileData._id : null} />
            }
          />
          <Route path="Admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
