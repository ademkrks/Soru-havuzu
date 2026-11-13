# Güvenlik bildirimi

Şifre, oturum, kullanıcı verisi veya yetki atlatma içeren sorunları herkese açık
issue içinde paylaşmayın. GitHub'ın [özel güvenlik bildirimi ekranını](https://github.com/ademkrks/Soru-havuzu/security/advisories/new)
kullanabilirsiniz; kullanılabilirliği deponun özel bildirim ayarına bağlıdır.
Ekran açılamıyorsa hassas ayrıntı vermeden proje sahibinden özel bir kanal isteyin.

Bildirimde etkilenen commit'i, etkiyi ve test verileriyle tekrar üretme adımlarını
belirtin. Gerçek kullanıcı verisi, şifre veya oturum çerezi eklemeyin.

Güvenlik düzeltmeleri güncel `main` dalında yapılır; ayrı sürümler için bakım
takvimi tanımlanmamıştır. Bağımlılıkları `npm audit` ile kontrol edin.

Üretimde HTTPS ve `NODE_ENV=production` kullanın. Veri dosyasını, yedekleri ve
ortam değişkenlerini yalnız yetkili kişilerin erişebildiği yerde tutun.
`data/` klasörünü statik dosya sunucusuna veya Git deposuna eklemeyin.
Varsayılan dinleme adresi `127.0.0.1`'dir.

Dosya tabanlı kayıt ve süreç içi giriş deneme sınırı tek sunucu süreci içindir.
Bu belge uygulamanın bağımsız güvenlik denetiminden geçtiği anlamına gelmez.
