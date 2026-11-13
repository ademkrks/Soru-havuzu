# Kullanıcı ve yetki kontrolleri

13 Kasım 2026 tarihinde ayrı test verileriyle doğrulandı.

## Otomatik testler

- Girişsiz API erişimi 401 döner.
- Normal kullanıcı kayıt isteğinde admin rolü gönderse bile user olarak oluşturulur.
- Şifre özeti saklanır, API cevabına şifre veya özet eklenmez.
- Aynı e-posta ile ikinci kayıt ve hatalı şifreyle giriş reddedilir.
- Normal kullanıcı soru listesini, cevap anahtarını ve yazma uçlarını kullanamaz.
- Yönetici soru ekleyebilir; geçersiz Origin ve JSON dışı yazma istekleri reddedilir.
- Başka kullanıcının sınavına cevap kaydetme ve gönderim reddedilir.
- Sonuç listesi ve doğrudan sonuç detayı yalnız sahibine açılır.
- Yönetici de başkasının sonucunu göremez.
- Sahipsiz eski sonuçlar korunur ve hiçbir hesabın geçmişinde görünmez.
- Çıkış ve 24 saatlik süre sonrasında oturum kabul edilmez.
- Giriş/kayıt deneme sınırı uygulanır.
- Önceki soru/sınav/puanlama testleri kimlik doğrulamayla birlikte geçer.

## Gerçek tarayıcı kontrolleri

- Girişsiz ziyaret giriş ekranına yönlendirilir.
- İki ayrı normal kullanıcı oluşturuldu; yalnız ilk hesap sınava girdi.
- İlk hesap kendi sonucunu ve detayını gördü; ikinci hesabın geçmişi boş kaldı.
- Normal kullanıcı yönetim adresinden sınav sayfasına yönlendirildi.
- Ayrı test yöneticisi yönetim panelini açtı ve soru düzenleme isteği gönderdi.
- Hatalı şifre anlaşılır uyarı gösterdi; doğru şifreyle yeniden giriş başarılı oldu.
- Yeniden girişten sonra önceki kişisel sonuç ve detay açıldı.
- Çıkış sonrası sonuç adresi giriş ekranına yönlendirildi.
- Son kontrolde tarayıcı hata kaydı görülmedi.

Test hesapları ve verileri kaynak depoya dahil edilmez. Gerçek yönetici kurulumu
README içindeki komutla yapılır; uygulamanın varsayılan hesabı veya şifresi yoktur.
