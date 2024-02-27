// Header.js
import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import SearchResultsPopup from "./SearchResultsPopup";

const Header = ({ profileId, onTweetButtonClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const [adminData, setAdminData] = useState(null);
  const [activeOption, setActiveOption] = useState(null);
  const [isTweetPostVisible, setIsTweetPostVisible] = useState(false);

  const handleOptionClick = (option) => {
    setActiveOption(option === activeOption ? null : option);
  };

  const isActive = (option) => {
    return option === activeOption ? "active" : "";
  };

  const toggleTweetPost = () => {
    setIsTweetPostVisible(!isTweetPostVisible);
    onTweetButtonClick("Tweet button clicked in Header");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(".menu-btn")) {
        closeMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen) {
        closeMenu();
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen]);

  const handleAdmin = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const adminData = await response.json();
        setAdminData(adminData);
        console.log("Admin data:", adminData);
      } else {
        console.error("Failed to fetch admin data");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteProfile = async (username, profileId) => {
    try {
      const response = await fetch(`/api/profile?id=${profileId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      if (response.ok) {
        console.log("Profile deleted successfully");
        handleAdmin(); // Reload admin data after deletion
      } else {
        console.error("Failed to delete profile");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ profiles: [], tweets: [] });
  const [showPopup, setShowPopup] = useState(false);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`/api/search?query=${query}`);
      setResults(response.data);
      setShowPopup(true);
    } catch (error) {
      console.error("Error:", error);
      // Handle error appropriately (e.g., show an error message to the user)
    }
  };

  useEffect(() => {
    // Automatically trigger search when query changes
    if (query.trim() !== "") {
      handleSearch();
    } else {
      // Clear results if the query is empty
      setResults({ profiles: [], tweets: [] });
      setShowPopup(false);
    }
  }, [query]);

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-menu">
        <i className="fab fa-twitter"></i>
        <div
          className={`sidebarOption ${isActive("home")}`}
          onClick={() => handleOptionClick("home")}
        >
          <span className="material-icons">home</span>
          <h2>Home</h2>
        </div>

        <div
          className={`sidebarOption ${isActive("explore")}`}
          onClick={() => handleOptionClick("explore")}
        >
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {showPopup && (
            <SearchResultsPopup results={results} onClose={closePopup} />
          )}
        </div>

        <div
          className={`sidebarOption ${isActive("notifications")}`}
          onClick={() => handleOptionClick("notifications")}
        >
          <span className="material-icons">notifications_none</span>
          <h2>Notifications</h2>
        </div>

        <div
          className={`sidebarOption ${isActive("messages")}`}
          onClick={() => handleOptionClick("messages")}
        >
          <span className="material-icons">mail_outline</span>
          <h2>Messages</h2>
        </div>

        <div
          className={`sidebarOption ${isActive("bookmarks")}`}
          onClick={() => handleOptionClick("bookmarks")}
        >
          <span className="material-icons">bookmark_border</span>
          <h2>Bookmarks</h2>
        </div>

        <div
          className={`sidebarOption ${isActive("lists")}`}
          onClick={() => handleOptionClick("lists")}
        >
          <span className="material-icons">list_alt</span>
          <h2>Lists</h2>
        </div>

        <div
          className={`sidebarOption ${isActive("profile")}`}
          onClick={() => handleOptionClick("profile")}
        >
          <span className="material-icons">perm_identity</span>
          <h2>Profile</h2>
        </div>

        <div
          className={`sidebarOption ${isActive("more")}`}
          onClick={() => handleOptionClick("more")}
        >
          <span className="material-icons">more_horiz</span>
          <h2>More</h2>
        </div>
        <button className="sidebar__tweet" onClick={toggleTweetPost}>
          Tweet
        </button>
      </div>
      <div className="profile">
        <div className="menu-btn">
          {isAuthenticated ? (
            <div className="profile">
              <img
                loading="lazy"
                src={user.picture}
                alt={user.name}
                onClick={toggleMenu}
              />
              <h4>{user.name}!</h4>
              <div className={`dropdown ${isMenuOpen ? "open" : ""}`}>
                <h4>{profileId}</h4>
                <h4 className="link">
                  <a href="https://zaap.bio/tricticle">about us</a>
                </h4>
                <button onClick={() => logout()}>Log Out</button>
                {isAuthenticated && user.name === "tricticle" && (
                  <div className="admin-section">
                    <button onClick={handleAdmin}>AdminUser</button>
                    {adminData && (
                      <div className="admin-data">
                        <h3>Admin Data</h3>
                        {adminData.map((adminProfile) => (
                          <h4 key={adminProfile._id}>
                            {adminProfile.username}{" "}
                            <button
                              onClick={() =>
                                handleDeleteProfile(
                                  adminProfile.username,
                                  adminProfile._id
                                )
                              }
                            >
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
          ) : (
            <button onClick={() => loginWithRedirect()}>Log In</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
