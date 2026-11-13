import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createStore } from '../server/store.js';
import { credentials, hashPassword } from '../server/auth.js';
// Sunucuyu durdurup çalıştırın: JSON dosyasına tek süreç yazmalıdır.
const input = credentials({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
const password_hash = await hashPassword(input.password);
const store = createStore(resolve(process.env.DATA_FILE || 'data/database.json'));
store.update(d => {
    let user = d.users.find(u => u.email === input.email);
    if (user) { user.role = 'admin'; user.password_hash = password_hash; d.sessions = d.sessions.filter(s => s.user_id !== user.id); }
    else d.users.push({ id: randomUUID(), email: input.email, role: 'admin', password_hash });
});
console.log('Yönetici hesabı hazır. Ortam değişkenlerini temizleyip sunucuyu başlatabilirsiniz.');
