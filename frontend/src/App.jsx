import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Cuestionario from "./components/Cuestionario";
import Dashboard from "./components/Dashboard";
import AdminCuestionarios from "./components/AdminCuestionarios";
import NavigationBar from "./components/NavigationBar";
import "./styles.css";

export default function App() {
  return (
    <div className="app">
      <Router>
        <NavigationBar />
        <main style={{ marginTop: '70px' }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cuestionario" element={<Cuestionario />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/cuestionarios" element={<AdminCuestionarios />} />
          </Routes>
        </main>
        <footer className="footer">
          STEM Vocational &copy; {new Date().getFullYear()} &middot; Universidad Tecnológica de Bolívar
        </footer>
      </Router>
    </div>
  );
}