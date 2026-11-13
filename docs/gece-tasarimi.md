# Gece arayüzü

Seçilen Gece tasarımı uygulamanın giriş/kayıt, sınav hazırlığı, aktif sınav,
sonuç, sonuç geçmişi ve yönetim ekranlarına uygulandı.

- Koyu zemin, açık mor vurgu ve ortak form/buton stilleri
- Masaüstünde sabit sol menü, mobilde üst gezinme
- Gerçek kullanıcı ve role göre menü, hesap bilgisi ve çıkış
- Girişte iki sütunlu tanıtım/form, mobilde tek sütun
- Sınavda tek soru, önceki/sonraki geçiş, cevap durumunu gösteren soru haritası
- Süre ve cevap ilerlemesi; mevcut cevap kaydı, yenileme ve otomatik gönderim korunur
- Sonuçta gerçek yüzdeyi gösteren puan halkası, dağılım ve cevap inceleme
- Yönetimde gerçek soru ve kategori sayıları, düzenleme formu ve soru listesi
- Dar ekranda kendi içinde kayan geçmiş tablosu
- Gönderim penceresinde arka plan kilidi, odak yönetimi ve Escape desteği
- Görünür klavye odağı ve azaltılmış hareket tercihi

## Doğrulama

- npm run build başarılı.
- Üç otomatik sunucu/yetki/puanlama testi başarılı.
- Gerçek tarayıcıda 1280 px masaüstü ve 390 px mobil görünüm kontrol edildi.
- Yönetici giriş, soru düzenleme ve başarılı kayıt doğrulandı.
- İki soruya cevap verilip haritadan geri dönüldüğünde cevapların korunduğu görüldü.
- Son soruda sonraki düğmesinin devre dışı olduğu doğrulandı.
- 1 doğru, 1 yanlış, 18 boş cevap 5 puan verdi.
- Sonuç ve geçmiş ekranları yenilendi, mobilde sayfa yatay taşmadı.
- Gönderim penceresi mobil ekrana sığdı; Escape ile kapandı.
- Son tarayıcı kontrolünde hata kaydı görülmedi.

Tasarım katmanı src/gece.css dosyasındadır; temel stillerden sonra yüklenir.
Kimlik doğrulama ve sunucudaki sahiplik/yetki kuralları değiştirilmedi.
