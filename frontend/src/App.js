import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import TopBar from "./components/TopBar/TopBar";
import LandingPage from "./pages/LandingPage/LandingPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Cuestionarios from "./pages/Cuestionarios/Cuestionarios";
import Perfil from "./pages/Perfil/Perfil";
import OrientadorDashboard from "./pages/Orientador/OrientadorDashboard";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const hideTopBar =
    location.pathname.toLowerCase().startsWith("/dashboard") ||
    location.pathname.toLowerCase().startsWith("/cuestionarios") ||
    location.pathname.toLowerCase().startsWith("/perfil") ||
    location.pathname.toLowerCase().startsWith("/orientador"); // <-- añade esto

  return (
    <div className="app">
      {!hideTopBar && <TopBar />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cuestionarios" element={<Cuestionarios />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/orientador" element={<OrientadorDashboard />} />
          {/* Add more routes as needed */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} STEM Vocational. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;