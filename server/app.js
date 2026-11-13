import { createServer } from 'node:http';
import { randomUUID, randomInt, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

import { publicUser, tokenHash, credentials, hashPassword, checkPassword, sessionToken } from './auth.js';

const fields = ['soru_metni', 'secenek_a', 'secenek_b', 'secenek_c', 'secenek_d'];
function question(body) {
    const value = {};
    for (const key of [...fields, 'kategori']) {
        value[key] = typeof body[key] === 'string' ? body[key].trim() : '';
        if ((key !== 'kategori' && !value[key]) || value[key].length > 5000) throw Object.assign(new Error('Soru metni ve dört seçenek zorunludur; alanlar en fazla 5000 karakter olabilir.'), { status: 400 });
    }
    if (!['A', 'B', 'C', 'D'].includes(body.dogru_cevap)) throw Object.assign(new Error('Doğru cevap A, B, C veya D olmalı.'), { status: 400 });
    return { ...value, kategori: value.kategori || 'Genel', dogru_cevap: body.dogru_cevap };
}
async function bodyOf(req) {
    let text = '';
    for await (const chunk of req) {
        text += chunk;
        if (Buffer.byteLength(text) > 100000) throw Object.assign(new Error('İstek çok büyük.'), { status: 413 });
    }
    try {
        const body = JSON.parse(text);
        if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error();
        return body;
    } catch { throw Object.assign(new Error('Geçersiz JSON.'), { status: 400 }); }
}
export function createApp(store, { dist = resolve('dist'), now = Date.now, durationMs = 1200000, secureCookies = process.env.NODE_ENV === 'production' } = {}) {
    const attempts = new Map();
    const cookie = (token, age) => 'oturum=' + token + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=' + age + (secureCookies ? '; Secure' : '');
    return createServer(async (req, res) => {
        const send = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
        try {
            const url = new URL(req.url, 'http://localhost');
            const path = url.pathname;
            if (path.startsWith('/api/')) {
                if (!['GET', 'HEAD'].includes(req.method)) {
                    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { hata: 'JSON isteği gerekli.' });
                    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { hata: 'İstek kaynağına izin verilmedi.' });
                }
                const hash = tokenHash(sessionToken(req));
                const session = store.data.sessions.find(s => s.hash === hash && s.expires > now());
                const user = session && store.data.users.find(u => u.id === session.user_id);
                if (['/api/auth/kayit', '/api/auth/giris'].includes(path) && req.method === 'POST') {
                    const ip = req.socket.remoteAddress;
                    for (const [key, value] of attempts) if (value.until <= now()) attempts.delete(key);
                    const limit = attempts.get(ip) || { count: 0, until: now() + 900000 };
                    attempts.set(ip, limit);
                    if (++limit.count > 30) return send(429, { hata: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' });
                    const input = credentials(await bodyOf(req));
                    let account = store.data.users.find(u => u.email === input.email);
                    if (path.endsWith('/kayit')) {
                        if (account) return send(409, { hata: 'Bu e-posta ile kayıt oluşturulamadı.' });
                        const password_hash = await hashPassword(input.password);
                        if (store.data.users.some(u => u.email === input.email)) return send(409, { hata: 'Bu e-posta ile kayıt oluşturulamadı.' });
                        account = { id: randomUUID(), email: input.email, role: 'user', password_hash };
                        store.update(d => d.users.push(account));
                    } else {
                        const dummy = '00000000000000000000000000000000:' + '00'.repeat(64);
                        const valid = await checkPassword(input.password, account?.password_hash || dummy);
                        if (!account || !valid) return send(401, { hata: 'E-posta veya şifre hatalı.' });
                    }
                    const token = randomBytes(32).toString('hex');
                    store.update(d => { d.sessions = d.sessions.filter(s => s.expires > now()); d.sessions.push({ hash: tokenHash(token), user_id: account.id, expires: now() + 86400000 }); });
                    res.setHeader('Set-Cookie', cookie(token, 86400));
                    return send(path.endsWith('/kayit') ? 201 : 200, publicUser(account));
                }
                if (!user) return send(401, { hata: 'Devam etmek için giriş yapın.' });
                if (path === '/api/auth/ben' && req.method === 'GET') return send(200, publicUser(user));
                if (path === '/api/auth/cikis' && req.method === 'POST') {
                    store.update(d => { d.sessions = d.sessions.filter(s => s.hash !== hash); });
                    res.setHeader('Set-Cookie', cookie('', 0));
                    return send(200, { mesaj: 'Çıkış yapıldı.' });
                }
                if ((path === '/api/sorular' || path.startsWith('/api/sorular/')) && path !== '/api/sorular/kategoriler' && user.role !== 'admin') return send(403, { hata: 'Bu işlem için yönetici yetkisi gerekli.' });

                if (path === '/api/sorular/kategoriler' && req.method === 'GET') return send(200, [...new Set(store.data.sorular.map(q => q.kategori))].sort());
                if (path === '/api/sorular' && req.method === 'GET') return send(200, store.data.sorular);
                if (path === '/api/sorular' && req.method === 'POST') {
                    const q = { ...question(await bodyOf(req)), id: randomUUID() };
                    store.update(d => d.sorular.push(q));
                    return send(201, q);
                }
                if (path.startsWith('/api/sorular/') && ['PUT', 'DELETE'].includes(req.method)) {
                    const id = path.split('/').at(-1);
                    if (!store.data.sorular.some(q => q.id === id)) return send(404, { hata: 'Soru bulunamadı.' });
                    const q = req.method === 'PUT' ? { ...question(await bodyOf(req)), id } : null;
                    store.update(d => { d.sorular = q ? d.sorular.map(old => old.id === id ? q : old) : d.sorular.filter(old => old.id !== id); });
                    return send(200, q || { mesaj: 'Soru silindi.' });
                }
                if (path === '/api/sinav/baslat' && req.method === 'POST') {
                    const { kategori } = await bodyOf(req);
                    const pool = store.data.sorular.filter(q => !kategori || q.kategori === kategori);
                    if (pool.length < 20) return send(400, { hata: `Sınav için en az 20 soru gerekli. Bu seçimde ${pool.length} soru var.` });
                    for (let i = pool.length - 1; i > 0; i--) { const j = randomInt(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
                    const exam = { id: randomUUID(), user_id: user.id, sorular: pool.slice(0, 20), bitis: now() + durationMs };
                    store.update(d => { d.sinavlar = d.sinavlar.filter(e => e.bitis > now() - 86400000); d.sinavlar.push(exam); });
                    return send(201, { sinav_id: exam.id, bitis: exam.bitis, sorular: exam.sorular.map(({ dogru_cevap, ...q }) => q) });
                }
                if (path === '/api/sinav/gonder' && req.method === 'POST') {
                    const body = await bodyOf(req);
                    const exam = store.data.sinavlar.find(e => e.id === body.sinav_id && e.user_id === user.id);
                    if (!exam) return send(404, { hata: 'Sınav bulunamadı veya süresi geçti.' });
                    const previous = store.data.sonuclar.find(r => r.sinav_id === exam.id);
                    if (previous) return send(200, previous);
                    if (!Array.isArray(body.cevaplar)) return send(400, { hata: 'Cevap listesi gerekli.' });
                    const answers = new Map();
                    for (const a of body.cevaplar) {
                        if (!a || !exam.sorular.some(q => q.id === a.soru_id) || answers.has(a.soru_id) || ![null, 'A', 'B', 'C', 'D'].includes(a.secilen_cevap)) return send(400, { hata: 'Geçersiz veya tekrarlanan cevap.' });
                        answers.set(a.soru_id, a.secilen_cevap);
                    }
                    // Süre sonundan sonra yeni cevap kabul edilmez. Son kayıtlı cevaplar değerlendirilir.
                    const accepted = now() <= exam.bitis ? Object.fromEntries(answers) : (exam.cevaplar || {});
                    const detaylar = exam.sorular.map(q => { const answer = accepted[q.id] || null; return { ...q, soru_id: q.id, secilen_cevap: answer, bos_mu: !answer, dogru_mu: answer === q.dogru_cevap }; });
                    const dogru = detaylar.filter(d => d.dogru_mu).length;
                    const bos = detaylar.filter(d => d.bos_mu).length;
                    const result = { id: randomUUID(), sinav_id: exam.id, user_id: user.id, tarih: new Date(now()).toISOString(), dogru_sayisi: dogru, bos_sayisi: bos, yanlis_sayisi: 20 - dogru - bos, toplam_soru: 20, puan: dogru * 5, yuzde: dogru * 5, detaylar };
                    store.update(d => d.sonuclar.unshift(result));
                    return send(200, result);
                }
                if (path === '/api/sinav/cevaplar' && req.method === 'PUT') {
                    const body = await bodyOf(req);
                    const exam = store.data.sinavlar.find(e => e.id === body.sinav_id && e.user_id === user.id);
                    if (!exam || now() > exam.bitis || store.data.sonuclar.some(r => r.sinav_id === exam.id)) return send(409, { hata: 'Sınav artık aktif değil.' });
                    if (!body.cevaplar || typeof body.cevaplar !== 'object' || Array.isArray(body.cevaplar) || Object.entries(body.cevaplar).some(([id, a]) => !exam.sorular.some(q => q.id === id) || !['A', 'B', 'C', 'D'].includes(a))) return send(400, { hata: 'Geçersiz cevaplar.' });
                    store.update(d => { d.sinavlar.find(e => e.id === exam.id).cevaplar = body.cevaplar; });
                    return send(200, { mesaj: 'Kaydedildi.' });
                }
                if (path === '/api/sonuclar' && req.method === 'GET') return send(200, store.data.sonuclar.filter(r => r.user_id === user.id));
                if (path.startsWith('/api/sonuclar/') && req.method === 'GET') {
                    const result = store.data.sonuclar.find(r => r.id === path.split('/').at(-1) && r.user_id === user.id);
                    return result ? send(200, result) : send(404, { hata: 'Sonuç bulunamadı.' });
                }
                return send(404, { hata: 'Adres bulunamadı.' });
            }
            if (!['GET', 'HEAD'].includes(req.method)) return send(405, { hata: 'Yöntem desteklenmiyor.' });
            const file = resolve(dist, '.' + decodeURIComponent(path));
            if (!file.startsWith(resolve(dist) + sep) && file !== resolve(dist)) return send(403, { hata: 'Erişim reddedildi.' });
            let content, extension = extname(file);
            try { content = await readFile(file); }
            catch {
                if (extension) return send(404, { hata: 'Dosya bulunamadı.' });
                content = await readFile(resolve(dist, 'index.html')); extension = '.html';
            }
            res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[extension] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
            res.end(req.method === 'HEAD' ? undefined : content);
        } catch (error) {
            if (!error.status) console.error(error);
            send(error.status || 500, { hata: error.status ? error.message : 'Sunucu işlemi tamamlayamadı.' });
        }
    });
}
