import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Giris from './pages/giris';
import YonetimPaneli from './pages/yonetimpaneli';
import SinavSayfasi from './pages/sinavsayfasi';
import SonucSayfasi from './pages/sonucsayfasi';
import SonucGecmisi from './pages/sonucgecmisi';
function Icerik() {
    const { user, logout } = useAuth();
    const [error, setError] = useState('');
    return <><nav className="navbar"><div className="navbar-brand">📝 SınavSistemi</div><div className="navbar-links">
        {user?.role === 'admin' && <NavLink to="/" end>Yönetim</NavLink>}
        {user && <><NavLink to="/sinav">Sınav</NavLink><NavLink to="/sonuclar">Sonuçlarım</NavLink><span style={{ alignSelf: 'center', overflowWrap: 'anywhere' }}>{user.email}{user.role === 'admin' ? ' · Yönetici' : ''}</span><button className="btn btn-outline btn-sm" onClick={() => logout().catch(() => setError('Çıkış yapılamadı. Bağlantınızı kontrol edin.'))}>Çıkış Yap</button></>}
    </div></nav>{error && <div role="alert" className="container alert alert-danger">{error}</div>}
    <Routes key={user?.id || 'anonim'}>
        <Route path="/giris" element={<Giris />} />
        <Route path="/" element={!user ? <Navigate to="/giris" replace /> : user.role === 'admin' ? <YonetimPaneli /> : <Navigate to="/sinav" replace />} />
        <Route path="/sinav" element={user ? <SinavSayfasi /> : <Navigate to="/giris" replace />} />
        <Route path="/sonuc" element={user ? <SonucSayfasi /> : <Navigate to="/giris" replace />} />
        <Route path="/sonuclar" element={user ? <SonucGecmisi /> : <Navigate to="/giris" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></>;
}
export default function App() { return <Router><AuthProvider><Icerik /></AuthProvider></Router>; }
