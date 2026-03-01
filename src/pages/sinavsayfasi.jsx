import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function SinavSayfasi() {
    const yonlendir = useNavigate();

    // Sınav aşamaları: 'hazirlik' | 'aktif' | 'gonderiliyor'
    const [asama, setAsama] = useState('hazirlik');
    const [kategoriler, setKategoriler] = useState([]);
    const [seciliKategori, setSeciliKategori] = useState('');
    const [sorular, setSorular] = useState([]);
    const [cevaplar, setCevaplar] = useState({});
    const [kalanSure, setKalanSure] = useState(20 * 60);
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);
    const [onayModalGoster, setOnayModalGoster] = useState(false);
    const zamanlayiciRef = useRef(null);

    // Sayfa yüklendiğinde kategorileri getir
    useEffect(() => {
        fetch('/sorular/kategoriler')
            .then((yanit) => yanit.json())
            .then((veri) => setKategoriler(veri))
            .catch(() => { });
    }, []);

    // Zamanlayıcı
    useEffect(() => {
        if (asama !== 'aktif') return;

        zamanlayiciRef.current = setInterval(() => {
            setKalanSure((onceki) => {
                if (onceki <= 1) {
                    clearInterval(zamanlayiciRef.current);
                    sinaviGonder(true);
                    return 0;
                }
                return onceki - 1;
            });
        }, 1000);

        return () => clearInterval(zamanlayiciRef.current);
    }, [asama]);

    const zamaniFormatla = (saniye) => {
        const dk = Math.floor(saniye / 60).toString().padStart(2, '0');
        const sn = (saniye % 60).toString().padStart(2, '0');
        return `${dk}:${sn}`;
    };

    const zamanlayiciSinifi = () => {
        if (kalanSure <= 60) return 'timer danger';
        if (kalanSure <= 5 * 60) return 'timer warning';
        return 'timer';
    };

    const sinaviBaslat = async () => {
        setYukleniyor(true);
        setHata('');
        try {
            const url = seciliKategori
                ? `/sinav/baslat?kategori=${encodeURIComponent(seciliKategori)}`
                : '/sinav/baslat';
            const yanit = await fetch(url);
            const veri = await yanit.json();

            if (!yanit.ok) {
                setHata(veri.hata || 'Sınav başlatılamadı');
            } else {
                setSorular(veri.sorular);
                setCevaplar({});
                setKalanSure(20 * 60);
                setAsama('aktif');
            }
        } catch {
            setHata('Ağ hatası. Backend çalışıyor mu?');
        } finally {
            setYukleniyor(false);
        }
    };

    const cevapSec = (soruId, cevap) => {
        setCevaplar((onceki) => ({ ...onceki, [soruId]: cevap }));
    };

    // Gönder butonuna basıldığında onay modalı göster
    const gonderOnayiGoster = () => {
        setOnayModalGoster(true);
    };

    const sinaviGonder = useCallback(async (otomatik = false) => {
        if (asama === 'gonderiliyor') return;

        setOnayModalGoster(false);
        setAsama('gonderiliyor');
        clearInterval(zamanlayiciRef.current);

        const cevapVerisi = sorular.map((s) => ({
            soru_id: s.id,
            secilen_cevap: cevaplar[s.id] || null,
        }));

        try {
            const yanit = await fetch('/sinav/gonder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cevaplar: cevapVerisi }),
            });
            const veri = await yanit.json();

            if (yanit.ok) {
                yonlendir('/sonuc', { state: { sonuc: veri } });
            } else {
                setHata(veri.hata || 'Gönderim başarısız');
                setAsama('aktif');
            }
        } catch {
            setHata('Ağ hatası');
            setAsama('aktif');
        }
    }, [asama, sorular, cevaplar, yonlendir]);

    const sinaviGonderRef = useRef(sinaviGonder);
    useEffect(() => {
        sinaviGonderRef.current = sinaviGonder;
    }, [sinaviGonder]);

    const cevaplananSayi = Object.keys(cevaplar).length;
    const bosSayi = sorular.length - cevaplananSayi;

    // ─── Hazırlık Ekranı ──────────────────────────────
    if (asama === 'hazirlik') {
        return (
            <div className="container exam-setup">
                <div className="card exam-setup-card">
                    <h2>Sınava Başla</h2>
                    <p>Rastgele seçilmiş 20 soruyu cevaplamak için 20 dakikanız olacak.</p>

                    {hata && <div className="alert alert-danger">{hata}</div>}

                    <div className="exam-info-grid">
                        <div className="exam-info-item">
                            <div className="label">Soru Sayısı</div>
                            <div className="value">20</div>
                        </div>
                        <div className="exam-info-item">
                            <div className="label">Süre Sınırı</div>
                            <div className="value">20 dk</div>
                        </div>
                    </div>

                    {kategoriler.length > 0 && (
                        <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                            <label>Kategoriye Göre Filtrele (opsiyonel)</label>
                            <select
                                className="form-control"
                                value={seciliKategori}
                                onChange={(e) => setSeciliKategori(e.target.value)}
                            >
                                <option value="">Tüm Kategoriler</option>
                                {kategoriler.map((kat) => (
                                    <option key={kat} value={kat}>{kat}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        className="btn btn-primary btn-lg btn-block"
                        onClick={sinaviBaslat}
                        disabled={yukleniyor}
                    >
                        {yukleniyor ? <><span className="spinner"></span> Sorular Yükleniyor...</> : '🚀 Sınavı Başlat'}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Aktif Sınav ───────────────────────────────
    return (
        <div>
            {/* Onay Modalı */}
            {onayModalGoster && (
                <div className="modal-overlay" onClick={() => setOnayModalGoster(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">⚠️</div>
                        <h2 className="modal-title">Sınavı Bitirmek İstediğinize Emin Misiniz?</h2>
                        <p className="modal-subtitle">Gönderdikten sonra cevaplarınızı değiştiremezsiniz.</p>

                        <div className="modal-stats">
                            <div className="modal-stat">
                                <div className="modal-stat-value" style={{ color: 'var(--accent-primary-light)' }}>{cevaplananSayi}</div>
                                <div className="modal-stat-label">Cevaplanan</div>
                            </div>
                            <div className="modal-stat">
                                <div className="modal-stat-value" style={{ color: 'var(--accent-warning)' }}>{bosSayi}</div>
                                <div className="modal-stat-label">Boş Bırakılan</div>
                            </div>
                            <div className="modal-stat">
                                <div className="modal-stat-value" style={{ color: 'var(--text-secondary)' }}>{sorular.length}</div>
                                <div className="modal-stat-label">Toplam Soru</div>
                            </div>
                        </div>

                        {bosSayi > 0 && (
                            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                                ⚠️ {bosSayi} soru boş bırakıldı!
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                className="btn btn-outline btn-lg"
                                onClick={() => setOnayModalGoster(false)}
                            >
                                ← Sınava Dön
                            </button>
                            <button
                                className="btn btn-success btn-lg"
                                onClick={() => sinaviGonder(false)}
                            >
                                ✓ Evet, Gönder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="exam-header">
                <div className={zamanlayiciSinifi()}>
                    ⏱️ {zamaniFormatla(kalanSure)}
                </div>
                <div className="progress-text">
                    Cevaplanan: <strong>{cevaplananSayi}</strong> / {sorular.length}
                </div>
            </div>

            <div className="container">
                <div className="exam-questions">
                    {sorular.map((s, idx) => (
                        <div
                            key={s.id}
                            className={`question-card ${cevaplar[s.id] ? 'answered' : ''}`}
                        >
                            <div className="question-number">Soru {idx + 1}</div>
                            <div className="question-text">{s.soru_metni}</div>
                            <div className="option-list">
                                {[
                                    { anahtar: 'A', metin: s.secenek_a },
                                    { anahtar: 'B', metin: s.secenek_b },
                                    { anahtar: 'C', metin: s.secenek_c },
                                    { anahtar: 'D', metin: s.secenek_d },
                                ].map((sec) => (
                                    <label
                                        key={sec.anahtar}
                                        className={`option-item ${cevaplar[s.id] === sec.anahtar ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name={`s_${s.id}`}
                                            checked={cevaplar[s.id] === sec.anahtar}
                                            onChange={() => cevapSec(s.id, sec.anahtar)}
                                        />
                                        <span className="option-letter">{sec.anahtar}.</span>
                                        <span className="option-label">{sec.metin}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="exam-submit-bar">
                <div className="progress-text">
                    {cevaplananSayi === sorular.length
                        ? '✅ Tüm sorular cevaplandı!'
                        : `${bosSayi} soru boş bırakıldı`}
                </div>
                <button
                    className="btn btn-success btn-lg"
                    onClick={gonderOnayiGoster}
                    disabled={asama === 'gonderiliyor'}
                >
                    {asama === 'gonderiliyor'
                        ? <><span className="spinner"></span> Gönderiliyor...</>
                        : '📩 Sınavı Gönder'}
                </button>
            </div>
        </div>
    );
}

export default SinavSayfasi;
