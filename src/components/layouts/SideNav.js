import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";

const SideNav = ({ profileId, onTweetButtonClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
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

  return (
    <div className="sidebar">
      <div className="sidebar-menu">
        <Link to="/">
          <i className="fa-solid fa-meteor"></i>
        </Link>
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
          to="/Like"
          className={`sidebarOption ${isActive("like")}`}
          onClick={() => handleOptionClick("like")}
        >
          <span className="material-symbols-outlined">favorite</span>
          <h2>Likes</h2>
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
        {isAuthenticated && user.name === "tricticle" && (
          <>
            {" "}
            <Link
              to="/Admin"
              className={`sidebarOption ${isActive("Admin")}`}
              onClick={() => handleOptionClick("Admin")}
            >
              <span className="material-symbols-outlined">
                admin_panel_settings
              </span>
              <h2>Admin</h2>
            </Link>
          </>
        )}
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
                <button onClick={() => logout()}>Log Out</button>
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
