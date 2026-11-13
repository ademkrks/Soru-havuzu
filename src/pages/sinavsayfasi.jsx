import { apiFetch, useAuth } from '../auth';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function kayitliSinav(key) {
    try {
        const value = JSON.parse(sessionStorage.getItem(key));
        if (value?.sinav?.id && Number.isFinite(value.sinav.bitis) && Array.isArray(value.sorular) && value.sorular.length === 20) return value;
    } catch {}
    return null;
}

function SinavSayfasi() {
    const { user } = useAuth();
    const sessionKey = 'aktif-sinav:' + user.id;
    const yonlendir = useNavigate();
    const [kayit] = useState(() => kayitliSinav(sessionKey));

    // Sınav aşamaları: 'hazirlik' | 'aktif' | 'gonderiliyor'
    const [aktifSoru, setAktifSoru] = useState(0);
    const [asama, setAsama] = useState(kayit ? 'aktif' : 'hazirlik');
    const [kategoriler, setKategoriler] = useState([]);
    const [seciliKategori, setSeciliKategori] = useState('');
    const [sorular, setSorular] = useState(kayit?.sorular || []);
    const [cevaplar, setCevaplar] = useState(kayit?.cevaplar || {});
    const [kalanSure, setKalanSure] = useState(kayit ? Math.max(0, Math.ceil((kayit.sinav.bitis - Date.now()) / 1000)) : 20 * 60);
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);
    const [onayModalGoster, setOnayModalGoster] = useState(false);
    const zamanlayiciRef = useRef(null);
    const sinavRef = useRef(kayit?.sinav || null);
    const gonderiliyorRef = useRef(false);
    const tamamlandiRef = useRef(false);
    const otomatikDenendiRef = useRef(false);
    const kayitKuyruguRef = useRef(Promise.resolve());
    const modalRef = useRef(null);

    useEffect(() => {
        if (!onayModalGoster) return;
        const previous = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const modal = modalRef.current;
        const buttons = modal.querySelectorAll('button');
        buttons[0]?.focus();
        const klavye = e => {
            if (e.key === 'Escape') { e.preventDefault(); setOnayModalGoster(false); }
            if (e.key === 'Tab') {
                const first = buttons[0], last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        modal.addEventListener('keydown', klavye);
        return () => { document.body.style.overflow = previousOverflow; modal.removeEventListener('keydown', klavye); previous?.focus(); };
    }, [onayModalGoster]);

    useEffect(() => {
        if (asama === 'hazirlik' || tamamlandiRef.current) return;
        try { sessionStorage.setItem(sessionKey, JSON.stringify({ sinav: sinavRef.current, sorular, cevaplar })); } catch {}
    }, [asama, sorular, cevaplar]);

    useEffect(() => {
        if (asama !== 'aktif') return;
        const uyar = e => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', uyar);
        return () => window.removeEventListener('beforeunload', uyar);
    }, [asama]);

    // Sayfa yüklendiğinde kategorileri getir
    useEffect(() => {
        apiFetch('/api/sorular/kategoriler')
            .then((yanit) => { if (!yanit.ok) throw new Error(); return yanit.json(); })
            .then((veri) => setKategoriler(veri))
            .catch(() => setHata('Kategoriler yüklenemedi. Bağlantınızı kontrol edin.'));
    }, []);

    // Zamanlayıcı
    useEffect(() => {
        if (asama !== 'aktif') return;

        zamanlayiciRef.current = setInterval(() => {
            const kalan = Math.max(0, Math.ceil((sinavRef.current.bitis - Date.now()) / 1000));
            setKalanSure(kalan);
            if (kalan === 0) {
                clearInterval(zamanlayiciRef.current);
                if (!otomatikDenendiRef.current) { otomatikDenendiRef.current = true; sinaviGonderRef.current(true); }
            }
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
            const yanit = await apiFetch('/api/sinav/baslat', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kategori: seciliKategori }),
            });
            const veri = await yanit.json();

            if (!yanit.ok) {
                setHata(veri.hata || 'Sınav başlatılamadı');
            } else {
                sinavRef.current = { id: veri.sinav_id, bitis: veri.bitis };
                setSorular(veri.sorular);
                setCevaplar({});
                setKalanSure(Math.max(0, Math.ceil((veri.bitis - Date.now()) / 1000)));
                setAsama('aktif');
            }
        } catch {
            setHata('Sunucuya ulaşılamadı. Bağlantınızı kontrol edip yeniden deneyin.');
        } finally {
            setYukleniyor(false);
        }
    };

    const cevapSec = (soruId, cevap) => {
        const next = { ...cevaplar, [soruId]: cevap };
        setCevaplar(next);
        kayitKuyruguRef.current = kayitKuyruguRef.current.then(() => apiFetch('/api/sinav/cevaplar', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sinav_id: sinavRef.current.id, cevaplar: next }) }))
            .then(r => { if (!r.ok) throw new Error(); })
            .catch(() => setHata('Cevaplar sunucuya kaydedilemedi. Bağlantınızı kontrol edip sınavı gönderin.'));
    };

    // Gönder butonuna basıldığında onay modalı göster
    const gonderOnayiGoster = () => {
        setOnayModalGoster(true);
    };

    const sinaviGonder = useCallback(async (otomatik = false) => {
        if (gonderiliyorRef.current) return;
        gonderiliyorRef.current = true;

        setOnayModalGoster(false);
        setAsama('gonderiliyor');
        clearInterval(zamanlayiciRef.current);

        const cevapVerisi = sorular.map((s) => ({
            soru_id: s.id,
            secilen_cevap: cevaplar[s.id] || null,
        }));

        try {
            await kayitKuyruguRef.current;
            const yanit = await apiFetch('/api/sinav/gonder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sinav_id: sinavRef.current.id, cevaplar: cevapVerisi }),
            });
            const veri = await yanit.json();

            if (yanit.ok) {
                tamamlandiRef.current = true;
                try { sessionStorage.removeItem(sessionKey); } catch {}
                try { sessionStorage.setItem('sonuc:' + user.id, JSON.stringify({ id: veri.id })); } catch {}
                yonlendir('/sonuc', { state: { sonuc: { id: veri.id } } });
            } else {
                setHata(veri.hata || 'Gönderim başarısız');
                setAsama('aktif');
            }
        } catch {
            setHata('Sınav gönderilemedi. Cevaplarınız korundu; bağlantınız geldiğinde tekrar gönderin.');
            setAsama('aktif');
        } finally { gonderiliyorRef.current = false; }
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
                    <div className="gece-eyebrow">YENİ BİR DENEME</div><h2>Bir sonraki seviyen burada başlıyor.</h2>
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
                            <label htmlFor="sinav-kategori">Kategoriye Göre Filtrele (opsiyonel)</label>
                            <select
                                id="sinav-kategori"
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
                        {yukleniyor ? <><span className="spinner"></span> Sorular Yükleniyor...</> : ' Sınavı Başlat'}
                    </button>
                </div><div className="gece-setup-footer"><div><h3>Her soruya kendi hızında yaklaş.</h3><p>Sorular arasında geçiş yapabilir, cevaplarını göndermeden önce değiştirebilirsin.</p></div><div><h3>Sonuçların sana ait.</h3><p>Deneme sonunda doğru, yanlış ve boş cevaplarını incele. Geçmişin yalnızca senin hesabında görünür.</p></div></div>
            </div>
        );
    }

    // ─── Aktif Sınav ───────────────────────────────
    return (
        <div>
            {/* Onay Modalı */}
            {onayModalGoster && (
                <div className="modal-overlay" onClick={() => setOnayModalGoster(false)}>
                    <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="sinav-onay-baslik" className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">⚠️</div>
                        <h2 id="sinav-onay-baslik" className="modal-title">Sınavı Bitirmek İstediğinize Emin Misiniz?</h2>
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

            <div className="exam-header"><div className="gece-exam-title"><div className="gece-eyebrow">SÜRELİ DENEME</div><h1>Şimdi sadece soruya odaklan.</h1></div>
                <div className={zamanlayiciSinifi()}>
                    {zamaniFormatla(kalanSure)}
                </div>

            </div>

            <div className="container">
                {hata && <div role="alert" className="alert alert-danger">{hata}</div>}
                <div className="gece-progress" role="progressbar" aria-label="Cevaplanan sorular" aria-valuemin={0} aria-valuemax={sorular.length} aria-valuenow={cevaplananSayi}><span style={{ width: `${cevaplananSayi / sorular.length * 100}%` }} /></div><div className="gece-exam-grid"><div className="exam-questions">
                    {sorular.map((s, idx) => idx === aktifSoru && (
                        <div
                            key={s.id}
                            className={`question-card ${cevaplar[s.id] ? 'answered' : ''}`}
                        >
                            <div className="question-number">Soru {idx + 1} / {sorular.length}</div>
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
                                            disabled={asama !== 'aktif' || kalanSure === 0}
                                            onChange={() => cevapSec(s.id, sec.anahtar)}
                                        />
                                        <span className="option-letter">{sec.anahtar}.</span>
                                        <span className="option-label">{sec.metin}</span>
                                    </label>
                                ))}
                            </div><div className="gece-question-nav"><button className="btn btn-outline" disabled={aktifSoru === 0} onClick={() => setAktifSoru(i => i - 1)}>← Önceki soru</button><button className="btn btn-primary" disabled={aktifSoru === sorular.length - 1} onClick={() => setAktifSoru(i => i + 1)}>Sonraki soru →</button></div>
                        </div>
                    ))}
                </div><aside className="gece-question-map"><h2>Soru haritası</h2><div className="gece-map-grid">{sorular.map((s, i) => <button key={s.id} type="button" aria-label={`Soru ${i + 1}${cevaplar[s.id] ? ', cevaplandı' : ', boş'}`} aria-current={aktifSoru === i ? 'step' : undefined} className={cevaplar[s.id] ? 'answered' : ''} onClick={() => setAktifSoru(i)}>{i + 1}</button>)}</div><p className="gece-map-note">{cevaplananSayi} / {sorular.length} cevaplandı<br />{bosSayi} soru boş</p><button className="btn btn-primary" onClick={gonderOnayiGoster} disabled={asama === 'gonderiliyor'}>{asama === 'gonderiliyor' ? 'Gönderiliyor...' : 'Sınavı bitir'}</button></aside></div>
            </div>

            <div className="exam-submit-bar">
                <div className="progress-text">
                    {cevaplananSayi === sorular.length
                        ? ' Tüm sorular cevaplandı!'
                        : `${bosSayi} soru boş bırakıldı`}
                </div>
                <button
                    className="btn btn-success btn-lg"
                    onClick={gonderOnayiGoster}
                    disabled={asama === 'gonderiliyor'}
                >
                    {asama === 'gonderiliyor'
                        ? <><span className="spinner"></span> Gönderiliyor...</>
                        : ' Sınavı Gönder'}
                </button>
            </div>
        </div>
    );
}

export default SinavSayfasi;
