/**
 * 99-baslat.js - Uygulama Başlatma
 * --------------------------------
 * Ana sayfanın tek başlatma dosyasıdır.
 *
 * Burada YALNIZCA "window load" olayı dinlenir. Tüm veri yükleme
 * çağrıları burada toplanmıştır; böylece aynı fonksiyon iki kez
 * çağrılmaz ve sayfa ilk açılışta gereksiz istek yapılmaz.
 *
 * Yükleme sırası:
 *   1. Ürünler ve kampanyalar API'den çekilir
 *   2. Giriş yapılmışsa kullanıcı adı navbar'a yazılır
 *   3. Adres dropdown'u (localStorage) yeniden çizilir
 *   4. Arama kutusu olayı bağlanır, slider otomatik başlatılır
 */
window.addEventListener('load', function () {
    // Veri yükleme
    urunleriYukle();
    kampanyalariYukle();
    kullaniciBilgisiniYukle();

    // Arayüz hazırlığı
    adresDropdownGuncelle();
    aramaKutusunuBagla();
    tiklamalariBagla();
    slaytOtomatikBaslat();
});