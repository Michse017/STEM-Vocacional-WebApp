import React from 'react';
import './NavigationBar.css';

const NavigationBar = () => {
    return (
        <nav className="navigation-bar">
            <div className="nav-container">
                <div className="nav-brand">
                    <h2>STEM Vocacional</h2>
                </div>
                <div className="nav-links">
                    <a href="/" className="nav-link">Inicio</a>
                    <a href="/login" className="nav-link">Login</a>
                    <a href="/cuestionario" className="nav-link">Cuestionario</a>
                    <a href="/dashboard" className="nav-link">Dashboard</a>
                    <a href="/admin/cuestionarios" className="nav-link admin-link">Admin</a>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;