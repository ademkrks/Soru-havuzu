import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../server/store.js';
import { createApp } from '../server/app.js';

test('Kimlik, yönetici yetkisi, kullanıcılar arası sonuç ve oturum izolasyonu', async t => {
    const dir = mkdtempSync(join(tmpdir(), 'auth-'));
    const store = createStore(join(dir, 'db.json'));
    let clock = Date.now();
    const app = createApp(store, { now: () => clock });
    await new Promise(r => app.listen(0, '127.0.0.1', r));
    t.after(async () => { await new Promise(r => app.close(r)); rmSync(dir, { recursive: true }); });
    const base = `http://127.0.0.1:${app.address().port}/api`;
    function client() {
        let cookie = '';
        return async (path, method = 'GET', body, headers = {}) => {
            const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
            const setCookie = r.headers.get('set-cookie');
            if (setCookie) cookie = setCookie.split(';')[0];
            return { status: r.status, data: await r.json(), setCookie };
        };
    }
    const admin = client(), a = client(), b = client(), guest = client();
    assert.equal((await guest('/sorular')).status, 401);
    assert.equal((await guest('/sonuclar')).status, 401);
    assert.equal((await guest('/auth/kayit', 'POST', { email: 'bad', password: 'short' })).status, 400);
    const input = { email: 'a@example.test', password: 'Test-password-123', role: 'admin' };
    const registered = await a('/auth/kayit', 'POST', input);
    assert.equal(registered.data.role, 'user');
    assert.ok(!registered.data.password_hash);
    assert.match(registered.setCookie, /HttpOnly/); assert.match(registered.setCookie, /SameSite=Strict/);
    assert.notEqual(store.data.users[0].password_hash, input.password);
    assert.equal((await b('/auth/kayit', 'POST', input)).status, 409);
    assert.equal((await b('/auth/giris', 'POST', { ...input, password: 'Yanlis-sifre-123' })).status, 401);
    await b('/auth/kayit', 'POST', { ...input, email: 'b@example.test' });
    await admin('/auth/kayit', 'POST', { ...input, email: 'admin@example.test' });
    store.update(d => { d.users.find(u => u.email === 'admin@example.test').role = 'admin'; });
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
        assert.equal((await a(method === 'PUT' || method === 'DELETE' ? '/sorular/fake' : '/sorular', method, method === 'GET' ? undefined : {})).status, 403);
    }
    assert.equal((await a('/sorular/kategoriler')).status, 200);
    assert.equal((await admin('/sorular', 'POST', {}, { Origin: 'https://baska-site.test' })).status, 403);
    assert.equal((await admin('/sorular', 'POST', {}, { 'Content-Type': 'text/plain' })).status, 415);
    for (let i = 0; i < 20; i++) await admin('/sorular', 'POST', { soru_metni: `Soru ${i}`, secenek_a: 'A', secenek_b: 'B', secenek_c: 'C', secenek_d: 'D', dogru_cevap: 'A', kategori: 'Genel' });
    const exam = (await a('/sinav/baslat', 'POST', {})).data;
    assert.equal((await b('/sinav/cevaplar', 'PUT', { sinav_id: exam.sinav_id, cevaplar: {} })).status, 409);
    assert.equal((await b('/sinav/gonder', 'POST', { sinav_id: exam.sinav_id, cevaplar: [] })).status, 404);
    const result = (await a('/sinav/gonder', 'POST', { sinav_id: exam.sinav_id, cevaplar: [] })).data;
    assert.equal((await a('/sonuclar')).data.length, 1);
    assert.equal((await b('/sonuclar')).data.length, 0);
    assert.equal((await admin('/sonuclar')).data.length, 0);
    assert.equal((await b('/sonuclar/' + result.id)).status, 404);
    assert.equal((await a('/sonuclar/' + result.id)).status, 200);
    store.update(d => d.sonuclar.push({ id: 'legacy', puan: 100 }));
    assert.equal((await a('/sonuclar')).data.length, 1);
    assert.equal((await admin('/sonuclar/legacy')).status, 404);
    await a('/auth/cikis', 'POST', {});
    assert.equal((await a('/auth/ben')).status, 401);
    assert.equal((await a('/auth/giris', 'POST', { ...input, email: 'A@EXAMPLE.TEST' })).status, 200);
    clock += 86400001;
    assert.equal((await a('/auth/ben')).status, 401);
    for (let i = 0; i < 30; i++) assert.equal((await guest('/auth/giris', 'POST', {})).status, 400);
    assert.equal((await guest('/auth/giris', 'POST', {})).status, 429);
});
