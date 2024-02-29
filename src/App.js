import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import TweetPost from "./components/TweetPost";
import SearchResults from "./components/layouts/SearchResults";
import Tweet from "./components/Tweet";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route path="home" element={<Tweet />} />
          <Route path="explore" element={<SearchResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
