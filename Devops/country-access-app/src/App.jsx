import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

const CountryPage = ({ name }) => (
  <div style={{ textAlign: "center", marginTop: "3rem" }}>
    <h1>Welcome to {name.toUpperCase()} Page</h1>
    <p>This page is visible only to visitors from {name.toUpperCase()} (we’ll enforce later).</p>
  </div>
);

function App() {
  return (
    <Router>
      <nav style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
        <Link to="/uk">UK</Link>
        <Link to="/us">US</Link>
        <Link to="/in">India</Link>
      </nav>
      <Routes>
        <Route path="/uk" element={<CountryPage name="uk" />} />
        <Route path="/us" element={<CountryPage name="us" />} />
        <Route path="/in" element={<CountryPage name="in" />} />
        <Route path="*" element={<div style={{ textAlign: "center" }}>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
