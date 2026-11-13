import { apiFetch, useAuth } from '../auth';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SonucGecmisi() {
    const [sonuclar, setSonuclar] = useState([]);
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(true);
    const yonlendir = useNavigate();

    useEffect(() => {
        apiFetch('/api/sonuclar')
            .then((yanit) => { if (!yanit.ok) throw new Error(); return yanit.json(); })
            .then((veri) => {
                setSonuclar(veri);
                setYukleniyor(false);
            })
            .catch(() => { setHata('Sonuçlar yüklenemedi. Sayfayı yenileyerek tekrar deneyin.'); setYukleniyor(false); });
    }, []);

    const tarihFormatla = (tarihStr) => {
        const t = new Date(tarihStr);
        return t.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const puanRengi = (dogru, toplam) => {
        const yuzde = (dogru / toplam) * 100;
        if (yuzde >= 90) return 'var(--accent-success)';
        if (yuzde >= 70) return 'var(--accent-primary-light)';
        if (yuzde >= 50) return 'var(--accent-warning)';
        return 'var(--accent-danger)';
    };

    if (yukleniyor) {
        return (
            <div className="container loading-state">
                <div className="spinner" style={{ width: 40, height: 40 }}></div>
                <p>Sonuçlar yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1>Sınav Geçmişi</h1>
                <p>Geçmiş sınav sonuçlarınızı görüntüleyin</p>
            </div>

            {hata ? <div role="alert" className="alert alert-danger">{hata}</div> : sonuclar.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h3>Henüz sınav yapılmadı</h3>
                    <p>Sonuçlarınızı burada görmek için bir sınava girin</p>
                    <button
                        className="btn btn-primary btn-lg"
                        style={{ marginTop: '1rem' }}
                        onClick={() => yonlendir('/sinav')}
                    >
                        🚀 Sınava Gir
                    </button>
                </div>
            ) : (
                <div className="results-history">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Puan</th>
                                <th>Doğru</th>
                                <th>Yanlış</th>
                                <th>Yüzde</th>
                                <th>Boş</th><th>Tarih</th><th>İncele</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sonuclar.map((s, idx) => {
                                const yuzde = Math.round((s.dogru_sayisi / s.toplam_soru) * 100);
                                return (
                                    <tr key={s.id}>
                                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                                        <td>
                                            <strong style={{ color: puanRengi(s.dogru_sayisi, s.toplam_soru) }}>
                                                {s.puan}
                                            </strong>
                                        </td>
                                        <td style={{ color: 'var(--accent-success)' }}>{s.dogru_sayisi}</td>
                                        <td style={{ color: 'var(--accent-danger)' }}>{s.yanlis_sayisi}</td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${puanRengi(s.dogru_sayisi, s.toplam_soru)}22`,
                                                    color: puanRengi(s.dogru_sayisi, s.toplam_soru),
                                                }}
                                            >
                                                %{yuzde}
                                            </span>
                                        </td>
                                        <td>{s.bos_sayisi}</td><td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {tarihFormatla(s.tarih)}
                                        </td><td><button className="btn btn-outline btn-sm" onClick={() => yonlendir('/sonuc', { state: { sonuc: { id: s.id } } })}>İncele</button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default SonucGecmisi;
