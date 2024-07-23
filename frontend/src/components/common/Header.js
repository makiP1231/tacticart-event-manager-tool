import React from 'react';
import { Link } from 'react-router-dom';
import '../../css/common/Header.css';

function Header() {
    return (
        <header className="site-header">
            <div className="site-header-container">
                <h1><Link to="/" className="header-logo">Tacticart Event Manager Tool</Link></h1>
                <nav>
                    <Link to="/artist-login" className="nav-link">Artist Login</Link>
                    <Link to="/admin-login" className="nav-link">Admin Login</Link>
                </nav>
            </div>
        </header>
    );
}

export default Header;
