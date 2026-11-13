import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
export default function Giris() {
    const { user, setUser } = useAuth();
    const [kayit, setKayit] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hata, setHata] = useState('');
    const [busy, setBusy] = useState(false);
    if (user) return <Navigate to={user.role === 'admin' ? '/' : '/sinav'} replace />;
    async function submit(e) {
        e.preventDefault(); setBusy(true); setHata('');
        try {
            const response = await fetch('/api/auth/' + (kayit ? 'kayit' : 'giris'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.hata || 'İşlem tamamlanamadı.');
            setPassword(''); setUser(data);
        } catch (e) { setHata(e.message === 'Failed to fetch' ? 'Sunucuya ulaşılamadı. Yeniden deneyin.' : e.message); }
        finally { setBusy(false); }
    }
    return <main className="gece-login"><div className="gece-login-panel"><section className="gece-login-story"><div><div className="gece-eyebrow">BİLGİNE YENİ BİR ALAN AÇ</div><h2>Bir sonraki seviyen<br />burada başlıyor.</h2><p>Hazırlan, kendini sına ve her denemede ilerlemeni gör.</p></div><div className="gece-orbit" aria-hidden="true"><strong>20:00</strong><span>SENİN ZAMANIN</span></div><div className="gece-login-note"><span className="gece-status-dot" />Sonuçların yalnızca sana ait.</div></section><div className="gece-login-form"><div className="gece-eyebrow">TEKRAR HOŞ GELDİN</div>
        <h1>{kayit ? 'Hesap Oluştur' : 'Giriş Yap'}</h1><p>Sınava girmek ve kendi sonuçlarınızı görmek için giriş yapın.</p>
        {hata && <div role="alert" className="alert alert-danger">{hata}</div>}
        <form onSubmit={submit} style={{ textAlign: 'left' }}>
            <div className="form-group"><label htmlFor="email">E-posta</label><input id="email" className="form-control" type="email" autoComplete="username" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="form-group"><label htmlFor="password">Şifre</label><input id="password" className="form-control" type="password" autoComplete={kayit ? 'new-password' : 'current-password'} minLength={10} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} /><small>En az 10 karakter</small></div>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Bekleyin...' : kayit ? 'Hesap Oluştur' : 'Giriş Yap'}</button>
        </form>
        <button className="btn btn-outline gece-login-toggle" disabled={busy} onClick={() => { setKayit(!kayit); setPassword(''); setHata(''); }}>{kayit ? 'Zaten hesabım var' : 'Yeni hesap oluştur'}</button>
    </div></div></main>;
}
