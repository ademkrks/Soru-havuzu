import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const publicUser = ({ id, email, role }) => ({ id, email, role });
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export function credentials(body) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error('Geçerli bir e-posta adresi girin.'), { status: 400 });
    if (typeof body.password !== 'string' || body.password.length < 10 || body.password.length > 128) throw Object.assign(new Error('Şifre 10–128 karakter olmalı.'), { status: 400 });
    return { email, password: body.password };
}
export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    return salt + ':' + (await scrypt(password, salt, 64)).toString('hex');
}
export async function checkPassword(password, hash) {
    const [salt, value] = hash.split(':');
    const calculated = await scrypt(password, salt, 64);
    const expected = Buffer.from(value, 'hex');
    return expected.length === calculated.length && timingSafeEqual(expected, calculated);
}
export function sessionToken(req) {
    return (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('oturum='))?.slice(7) || '';
}
