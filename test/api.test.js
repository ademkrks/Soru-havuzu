import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../server/store.js';
import { createApp } from '../server/app.js';

test('Soru yönetimi, sınav, süre ve kalıcı sonuç akışı', async t => {
    const dir = mkdtempSync(join(tmpdir(), 'sinav-'));
    const file = join(dir, 'db.json');
    const store = createStore(file);
    let clock = Date.now();
    const app = createApp(store, { now: () => clock, dist: dir });
    await new Promise(r => app.listen(0, '127.0.0.1', r));
    t.after(async () => { await new Promise(r => app.close(r)); rmSync(dir, { recursive: true }); });
    const base = `http://127.0.0.1:${app.address().port}`;
    let cookie = '';
    const request = async (path, method = 'GET', body) => {
        const response = await fetch(base + '/api' + path, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
        if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
        return { status: response.status, data: await response.json() };
    };
    await request('/auth/kayit', 'POST', { email: 'admin@example.test', password: 'Test-password-123' });
    store.update(d => { d.users[0].role = 'admin'; });
    assert.equal((await request('/sorular', 'POST', {})).status, 400);
    assert.equal((await request('/sinav/baslat', 'POST', {})).status, 400);
    for (let i = 0; i < 20; i++) assert.equal((await request('/sorular', 'POST', { soru_metni: `Soru ${i}`, secenek_a: '1', secenek_b: '2', secenek_c: '3', secenek_d: '4', dogru_cevap: 'A', kategori: 'Matematik' })).status, 201);
    assert.deepEqual((await request('/sorular/kategoriler')).data, ['Matematik']);
    assert.equal((await request('/sinav/baslat', 'POST', { kategori: 'Fen' })).status, 400);
    const exam = (await request('/sinav/baslat', 'POST', {})).data;
    assert.equal(new Set(exam.sorular.map(q => q.id)).size, 20);
    assert.ok(exam.sorular.every(q => !('dogru_cevap' in q)));
    const id = exam.sorular[0].id;
    const q = (await request('/sorular')).data.find(q => q.id === id);
    assert.equal((await request('/sorular/' + id, 'PUT', { ...q, soru_metni: 'Düzenlendi' })).status, 200);
    assert.equal((await request('/sorular/' + id, 'DELETE')).status, 200);
    assert.equal((await request('/sinav/gonder', 'POST', { sinav_id: exam.sinav_id, cevaplar: [{ soru_id: id, secilen_cevap: 'E' }] })).status, 400);
    const answers = exam.sorular.map((q, i) => ({ soru_id: q.id, secilen_cevap: i === 0 ? 'A' : i === 1 ? 'B' : null }));
    const result = (await request('/sinav/gonder', 'POST', { sinav_id: exam.sinav_id, cevaplar: answers })).data;
    assert.equal(result.puan, 5); assert.equal(result.yanlis_sayisi, 1); assert.equal(result.bos_sayisi, 18);
    assert.equal(result.detaylar[0].soru_metni, q.soru_metni);
    assert.deepEqual((await request('/sinav/gonder', 'POST', { sinav_id: exam.sinav_id, cevaplar: [] })).data, result);
    assert.equal(createStore(file).data.sonuclar.length, 1);
    store.update(d => d.sorular.push(q));
    const timed = (await request('/sinav/baslat', 'POST', {})).data;
    const saved = { [timed.sorular[0].id]: 'A' };
    assert.equal((await request('/sinav/cevaplar', 'PUT', { sinav_id: timed.sinav_id, cevaplar: saved })).status, 200);
    clock += 1200001;
    assert.equal((await request('/sinav/cevaplar', 'PUT', { sinav_id: timed.sinav_id, cevaplar: {} })).status, 409);
    const expired = (await request('/sinav/gonder', 'POST', { sinav_id: timed.sinav_id, cevaplar: [] })).data;
    assert.equal(expired.dogru_sayisi, 1);
    assert.equal((await request('/sonuclar')).data.length, 2);
    assert.equal((await request('/yok')).status, 404);
    writeFileSync(join(dir, 'index.html'), '<html>Uygulama</html>');
    assert.match(await (await fetch(base + '/sinav')).text(), /Uygulama/);
    assert.equal((await fetch(base + '/assets/yok.js')).status, 404);
});

test('Bozuk veri dosyası sessizce sıfırlanmaz', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sinav-'));
    try { const file = join(dir, 'db.json'); writeFileSync(file, '{bozuk'); assert.throws(() => createStore(file)); }
    finally { rmSync(dir, { recursive: true }); }
});
