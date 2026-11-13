import React, { useEffect, useState } from 'react';
import { apiFetch, useAuth } from '../auth';
import { useLocation, useNavigate } from 'react-router-dom';

function SonucSayfasi() {
    const konum = useLocation();
    const yonlendir = useNavigate();
    const { user } = useAuth();
    const [sonuc, setSonuc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hata, setHata] = useState('');
    let kayit;
    try { kayit = JSON.parse(sessionStorage.getItem('sonuc:' + user.id)); } catch {}
    const resultId = konum.state?.sonuc?.id || kayit?.id;
    useEffect(() => {
        let active = true;
        setLoading(true); setSonuc(null); setHata('');
        if (!resultId) { setLoading(false); return; }
        apiFetch('/api/sonuclar/' + encodeURIComponent(resultId))
            .then(async r => { if (!r.ok) throw new Error('Sonuç bulunamadı veya bu hesaba ait değil.'); return r.json(); })
            .then(data => { if (active) setSonuc(data); })
            .catch(e => { if (active) setHata(e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [resultId, user.id]);
    if (loading) return <p className="container">Sonuç yükleniyor...</p>;

    if (!sonuc) {
        return (
            <div className="container exam-setup">
                <div className="card exam-setup-card">
                    <h2>Sonuç Yok</h2>{hata && <div role="alert" className="alert alert-danger">{hata}</div>}
                    <p>Henüz bir sınava girmediniz.</p>
                    <button className="btn btn-primary btn-lg" onClick={() => yonlendir('/sinav')}>
                        Sınava Git
                    </button>
                </div>
            </div>
        );
    }

    const { puan, dogru_sayisi, yanlis_sayisi, bos_sayisi, toplam_soru, yuzde, detaylar } = sonuc;

    const notHesapla = () => {
        if (yuzde >= 90) return 'excellent';
        if (yuzde >= 70) return 'good';
        if (yuzde >= 50) return 'average';
        return 'poor';
    };

    const notEmojisi = () => {
        if (yuzde >= 90) return '';
        if (yuzde >= 70) return '';
        if (yuzde >= 50) return '';
        return '';
    };

    const notMetni = () => {
        if (yuzde >= 90) return 'Mükemmel';
        if (yuzde >= 70) return 'İyi';
        if (yuzde >= 50) return 'Orta';
        return 'Yetersiz';
    };

    const not = notHesapla();

    return (
        <div className="container">
            <div className="page-header"><div className="gece-eyebrow">DENEME TAMAMLANDI</div><h1>Bir adım daha ileri.</h1><p>Sonucunu gör, cevaplarını incele ve bir sonraki denemene hazırlan.</p></div><div className="result-hero" style={{ animation: 'scaleIn 0.5s ease' }}>
                <div className={`score-circle ${not}`} style={{ '--score-progress': `${yuzde}%` }}>
                    <div className="score-value">{puan}</div>
                    <div className="score-label">Puan</div>
                </div>

                <div className="score-percentage">
                    {notEmojisi()} %{yuzde} — {notMetni()}
                </div>

                <div className="result-stats">
                    <div className="stat-card">
                        <div className="stat-value correct">{dogru_sayisi}</div>
                        <div className="stat-label">Doğru</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value wrong">{yanlis_sayisi}</div>
                        <div className="stat-label">Yanlış</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{bos_sayisi || 0}</div>
                        <div className="stat-label">Boş</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value total">{toplam_soru}</div>
                        <div className="stat-label">Toplam</div>
                    </div>
                </div>

                {/* Basit çubuk grafik */}
                <div className="card chart-container">
                    <div className="card-title"> Puan Dağılımı</div>
                    <div className="chart-bar-wrapper">
                        <div className="chart-bar-row">
                            <div className="chart-bar-label">Doğru</div>
                            <div className="chart-bar-track">
                                <div
                                    className="chart-bar-fill correct-bar"
                                    style={{ width: `${(dogru_sayisi / toplam_soru) * 100}%` }}
                                >
                                    {dogru_sayisi}
                                </div>
                            </div>
                        </div>
                        <div className="chart-bar-row">
                            <div className="chart-bar-label">Yanlış</div>
                            <div className="chart-bar-track">
                                <div
                                    className="chart-bar-fill wrong-bar"
                                    style={{ width: `${(yanlis_sayisi / toplam_soru) * 100}%` }}
                                >
                                    {yanlis_sayisi}
                                </div>
                            </div>
                        </div>
                        {(bos_sayisi || 0) > 0 && (
                            <div className="chart-bar-row">
                                <div className="chart-bar-label">Boş</div>
                                <div className="chart-bar-track">
                                    <div
                                        className="chart-bar-fill"
                                        style={{
                                            width: `${(bos_sayisi / toplam_soru) * 100}%`,
                                            background: 'var(--accent-warning)'
                                        }}
                                    >
                                        {bos_sayisi}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-lg" onClick={() => yonlendir('/sinav')}>
                         Tekrar Sınava Gir
                    </button>
                    <button className="btn btn-outline btn-lg" onClick={() => yonlendir('/sonuclar')}>
                         Geçmişi Gör
                    </button>
                </div>
            </div>

            {/* Detaylı inceleme */}
            {detaylar && detaylar.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 700 }}> Soru İnceleme</h2>
                    <div className="review-list">
                        {detaylar.map((d, idx) => (
                            <div
                                key={d.soru_id}
                                className={`review-item ${d.bos_mu ? 'review-blank' : d.dogru_mu ? 'review-correct' : 'review-wrong'}`}
                            >
                                <div className="review-question-text">
                                    {idx + 1}. {d.soru_metni}
                                </div>
                                <div className="review-answer-row">
                                    <span className="review-your-answer">
                                        Cevabınız: <strong>{d.secilen_cevap || 'Boş bırakıldı'}</strong>
                                        {d.secilen_cevap && ` (${d['secenek_' + d.secilen_cevap.toLowerCase()] || ''})`}
                                    </span>
                                    <span className="review-correct-answer">
                                        ✓ Doğru: <strong>{d.dogru_cevap}</strong>
                                        {` (${d['secenek_' + d.dogru_cevap.toLowerCase()] || ''})`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SonucSayfasi;
