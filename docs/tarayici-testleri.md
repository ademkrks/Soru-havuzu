# Tarayıcı testleri — 13 Kasım 2026

Testler gerçek tarayıcıda, üretim derlemesi ve ayrı yerel test verileriyle yapıldı.

| Senaryo | Sonuç |
| --- | --- |
| Yönetim, sınav, sonuç ve geçmiş sayfaları | Geçti |
| Boş soru havuzunda sınav başlatma | Anlaşılır uyarı, sınav başlamıyor |
| Boş sonuç geçmişi | Açıklama ve sınava git düğmesi |
| Zorunlu alanlar, soru ekleme ve düzenleme | Geçti |
| Metin/kategori araması ve eşleşmeyen arama | Geçti |
| Soru silme ve 19 soruda sınavı engelleme | Geçti |
| Kategori seçerek 20 soruluk sınav açma | Geçti |
| Cevap seçimi ve yenilemede cevap/süre koruma | Geçti |
| Gönderim onayı, sınava dönüş ve Escape | Geçti |
| 1 doğru, 1 yanlış, 18 boş | 5 puan |
| Tamamen boş sınav | 0 puan |
| 20 doğru | 100 puan |
| Sonucu yenileme ve geçmişten detay açma | Geçti |
| Sonuçtan tekrar sınava girme | Geçti |
| Süre dolumunda otomatik gönderim | Geçti |
| Sunucu kesintisinde cevapları koruma ve yeniden gönderim | Geçti |
| Bilinmeyen sayfa adresi | Yönetim sayfasına yönlendiriyor |
| Dar ekranda menü ve geçmiş tablosu | Sayfa taşmıyor; tablo kendi içinde kayıyor |
| Normal akışta tarayıcı hata kayıtları | Hata görülmedi |

Süre dolumu, createApp fonksiyonuna ayrı test sunucusunda 8000 ms süre verilerek
sınandı. Normal sunucu 20 dakika kullanır. Kesinti testi sırasında bu ayrı test
sunucusu kapatılıp yeniden açıldı; 1 kayıtlı doğru cevap yeniden gönderimde
5 puan olarak değerlendirildi. Test verileri depoya eklenmedi.

Bulunup düzeltilenler:

- Tamamlanmış sınavın oturum kaydının yeniden yazılması ve tekrar sınava geçişi bozması.
- Arama sonucu boş olduğunda açıklama gösterilmemesi.
- Mobil geçmiş tablosunun tüm sayfayı yatay taşırması ve dar menünün sığmaması.
- Form etiketlerinin alanlara bağlı olmaması ve seçeneklerde eksik zorunlu alan denetimi.
- Gönderim penceresinde Escape ve klavye odağı desteğinin eksik olması.
- Sınav açılırken sayacın sunucudaki bitiş yerine sabit 20:00 ile başlaması.
- Türkçe belgeye rağmen başlığın İngilizce, açıklamanın karma dilde kalması.
- Bağlantı hatalarının teknik ve yetersiz mesajlarla gösterilmesi.

Son doğrulama: npm test ve npm run build başarılı.
