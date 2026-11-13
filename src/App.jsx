import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Giris from './pages/giris';
import YonetimPaneli from './pages/yonetimpaneli';
import SinavSayfasi from './pages/sinavsayfasi';
import SonucSayfasi from './pages/sonucsayfasi';
import SonucGecmisi from './pages/sonucgecmisi';
function Icerik() {
    const { user, logout } = useAuth();
    const [error, setError] = useState('');
    const { pathname } = useLocation();
    const title = ({ '/': 'Soru havuzu', '/sinav': 'Sınav alanı', '/sonuc': 'Sınav sonucu', '/sonuclar': 'Sonuçlarım' })[pathname] || 'Çalışma alanı';
    return <div className={`gece-shell ${user ? '' : 'gece-public'}`}>
        {user && <aside className="gece-sidebar">
            <NavLink to={user.role === 'admin' ? '/' : '/sinav'} className="gece-brand"><span aria-hidden="true">✳</span>soru.space</NavLink>
            <div className="gece-nav-label">ÇALIŞMA ALANI</div>
            <nav aria-label="Ana gezinme" className="gece-nav">
                <NavLink to="/sinav"><span aria-hidden="true">◈</span>Sınav</NavLink>
                <NavLink to="/sonuclar"><span aria-hidden="true">▥</span>Sonuçlarım</NavLink>
                {user.role === 'admin' && <NavLink to="/" end><span aria-hidden="true">▦</span>Soru havuzu</NavLink>}
            </nav>
            <div className="gece-account"><span className="gece-avatar" aria-hidden="true">{user.email.slice(0, 2).toUpperCase()}</span><div><strong>{user.email}</strong><small>{user.role === 'admin' ? 'Yönetici' : 'Öğrenci hesabı'}</small></div></div>
            <button className="btn btn-outline gece-logout" onClick={() => logout().catch(() => setError('Çıkış yapılamadı. Bağlantınızı kontrol edin.'))}>Çıkış yap <span aria-hidden="true">↗</span></button>
        </aside>}
        <div className="gece-workspace">
            <header className="gece-topbar">{user ? <><span>Çalışma alanı <span className="gece-slash">/</span> <strong>{title}</strong></span><span className="gece-top-note"><span className="gece-status-dot" />Kişisel sınav alanın</span></> : <><div className="gece-brand"><span aria-hidden="true">✳</span>soru.space</div><span className="gece-top-note">Her denemede bir adım ileri.</span></>}</header>
            {error && <div role="alert" className="container alert alert-danger">{error}</div>}
            <Routes key={user?.id || 'anonim'}>
                <Route path="/giris" element={<Giris />} />
                <Route path="/" element={!user ? <Navigate to="/giris" replace /> : user.role === 'admin' ? <YonetimPaneli /> : <Navigate to="/sinav" replace />} />
                <Route path="/sinav" element={user ? <SinavSayfasi /> : <Navigate to="/giris" replace />} />
                <Route path="/sonuc" element={user ? <SonucSayfasi /> : <Navigate to="/giris" replace />} />
                <Route path="/sonuclar" element={user ? <SonucGecmisi /> : <Navigate to="/giris" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    </div>;
}
export default function App() { return <Router><AuthProvider><Icerik /></AuthProvider></Router>; }
