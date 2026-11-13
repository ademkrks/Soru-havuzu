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

## Kullanıcılar ve yetkiler

İlk açılışta giriş ekranı gösterilir. Hesap Oluştur ile kayıt olan herkes normal
kullanıcıdır. E-posta ve 10–128 karakterlik şifreyle giriş yapılır.
Normal kullanıcı sınava girer ve yalnız kendi sonuçlarını/detaylarını görür.
Soru listesi, cevap anahtarı ve soru ekleme/düzenleme/silme yalnız yöneticiye açıktır.
Yönetici de sonuç geçmişinde yalnız kendi sonuçlarını görür.

### Yönetici oluşturma

Sunucuyu durdurun. PowerShell'de yönetici e-postasını ve şifresini ortam değişkeni
olarak belirleyip kurulum komutunu çalıştırın. Şifreyi kaynak koduna yazmayın.

```powershell
$env:ADMIN_EMAIL = Read-Host 'Yönetici e-postası'
$adminSecret = Read-Host 'Yönetici şifresi (en az 10 karakter)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $adminSecret).Password
npm run admin
Remove-Item Env:ADMIN_PASSWORD
Remove-Item Env:ADMIN_EMAIL
Remove-Variable adminSecret
npm start
```

Komut e-posta mevcutsa o hesabı yöneticiye yükseltir ve şifresini yeniler;
o hesabın açık oturumlarını kapatır. Yeni e-postada yönetici hesabı oluşturur.
Varsayılan yönetici veya sabit şifre bulunmaz. DATA_FILE kullanıyorsanız kurulum
komutunda ve sunucuda aynı dosyayı seçin. JSON kaydına aynı anda iki süreç yazmayın.

### Oturum ve veri ayrımı

Şifreler rastgele tuzla scrypt kullanılarak özetlenir. Oturumlar 24 saat sürer;
çerez HttpOnly ve SameSite=Strict kullanır. Çıkış sunucudaki oturumu iptal eder.
Kayıt/giriş için IP başına 15 dakikada 30 deneme sınırı vardır (tek sunucu süreci).
Yazma isteklerinde JSON içerik türü ve varsa Origin denetlenir.
Üretimde HTTPS kullanın ve NODE_ENV=production ayarlayın; çerez Secure olur.
HTTPS ters vekili isteğin Host bilgisini dışarıdaki adresle tutarlı iletmelidir.

Mevcut soru havuzu korunur. Önceki sürümden kalan sahipsiz sınav ve sonuçlar
silinmez, hiçbir yeni hesaba otomatik atanmaz ve sonuç API'sinde görünmez.
Yeni sınavlar oturumdaki kullanıcıya bağlanır; istemciden gelen kullanıcı/rol
bilgileri yetki belirlemek için kullanılmaz. Sonuç detayı da sunucudan sahiplik
kontrolüyle alınır. Tarayıcı geçmişine sonuç içeriği yerine yalnız sonuç kimliği yazılır.

Kimlik uçları: POST /api/auth/kayit, POST /api/auth/giris,
GET /api/auth/ben, POST /api/auth/cikis. Sonuç detayı: GET /api/sonuclar/:id.
Diğer bütün API uçları giriş ister. Kategori listesi giriş yapan herkese açıktır.

## Dosyalar

- `src/pages/`: yönetim, sınav, sonuç ve geçmiş ekranları
- `server/app.js`: API, değerlendirme ve üretim dosyalarının sunulması
- `server/store.js`: dosyaya kalıcı kayıt
- `scripts/dev.js`: geliştirme sunucularının birlikte çalıştırılması
- `test/api.test.js`: bütünleşik akış testleri
