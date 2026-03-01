# Online Sınav Sistemi Frontend

React + Vite ile geliştirilmiş, soru havuzu tabanlı online sınav arayüzü.

## Proje Özeti
Bu uygulama ile:
- Yönetim panelinden soru havuzu yönetilir.
- Kullanıcı 20 soruluk, 20 dakikalık sınava girer.
- Sınav sonunda puan ve detaylı analiz görüntülenir.
- Geçmiş sınav sonuçları listelenir.

## Özellikler
- Soru ekleme ve silme (Yönetim Paneli)
- Kategoriye göre filtreleyerek sınav başlatma (opsiyonel)
- Süre takibi ve süre dolunca otomatik gönderim
- Sonuç ekranında doğru/yanlış/boş dağılımı ve soru bazlı inceleme
- Sonuç geçmişinin tablo halinde gösterimi

## Kullanılan Teknolojiler
- React 18
- React Router DOM 6
- Vite 5

## Proje Yapısı
```text
frontend/
  src/
    App.jsx
    main.jsx
    index.css
    pages/
      yonetimpaneli.jsx
      sinavsayfasi.jsx
      sonucsayfasi.jsx
      sonucgecmisi.jsx
  index.html
  vite.config.js
  package.json
```

## Gereksinimler
- Node.js 18+
- npm 9+
- Uyumlu backend servisi (varsayılan: `http://localhost:5000`)

## Kurulum
```bash
npm install
```

## Geliştirme Ortamında Çalıştırma
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır.

## Build ve Önizleme
Üretim build:
```bash
npm run build
```
Build önizleme:
```bash
npm run preview
```

## Sayfalar (Router)
- `/` -> Yönetim Paneli
- `/sinav` -> Sınav Sayfası
- `/sonuc` -> Sonuç Sayfası
- `/sonuclar` -> Sonuç Geçmişi

## Backend Entegrasyonu
Frontend, Vite proxy üzerinden backend'e bağlanır:
- `/sorular` -> `http://localhost:5000`
- `/sinav` -> `http://localhost:5000`
- `/sonuclar` -> `http://localhost:5000`

Beklenen API uçları:
- `GET /sorular`
- `POST /sorular`
- `DELETE /sorular/:id`
- `GET /sorular/kategoriler`
- `GET /sinav/baslat`
- `GET /sinav/baslat?kategori=...`
- `POST /sinav/gonder`
- `GET /sonuclar`

## Notlar
- Sonuç sayfası (`/sonuc`) yönlendirme ile gelen sonuç verisini bekler. Sayfaya doğrudan girilirse "Sonuç Yok" ekranı görünür.
- Sorular ve sınav sonuçları backend tarafında saklanır.
