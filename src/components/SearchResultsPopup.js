import React from 'react';

const SearchResultsPopup = ({ results, onClose }) => {
  return (
    <div className="popup">
      <div className="popup-content">
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
        {results.profiles.length > 0 && (
          <div className='pop-prop'>
            <h3>Profiles</h3>
            {results.profiles.map((profile) => (
              <div key={profile._id} className='prop-cont'>
                <img src={profile.avatar} alt={`${profile.username}'s avatar`} />
                <h4>{profile.username}</h4>
              </div>
            ))}
          </div>
        )}

        {results.tweets.length > 0 && (
          <div className='pop-prop'>
            <h3>Tweets</h3>
            {results.tweets.map((tweet) => (
              <div key={tweet._id} className='prop-cont-tweet'>
                <h4>{tweet.profile_id}</h4>
                <p>{tweet.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPopup;
