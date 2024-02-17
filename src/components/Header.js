// Header.js
import React, { useState, useEffect } from "react";
import { useAuth0 } from '@auth0/auth0-react';

const Header = ({ profileId }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const [adminData, setAdminData] = useState(null);

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

  return (
    <header className="header">
      <h1>twitter</h1>
        <div className="menu-btn">
            {isAuthenticated ? (
              <div className="profile">
                <img loading="lazy" src={user.picture} alt={user.name} onClick={toggleMenu} />
                <div className={`dropdown ${isMenuOpen ? 'open' : ''}`}>
                <h4>{user.name}!</h4>
                <h4>{profileId}</h4>
                <h4 className="link">
                  <a href="https://zaap.bio/tricticle">about us</a>
                </h4>
                <button onClick={() => logout()}>Log Out</button>
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
            ) : (
              <button onClick={() => loginWithRedirect()}>Log In</button>
            )}
          </div>
    </header>
  );
};

export default Header;
