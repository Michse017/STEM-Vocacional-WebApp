import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Cuestionario from "./components/Cuestionario";
import Dashboard from "./components/Dashboard";
import "./styles.css";

export default function App() {
  return (
    <div className="app">
      <Router>
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cuestionario" element={<Cuestionario />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <footer className="footer">
          STEM Vocational &copy; {new Date().getFullYear()} &middot; Universidad Tecnológica de Bolívar
        </footer>
      </Router>
    </div>
  );
}