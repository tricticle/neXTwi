import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const Admin = () => {
  const { isAuthenticated, user, loginWithRedirect } = useAuth0();
  const [adminData, setAdminData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
   const [tweets, setTweets] = useState([]);
  const [selectedTweets, setSelectedTweets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('UserManage');
  const [blocklistWords, setBlocklistWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWords, setSelectedWords] = useState([]);
  const [newWord, setNewWord] = useState([]);

  useEffect(() => {
    fetchBlocklistWords();
  }, []);

  const fetchBlocklistWords = async () => {
    try {
      const response = await axios.get('/api/blocklist');
      setBlocklistWords(response.data);
      setFilteredWords(response.data);
    } catch (error) {
      console.error('Error fetching blocklist words:', error);
    }
  };

  const handleWordSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTerm(searchTerm);
    const filtered = blocklistWords.filter(word =>
      word.toLowerCase().includes(searchTerm)
    );
    setFilteredWords(filtered);
  };

  const handleAddWord = async () => {
  try {
    await axios.post('/api/blocklist', { word: newWord });
    setNewWord('');
    fetchBlocklistWords();
  } catch (error) {
    console.error('Error adding word to blocklist:', error);
  }
};


  const handleWordCheckboxChange = (word) => {
    const isSelected = selectedWords.includes(word);
    if (isSelected) {
      setSelectedWords(selectedWords.filter(selected => selected !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleDeleteSingleWord = async (wordToDelete) => {
  try {
    await axios.delete('/api/blocklist', { data: { word: wordToDelete } });
    fetchBlocklistWords();
  } catch (error) {
    console.error('Error deleting word from blocklist:', error);
  }
};


  const handleWordDeleteSelected = async () => {
    try {
      await Promise.all(selectedWords.map(async (word) => {
        await axios.delete('/api/blocklist', { data: { word } });
      }));
      setSelectedWords([]);
      fetchBlocklistWords();
    } catch (error) {
      console.error('Error deleting selected words from blocklist:', error);
    }
  };

  const handleTabClick = (tab) => {
        if (!isAuthenticated) {
        loginWithRedirect();
        return;
      }
    setActiveTab(tab);
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    try {
      const response = await axios.get('/api/tweet');
      setTweets(response.data);
    } catch (error) {
      console.error('Error fetching tweets:', error);
    }
  };

  const handleSearch = async () => {
    try {
      let filteredTweets = [];

      const [searchQuery, profileId] = searchText.split('@').map(str => str.trim());

      if (searchQuery) {
        const response = await axios.get(`/api/tweet?search=${searchQuery}`);
        filteredTweets = response.data.filter(tweet =>
          tweet.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
      } else if (profileId) {
        const response = await axios.get(`/api/tweet?profile_id=${profileId}`);
        filteredTweets = response.data;
      } else {
        // If no search query or profile ID is provided, fetch all tweets
        fetchTweets();
        return;
      }

      setTweets(filteredTweets);
    } catch (error) {
      console.error('Error searching tweets:', error);
      setTweets([]); // Resetting tweets to an empty array in case of error
    }
  };

  const handleDeleteTweet = async (tweetId) => {
  try {
    await axios.delete('/api/tweet', { data: { tweet_id: tweetId } });
    // Remove the deleted tweet from the UI
    setTweets(tweets.filter(tweet => tweet._id !== tweetId));
  } catch (error) {
    console.error('Error deleting tweet:', error);
  }
};

  const handleDeleteSelected = async () => {
    try {
      await axios.delete('/api/tweet', { data: { tweet_id: selectedTweets } });
      // Remove deleted tweets from UI
      setTweets(tweets.filter(tweet => !selectedTweets.includes(tweet._id)));
      setSelectedTweets([]);
    } catch (error) {
      console.error('Error deleting tweets:', error);
    }
  };

  const handleCheckboxChange = (tweetId) => {
    if (selectedTweets.includes(tweetId)) {
      setSelectedTweets(selectedTweets.filter(id => id !== tweetId));
    } else {
      setSelectedTweets([...selectedTweets, tweetId]);
    }
  };

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

  const handleDeleteProfile = async (profileId) => {
    try {
      const response = await fetch(`/api/profile?id=${profileId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
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

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredAdminData = adminData ? adminData.filter(profile => profile.username.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  return (
    <div className="back-cen">
        <div className="post-tab">
        <button onClick={() => handleTabClick('UserManage')} className={`post-button ${activeTab === 'UserManage' ? 'active' : ''}`}><i class="fa-solid fa-sliders"></i>User Manage</button>
        <button onClick={() => handleTabClick('TweetManage')} className={`post-button ${activeTab === 'TweetManage' ? 'active' : ''}`}><i class="fa-solid fa-list"></i>Tweet Manage</button>
        <button onClick={() => handleTabClick('banManage')} className={`post-button ${activeTab === 'banManage' ? 'active' : ''}`}><i class="fa-solid fa-ban"></i>Ban Manage</button>
      </div>
      {activeTab === 'UserManage' && (
      <>
      {isAuthenticated && user.name === "tricticle" && (
        <div className="admin-section">
          <div className="widgets__input">
            <span class="material-icons widgets__searchIcon"> search </span>
            <input
              type="text"
              placeholder="Search user..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          {filteredAdminData.length > 0 ? (
            <div className="ad-man">
              {filteredAdminData.map((adminProfile) => (
                <div key={adminProfile._id} className="admin-profile">
                  <img src={adminProfile.avatar} alt={adminProfile.username} />
                  <div className="u-info">
                    <h3>{adminProfile.username}</h3>
                    <button
                      onClick={() => handleDeleteProfile(adminProfile._id)}
                    >
                      Delete Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No matching users found.</p>
          )}
        </div>
          )}
          </>
      )}
      {activeTab === 'TweetManage' && (
        <div className="back-center">
          <h1>Tweet Management</h1>
          <div className="back-grey">
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="tweet or @profileId" />
            <button className="search-tweet" onClick={handleSearch}>Search</button>
          </div>
          <table className="tweet-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Tweet Text</th>
                <th>Profile ID</th>
                <th>Hashtags</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tweets.map(tweet => (
                <tr key={tweet._id}>
                  <td><input type="checkbox" onChange={() => handleCheckboxChange(tweet._id)} checked={selectedTweets.includes(tweet._id)} /></td>
                  <td>{tweet.text}</td>
                  <td>{tweet.profile_id}</td>
                  <td>{tweet.hashtags.join(', ')}</td>
                  <td>{tweet.location ? tweet.location.placeName : ''}</td>
                  <td>
                    <button className="delete-button" onClick={() => handleDeleteTweet(tweet._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="delete-button" onClick={handleDeleteSelected} disabled={selectedTweets.length === 0}>Delete Selected Tweets</button>
        </div>
      )}
      {activeTab === 'banManage' && (
<div className="back-center">
      <h2>Blocklist Words</h2>
      <div className="back-grey">
        <input
          type="text"
          value={searchTerm}
          onChange={handleWordSearch}
          placeholder="Search..."
        />
          </div>
          <div className="back-grey">
  <input
    type="text"
    value={newWord}
    onChange={(e) => setNewWord(e.target.value)}
    placeholder="Enter a new word"
  />
  <button className="search-tweet" onClick={handleAddWord}><i class="fa-solid fa-ban"></i>Ban</button>
      </div>
          <table className="tweet-table">
        <thead>
          <tr>
            <th></th>
                <th>Word</th>
                <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredWords.map((word, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedWords.includes(word)}
                  onChange={() => handleWordCheckboxChange(word)}
                />
              </td>
              <td>{word}</td>
              <td>
        <button className="delete-button" onClick={() => handleDeleteSingleWord(word)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button className="delete-button" onClick={handleWordDeleteSelected} disabled={selectedWords.length === 0}>Delete Selected</button>
      </div>
    </div>
      )}
    </div>
  );
};

export default Admin;
