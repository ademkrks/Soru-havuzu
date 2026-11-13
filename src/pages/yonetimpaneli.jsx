import React, { useState, useEffect } from 'react';

const BOS_FORM = {
    soru_metni: '',
    secenek_a: '',
    secenek_b: '',
    secenek_c: '',
    secenek_d: '',
    dogru_cevap: '',
    kategori: '',
};

function YonetimPaneli() {
    const [sorular, setSorular] = useState([]);
    const [form, setForm] = useState(BOS_FORM);
    const [duzenlenen, setDuzenlenen] = useState(null);
    const [arama, setArama] = useState('');
    const [mesaj, setMesaj] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    useEffect(() => {
        sorulariGetir();
    }, []);

    const sorulariGetir = async () => {
        try {
            const yanit = await fetch('/api/sorular');
            if (!yanit.ok) throw new Error();
            const veri = await yanit.json();
            setSorular(veri);
        } catch {
            setMesaj({ tip: 'danger', metin: 'Sorular getirilemedi' });
        }
    };

    const degisiklikleriIsle = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const formuGonder = async (e) => {
        e.preventDefault();
        setMesaj(null);
        setYukleniyor(true);

        try {
            const yanit = await fetch(duzenlenen ? `/api/sorular/${duzenlenen}` : '/api/sorular', {
                method: duzenlenen ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const veri = await yanit.json();

            if (!yanit.ok) {
                const hataMesaji = veri.hatalar ? veri.hatalar.join(', ') : veri.hata || 'Soru eklenemedi';
                setMesaj({ tip: 'danger', metin: hataMesaji });
            } else {
                setMesaj({ tip: 'success', metin: '✓ Soru kaydedildi' });
                setForm(BOS_FORM);
                setDuzenlenen(null);
                sorulariGetir();
            }
        } catch {
            setMesaj({ tip: 'danger', metin: 'Ağ hatası. Backend çalışıyor mu?' });
        } finally {
            setYukleniyor(false);
        }
    };

    const soruSil = async (id) => {
        if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
        try {
            const yanit = await fetch(`/api/sorular/${id}`, { method: 'DELETE' });
            if (yanit.ok) {
                setMesaj({ tip: 'success', metin: '✓ Soru silindi' });
                sorulariGetir();
            } else {
                setMesaj({ tip: 'danger', metin: 'Soru silinemedi' });
            }
        } catch {
            setMesaj({ tip: 'danger', metin: 'Ağ hatası' });
        }
    };

    return (
        <div className="container">
            <div className="page-header">
                <h1>Yönetim Paneli</h1>
                <p>Soru havuzunuzu yönetin — soru ekleyin, inceleyin ve silin</p>
            </div>

            {mesaj && (
                <div className={`alert alert-${mesaj.tip}`}>
                    {mesaj.metin}
                </div>
            )}

            <div className="admin-layout">
                {/* Soru Ekleme Formu */}
                <div className="card">
                    <div className="card-title">{duzenlenen ? 'Soruyu Düzenle' : '➕ Yeni Soru Ekle'}</div>
                    <form onSubmit={formuGonder}>
                        {duzenlenen && <button type="button" className="btn btn-outline" onClick={() => { setDuzenlenen(null); setForm(BOS_FORM); }}>Düzenlemeyi İptal Et</button>}
                        <div className="form-group">
                            <label>Soru Metni</label>
                            <textarea
                                required
                                className="form-control"
                                name="soru_metni"
                                value={form.soru_metni}
                                onChange={degisiklikleriIsle}
                                placeholder="Sorunuzu girin..."
                                rows={3}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Seçenek A</label>
                                <input
                                    className="form-control"
                                    name="secenek_a"
                                    value={form.secenek_a}
                                    onChange={degisiklikleriIsle}
                                    placeholder="Seçenek A"
                                />
                            </div>
                            <div className="form-group">
                                <label>Seçenek B</label>
                                <input
                                    className="form-control"
                                    name="secenek_b"
                                    value={form.secenek_b}
                                    onChange={degisiklikleriIsle}
                                    placeholder="Seçenek B"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Seçenek C</label>
                                <input
                                    className="form-control"
                                    name="secenek_c"
                                    value={form.secenek_c}
                                    onChange={degisiklikleriIsle}
                                    placeholder="Seçenek C"
                                />
                            </div>
                            <div className="form-group">
                                <label>Seçenek D</label>
                                <input
                                    className="form-control"
                                    name="secenek_d"
                                    value={form.secenek_d}
                                    onChange={degisiklikleriIsle}
                                    placeholder="Seçenek D"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Doğru Cevap</label>
                                <select
                                    className="form-control"
                                    name="dogru_cevap"
                                    value={form.dogru_cevap}
                                    onChange={degisiklikleriIsle}
                                >
                                    <option value="">Cevap seçin...</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Kategori</label>
                                <input
                                    className="form-control"
                                    name="kategori"
                                    value={form.kategori}
                                    onChange={degisiklikleriIsle}
                                    placeholder="ör. Matematik, Fen..."
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={yukleniyor}>
                            {yukleniyor ? <><span className="spinner"></span> Ekleniyor...</> : 'Soruyu Kaydet'}
                        </button>
                    </form>
                </div>

                {/* Soru Listesi */}
                <div>
                    <div className="card-title" style={{ marginBottom: '1rem' }}>
                        📋 Sorular ({sorular.length})
                    </div>
                    <input aria-label="Soru ara" className="form-control" placeholder="Soru veya kategori ara..." value={arama} onChange={e => setArama(e.target.value)} />
                    <div className="question-list">
                        {sorular.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <h3>Henüz soru yok</h3>
                                <p>Formu kullanarak ilk sorunuzu ekleyin</p>
                            </div>
                        ) : (
                            sorular.filter(s => (s.soru_metni + ' ' + s.kategori).toLocaleLowerCase('tr').includes(arama.toLocaleLowerCase('tr'))).map((s) => (
                                <div key={s.id} className="question-item">
                                    <div className="question-item-content">
                                        <div className="question-item-text">{s.soru_metni}</div>
                                        <div className="question-item-meta">
                                            <span className="badge badge-primary">{s.kategori}</span>
                                            <span className="badge badge-success">Cevap: {s.dogru_cevap}</span>
                                        </div>
                                        <div className="question-options-mini">
                                            <span className={s.dogru_cevap === 'A' ? 'correct' : ''}>A: {s.secenek_a}</span>
                                            <span className={s.dogru_cevap === 'B' ? 'correct' : ''}>B: {s.secenek_b}</span>
                                            <span className={s.dogru_cevap === 'C' ? 'correct' : ''}>C: {s.secenek_c}</span>
                                            <span className={s.dogru_cevap === 'D' ? 'correct' : ''}>D: {s.secenek_d}</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-outline btn-sm" onClick={() => { setDuzenlenen(s.id); setForm(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Düzenle</button>
                                    <button aria-label="Soruyu sil" className="btn btn-danger btn-sm" onClick={() => soruSil(s.id)}>
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default YonetimPaneli;
