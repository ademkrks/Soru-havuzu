# Soru Havuzu ve Online Sınav Sistemi

React arayüzü ve Node.js sunucusuyla çalışan soru havuzu tabanlı sınav uygulaması.

## Özellikler

- Soru ekleme, düzenleme, silme ve metin/kategori araması
- İsteğe bağlı kategori seçimiyle rastgele 20 soruluk, 20 dakikalık sınav
- Sunucuda tutulan süre ve cevap anahtarı; sınav başında doğru cevaplar gönderilmez
- Cevapların seçim sırasında sunucuya kaydedilmesi
- Süre dolduğunda otomatik gönderim, bağlantı hatasında elle tekrar gönderim
- Aynı sınav tekrar gönderilirse aynı sonucun dönmesi
- Sayfa yenilenince aynı sekmedeki sınava devam etme; süre yeniden başlamaz
- Doğru, yanlış ve boş sayıları, 100 üzerinden puan ve soru bazında inceleme
- Kalıcı sonuç geçmişinden eski sınav detaylarını açma
- Soru düzenlense veya silinse bile sınav ve sonuç içeriğinin korunması

## Kurulum ve geliştirme

Node.js 22.12 veya üzerini kullanın.

```sh
npm ci
npm run dev
```

Arayüz: http://localhost:3000 — sunucu: http://localhost:5000.
Tek komut ikisini birlikte başlatır. Durdurmak için Ctrl+C kullanın.
Yalnız sunucuyu başlatmak için `npm run server` kullanılabilir.

İlk açılışta soru havuzu boştur. Yönetim panelinden en az 20 soru ekleyin.
Kategori seçerek sınava girmek için o kategoride de en az 20 soru gerekir.
Her doğru cevap 5 puandır; yanlış cevap doğruları götürmez.

## Üretim derlemesi

```sh
npm run build
npm start
```

http://localhost:5000 adresi hem arayüzü hem API'yi sunar. `/sinav` ve
`/sonuclar` gibi sayfalara doğrudan erişim desteklenir. `npm run preview`
yalnızca derlenen arayüzün önizlemesidir; tam uygulama için `npm start` kullanın.

## Veri saklama

Veriler ilk değişiklikte `data/database.json` dosyasına yazılır. Dosya Git'e
alınmaz. Sunucuyu durdurup bu dosyayı yedekleyebilirsiniz. Bozuk veri dosyası
sessizce sıfırlanmaz; sunucu hata vererek durur. Tek sunucu süreci kullanın.
Bu dosya tabanlı sürüm yüksek eşzamanlı yükler için tasarlanmamıştır.

Ortam değişkenleri:

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| PORT | 5000 | Sunucu portu |
| HOST | 127.0.0.1 | Dinlenecek ağ adresi |
| DATA_FILE | data/database.json | Veri dosyasının konumu |

Geliştirme arayüzündeki API yönlendirmesi varsayılan 5000 portuna gider.
Portu değiştirirseniz `vite.config.js` dosyasını da güncelleyin.

## API

Bütün API adresleri `/api` altında; sayfa adreslerinden ayrıdır.

| Yöntem | Adres | İşlev |
| --- | --- | --- |
| GET / POST | /api/sorular | Soruları listele / ekle |
| PUT / DELETE | /api/sorular/:id | Soruyu düzenle / sil |
| GET | /api/sorular/kategoriler | Kategorileri listele |
| POST | /api/sinav/baslat | `{ "kategori": "Matematik" }` veya `{}` ile başlat |
| PUT | /api/sinav/cevaplar | sinav_id ve soru kimliği → şık eşlemesi olan cevaplar nesnesini kaydet |
| POST | /api/sinav/gonder | sinav_id ve soru_id / secilen_cevap alanlarından oluşan cevaplar dizisini değerlendir |
| GET | /api/sonuclar | Detaylarıyla sonuç geçmişi |

Süre sonrasında son kaydedilmiş cevaplar değerlendirilir. Süresi bir günden
fazla geçmiş sınav oturumları yeni sınav açıldığında temizlenir; sonuçlar kalır.

## Kontrol

```sh
npm test
npm run build
npm audit
```

Testler geçici veri dosyasıyla gerçek HTTP istekleri üzerinden soru yönetimini,
yetersiz soru sayısını, kategori filtresini, cevap anahtarının gizlenmesini,
puanlamayı, tekrar gönderimi, süre sonunu, kalıcılığı ve sayfa yönlendirmesini
kontrol eder. GitHub Actions her push ve pull request için test ve derleme yapar.

## Kullanım kapsamı

Bu sürüm yerel veya güvenilir ortamda ortak soru havuzu kullanımı içindir.
Kullanıcı hesabı ve rol denetimi bulunmaz; yönetim ve sonuçlar ortak erişimdedir.
Sunucu varsayılan olarak yalnız kendi bilgisayarından erişim kabul eder.
Herkese açık veya resmi sınav hizmeti için kimlik doğrulama, yönetici yetkisi,
kişiye özel sonuçlar ve uygun bir veritabanı gerekir.

## Dosyalar

- `src/pages/`: yönetim, sınav, sonuç ve geçmiş ekranları
- `server/app.js`: API, değerlendirme ve üretim dosyalarının sunulması
- `server/store.js`: dosyaya kalıcı kayıt
- `scripts/dev.js`: geliştirme sunucularının birlikte çalıştırılması
- `test/api.test.js`: bütünleşik akış testleri
