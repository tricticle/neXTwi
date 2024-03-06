import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = ({ profileId }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();

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
    <div>
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
              </div>
            </div>
          ) : (
            <button onClick={() => loginWithRedirect()}>Log In</button>
          )}
        </div>
      </div>
      <a href="https://myaccount.google.com/profile">edit proffile</a>
    </div>
  );
};

export default Profile;
