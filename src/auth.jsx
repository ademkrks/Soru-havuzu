import React, { createContext, useContext, useEffect, useState } from 'react';
const Auth = createContext(null);
export const useAuth = () => useContext(Auth);
export async function apiFetch(url, options) {
    const response = await fetch(url, options);
    if (response.status === 401) window.dispatchEvent(new Event('oturum-bitti'));
    return response;
}
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const refresh = async () => {
        try {
            const response = await fetch('/api/auth/ben');
            if (response.ok) setUser(await response.json());
            else if (response.status === 401) setUser(null);
            else throw new Error();
            setError('');
        } catch { setError('Sunucuya ulaşılamadı. Bağlantınızı kontrol edip sayfayı yenileyin.'); }
        finally { setLoading(false); }
    };
    useEffect(() => {
        refresh();
        const expired = () => setUser(null);
        window.addEventListener('oturum-bitti', expired);
        window.addEventListener('focus', refresh);
        return () => { window.removeEventListener('oturum-bitti', expired); window.removeEventListener('focus', refresh); };
    }, []);
    const logout = async () => {
        const response = await fetch('/api/auth/cikis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        if (!response.ok && response.status !== 401) throw new Error('Çıkış yapılamadı. Yeniden deneyin.');
        sessionStorage.clear(); setUser(null);
    };
    return <Auth.Provider value={{ user, setUser, logout }}>{loading ? <p className="container">Oturum kontrol ediliyor...</p> : error ? <div role="alert" className="container alert alert-danger">{error}<button onClick={refresh} className="btn btn-outline">Yeniden Dene</button></div> : children}</Auth.Provider>;
}
