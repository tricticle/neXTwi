# Nextwi

Nextwi is a clone of Twitter with its basic functionalities, allowing users to experience a microblogging platform with essential features.

## Nextwi Preview

![Nextwi Preview](assets/nextwi-preview.png)


## Features

- User creation and authentication
- Post and share tweets
- Like and bookmark tweets
- Search for tweets and users
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

