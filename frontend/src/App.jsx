import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";

function App() {
  const basename =
    import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
