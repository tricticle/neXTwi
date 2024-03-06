import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";

const SideNav = ({ profileId, onTweetButtonClick, onSomeClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const [adminData, setAdminData] = useState(null);
  const [activeOption, setActiveOption] = useState(null);
  const [isTweetPostVisible, setIsTweetPostVisible] = useState(false);

  const handleOptionClick = (option) => {
          if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
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

  return (
    <div className="sidebar">
      <div className="sidebar-menu">
        <i className="fab fa-twitter"></i>
        <Link
          to="/home"
          className={`sidebarOption ${isActive("home")}`}
          onClick={() => handleOptionClick("home")}
        >
          <span className="material-icons">home</span>
          <h2>Home</h2>
        </Link>
        <Link
          to="/Explore"
          className={`sidebarOption ${isActive("explore")}`}
          onClick={() => handleOptionClick("explore")}
        >
          <span className="material-icons">search</span>
          <h2>Explore</h2>
        </Link>
        <Link
          to="/Notifications"
          className={`sidebarOption ${isActive("notifications")}`}
          onClick={() => handleOptionClick("notifications") || onSomeClick()}
        >
          <span className="material-icons">notifications_none</span>
          <h2>Notifications</h2>
        </Link>
        <Link
          to="/Messages"
          className={`sidebarOption ${isActive("messages")}`}
          onClick={() => handleOptionClick("messages") || onSomeClick()}
        >
          <span className="material-icons">mail_outline</span>
          <h2>Messages</h2>
        </Link>
        <Link
          to="/Bookmarks"
          className={`sidebarOption ${isActive("bookmarks")}`}
          onClick={() => handleOptionClick("bookmarks")}
        >
          <span className="material-icons">bookmark_border</span>
          <h2>Bookmarks</h2>
        </Link>
        <Link
          to="/Profile"
          className={`sidebarOption ${isActive("profile")}`}
          onClick={() => handleOptionClick("profile")}
        >
          <span className="material-icons">perm_identity</span>
          <h2>Profile</h2>
        </Link>
        <Link
          to="/Admin"
          className={`sidebarOption ${isActive("Admin")}`}
          onClick={() => handleOptionClick("Admin")}
        >
          <span className="material-icons">more_horiz</span>
          <h2>admin</h2>
        </Link>
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

export default SideNav;
