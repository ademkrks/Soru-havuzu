import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import YonetimPaneli from './pages/yonetimpaneli';
import SinavSayfasi from './pages/sinavsayfasi';
import SonucSayfasi from './pages/sonucsayfasi';
import SonucGecmisi from './pages/sonucgecmisi';

function Gezinme() {
    return (
        <nav className="navbar">
            <div className="navbar-brand">📝 SınavSistemi</div>
            <div className="navbar-links">
                <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Yönetim</NavLink>
                <NavLink to="/sinav" className={({ isActive }) => isActive ? 'active' : ''}>Sınav</NavLink>
                <NavLink to="/sonuclar" className={({ isActive }) => isActive ? 'active' : ''}>Sonuçlar</NavLink>
            </div>
        </nav>
    );
}

function App() {
    return (
        <Router>
            <Gezinme />
            <Routes>
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/" element={<YonetimPaneli />} />
                <Route path="/sinav" element={<SinavSayfasi />} />
                <Route path="/sonuc" element={<SonucSayfasi />} />
                <Route path="/sonuclar" element={<SonucGecmisi />} />
            </Routes>
        </Router>
    );
}

export default App;
