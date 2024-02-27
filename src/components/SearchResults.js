import React, { useState, useEffect } from "react";
import axios from "axios";

const SearchResults = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ profiles: [], tweets: [] });

  const handleSearch = async () => {
    try {
      const response = await axios.get(`/api/search?query=${query}`);
      setResults(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (query.trim() !== "") {
      handleSearch();
    } else {
      setResults({ profiles: [], tweets: [] });
    }
  }, [query]);

  const showPopup = results.profiles.length > 0 || results.tweets.length > 0;

  return (
    <div className="explore">
      <div class="widgets__input">
        <span class="material-icons widgets__searchIcon"> search </span>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            {results.profiles.length > 0 && (
              <div className="pop-prop">
                <h3>Profiles</h3>
                {results.profiles.map((profile) => (
                  <div key={profile._id} className="prop-cont">
                    <img
                      src={profile.avatar}
                      alt={`${profile.username}'s avatar`}
                    />
                    <h4>{profile.username}</h4>
                  </div>
                ))}
              </div>
            )}

            {results.tweets.length > 0 && (
              <div className="pop-prop">
                <h3>Tweets</h3>
                {results.tweets.map((tweet) => (
                  <div key={tweet._id} className="prop-cont-tweet">
                    <h4>{tweet.profile_id}</h4>
                    <p>{tweet.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
