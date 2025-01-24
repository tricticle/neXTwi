# Nextwi

Nextwi is a clone of Twitter with its basic functionalities, allowing users to experience a microblogging platform with essential features.

## Nextwi Preview

![Nextwi Home](https://github.com/tricticle/neXTwi/blob/main/public/assets/home.png)
![Nextwi Logged In User](https://github.com/tricticle/neXTwi/blob/main/public/assets/logged_in.png)
![Nextwi Search](https://github.com/tricticle/neXTwi/blob/main/public/assets/Search.png)
![Nextwi Likes](https://github.com/tricticle/neXTwi/blob/main/public/assets/likes.png)
![Nextwi Bookmarks](https://github.com/tricticle/neXTwi/blob/main/public/assets/bookmarks.png)
![Nextwi User Profile](https://github.com/tricticle/neXTwi/blob/main/public/assets/profile.png)
![Nextwi Admin User manage](https://github.com/tricticle/neXTwi/blob/main/public/assets/admin_user_manage.png)
![Nextwi Admin Tweet manage](https://github.com/tricticle/neXTwi/blob/main/public/assets/admin_tweet_manage.png)
![Nextwi Admin Ban manage](https://github.com/tricticle/neXTwi/blob/main/public/assets/admin_ban_manage.png)


## Features

- User creation and authentication
- Post and share tweets
- Like and bookmark tweets
- Search for tweets and users
- Add geolocation
- Follow users
- Delete own tweets

## Admin Features

- Delete Users Profile
- Ban inappropriate tweet words to prevent posting
- Manage tweets
- Delete appropriate tweets and users

## Dependencies

- Node.js
- MongoDB

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/nextwi.git
   ```
2. Navigate to the project directory:
   ```sh
   cd nextwi
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Create a `.env` file in the root directory and add the following variables:
   ```sh
   REACT_APP_AUTH0_CLIENT_ID=your_auth0_client_id
   REACT_APP_AUTH0_DOMAIN=your_auth0_domain
   MONGODB_URI=your_mongodb_uri
   ```
5. Log in to Vercel:
   ```sh
   vercel login
   ```
6. Start the development server:
   ```sh
   vercel dev
   ```

## Contributing

Contributions are welcome! Feel free to open issues and submit pull requests.

## License

This project is licensed under the MIT License.

