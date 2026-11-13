import { resolve } from 'node:path';
import { createApp } from './app.js';
import { createStore } from './store.js';

const port = Number(process.env.PORT || 5000);
const store = createStore(resolve(process.env.DATA_FILE || 'data/database.json'));
createApp(store).listen(port, process.env.HOST || '127.0.0.1', () => {
    console.log(`Sınav sistemi http://localhost:${port} adresinde hazır.`);
});
