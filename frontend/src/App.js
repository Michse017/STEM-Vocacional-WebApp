"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TopBar from "./components/TopBar/TopBar";
import LandingPage from "./components/LandingPage/LandingPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <TopBar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            {/* Add more routes as needed */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} STEM Vocational. Todos los derechos reservados.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;