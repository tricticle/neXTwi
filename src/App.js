import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import TweetPost from "./components/TweetPost";
import SearchResults from "./components/layouts/SearchResults";
import Tweet from "./components/Tweet";
import Admin from "./components/layouts/Admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route path="home" element={<Tweet />} />
          <Route path="explore" element={<SearchResults />} />
          <Route path="Admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
