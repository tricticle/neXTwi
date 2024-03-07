import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Admin = () => {
  const { isAuthenticated, user } = useAuth0();
  const [adminData, setAdminData] = useState(null);

  const fetchAdminData = async () => {
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

  useEffect(() => {
    // Fetch admin data when component mounts
    if (isAuthenticated && user.name === "tricticle") {
      fetchAdminData();
    }
  }, [isAuthenticated, user.name]); // Fetch data when authentication status or username changes

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
        fetchAdminData(); // Reload admin data after deletion
      } else {
        console.error("Failed to delete profile");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      {isAuthenticated && user.name === "tricticle" && (
        <div className="admin-section">
          {adminData && (
            <div className="ad-man">
              {adminData.map((adminProfile) => (
                <div key={adminProfile._id} className="admin-profile">
                  <img src={adminProfile.avatar} alt={adminProfile.username} />
                  <div className="u-info">
                    <h3>{adminProfile.username}</h3>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Admin;
