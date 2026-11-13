import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';

export function createStore(file) {
    mkdirSync(dirname(file), { recursive: true });
    let data;
    try { data = JSON.parse(readFileSync(file, 'utf8')); }
    catch (error) {
        if (error.code !== 'ENOENT') throw error;
        data = { sorular: [], sinavlar: [], sonuclar: [] };
    }
    for (const key of ['sorular', 'sinavlar', 'sonuclar']) {
        if (!Array.isArray(data[key])) throw new Error('Veri dosyası geçersiz: ' + key);
    }
    return {
        get data() { return data; },
        update(change) {
            const next = structuredClone(data);
            const result = change(next);
            writeFileSync(file + '.tmp', JSON.stringify(next, null, 2));
            renameSync(file + '.tmp', file);
            data = next;
            return result;
        },
    };
}
