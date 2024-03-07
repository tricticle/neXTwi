import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = ({ profileId }) => {
  const { isAuthenticated, user } = useAuth0();
  
  return (
    <div className="profile-container">
      <div className="p-back">
        <img src="./assets/p-back.png" alt="background" />
      </div>
          {isAuthenticated && (
            <div className="profi">
              <img
                loading="lazy"
                src={user.picture}
                alt={user.name}
          />
          <div className="padj">
                          <div className="u-info">
              <h4>{user.name}!</h4>
            <h4>{profileId}</h4>
          </div>
          <div className="u-info">
            <a href="https://myaccount.google.com/profile"><i class="fas fa-pen"></i>edit Profile</a>
          </div>
          </div>
            </div>
          )}
    </div>
  );
};

export default Profile;
