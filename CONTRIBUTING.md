# Katkı rehberi

[README](README.md) içindeki kurulum adımlarını izleyin. Node.js 22.12+ gerekir.
Denemeleri gerçek kullanıcı verisi içermeyen ayrı bir `DATA_FILE` ile yapın.
Yönetici kurulumunu sunucu duruyorken çalıştırın.

## Hata bildirimi

[Hata bildirimi açarken](https://github.com/ademkrks/Soru-havuzu/issues/new/choose)
beklenen/gerçekleşen davranışı ve tekrar üretme adımlarını yazın. Tarayıcı,
işletim sistemi ve Node.js sürümünü belirtin. Görüntülerdeki kişisel verileri gizleyin.
Güvenlik açıkları için [güvenlik bildirimini](SECURITY.md) kullanın.

## Değişiklik hazırlama

- Ayrı bir dal açın ve değişikliği tek bir sorun/özellik etrafında tutun.
- Commit mesajını kısa ve anlaşılır Türkçeyle yazın.
- Türkçe arayüz metinlerini ve Gece tasarımındaki ortak stilleri koruyun.
- Kimlik ve yetkiyi istemciden gelen kullanıcı/rol alanlarına güvenerek belirlemeyin.
- Oturum, yetki veya puanlama değişikliklerinde davranış testlerini güncelleyin.
- Şifreleri, çerezleri, `.env` dosyalarını ve kullanıcı verilerini eklemeyin.

```sh
npm test
npm run build
git diff --check
```

Arayüz değişikliklerinde masaüstü ve dar ekranı kontrol edin. Pull request
açıklamasında değişikliği, nedenini ve yaptığınız kontrolleri belirtin.
