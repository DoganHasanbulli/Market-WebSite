/**
 * api.js - Ortak API Yardımcıları
 * --------------------------------
 * Hem index.html hem admin.html tarafından yüklenen ilk dosyadır.
 * İki sayfanın da ihtiyaç duyduğu API adresi tanımı ve metin kaçış
 * (escape) fonksiyonunu barındırır.
 *
 * DİKKAT: Bu dosya ES module değildir. HTML içindeki `onclick="..."`
 * çağrıları fonksiyonları global kapsamdan bulduğu için, tüm JS
 * dosyaları klasik `<script src>` etiketleriyle sırayla yüklenir.
 */

// Flask backend'in kök adresi (main.py içindeki app.config ile aynı port)
const API_URL = 'http://127.0.0.1:5000/api';

/**
 * API uç noktası adresi üretir.
 * Örnek: apiUrl('/products/5') → 'http://127.0.0.1:5000/api/products/5'
 *
 * @param {string} yol - '/products' gibi, önü ve sonu '/' olmayan yol
 * @returns {string} Tam adres
 */
function apiUrl(yol) {
    return `${API_URL}${yol}`;
}

/**
 * HTML kaçışı (XSS koruması).
 *
 * API'den gelen metinler (ürün adı, açıklama, adres, kampanya başlığı...)
 * innerHTML ile yazıldığı için kaçış uygulanmazsa sayfaya HTML/JS enjekte
 * edilebilir. Metin içeriği ekrana basmadan ÖNCE bu fonksiyondan geçirilir.
 *
 * @param {*} deger - Kaçırılacak değer (null/undefined → boş string)
 * @returns {string} HTML güvenli metin
 */
function escapeHtml(deger) {
    if (deger === null || deger === undefined) {
        return '';
    }
    return String(deger)
        .replace(/&/g, '&amp;')   // & → &amp;   (önce yapılmalı, sıra önemli)
        .replace(/</g, '&lt;')    // < → &lt;
        .replace(/>/g, '&gt;')    // > → &gt;
        .replace(/"/g, '&quot;')  // " → &quot; (HTML attribute değerleri için)
        .replace(/'/g, '&#39;');  // ' → &#39;  (tek tırnaklı attribute için)
}

/**
 * Ağ hatası yakalandığında konsola yazar ve kullanıcıya uyarı gösterir.
 * Tüm fetch işlemlerinde tekrar eden bu 2 satırı toplar.
 *
 * @param {Error} hata - Yakalanan hata nesnesi
 * @param {string} mesaj - Kullanıcıya gösterilecek uyarı metni
 */
function apiHataBildir(hata, mesaj) {
    console.error(mesaj + ':', hata);
    alert(mesaj);
}