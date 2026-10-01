/**
 * 80-arayuz.js - Arayüz Yardımcıları
 * -----------------------------------
 * Sayfa düzenine ve kullanıcı etkileşimlerine ait genel işlevler:
 *   1. Sayfa içi yumuşak kaydırma (scrollToSection)
 *   2. Slider otomatik ve manuel oynatma (slaytDegistir / setInterval)
 *   3. Modal ve dropdown'ları dışarı tıklayınca kapatma
 *
 * Bağımlılık: 70-kampanya.js (slayt içeriğini çizen fonksiyonlar)
 */

// Slider'da şu an görünen slaytın indexi
let mevcutSlayt = 0;

// Slider'ın kaç saniyede bir otomatik değişeceği (ms)
const SLAYT_DEGISIM_SURESI = 5000;

/**
 * Verilen ID'ye sahip bölüme yumuşak kaydırma yapar.
 * @param {string} elementId - Hedef elementin id'si
 */
function scrollToSection(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Slider'ı bir slayt ileri/geri kaydırır.
 * En sağdaki slayttan sonra başa, en soldakinden önce sona döner.
 *
 * @param {number} yon - -1 (önceki) veya +1 (sonraki)
 */
function slaytDegistir(yon) {
    const slider = document.getElementById('slider');
    if (!slider) {
        return;
    }

    const toplamSlayt = slider.querySelectorAll('.slayt').length;
    if (toplamSlayt === 0) {
        return;
    }

    mevcutSlayt += yon;

    // Dizi sınırlarını sarmalama (döngüsel) mantığıyla düzelt
    if (mevcutSlayt >= toplamSlayt) {
        mevcutSlayt = 0;
    }
    if (mevcutSlayt < 0) {
        mevcutSlayt = toplamSlayt - 1;
    }

    // CSS transform ile yatay kaydırma
    slider.style.transform = 'translateX(-' + mevcutSlayt * 100 + '%)';
}

/**
 * Slider'ın otomatik ilerlemesini başlatır.
 */
function slaytOtomatikBaslat() {
    setInterval(() => slaytDegistir(1), SLAYT_DEGISIM_SURESI);
}

/**
 * Modal pencerelerin dışındaki (koyu) alana tıklandığında ilgili modalı kapatır.
 * Adres dropdown'unda da dışarı tıklandığında kapanmasını sağlar.
 *
 * @param {MouseEvent} olay - Tıklama olayı
 */
function disariTiklanincaKapat(olay) {
    // Kapatılacak modal ID'leri ve kapanış fonksiyonları
    const modaller = [
        { id: 'login-modal', kapat: loginModalKapat },
        { id: 'register-modal', kapat: registerModalKapat },
        { id: 'sifremi-unuttum-modal', kapat: sifremiUnuttumModalKapat },
        { id: 'adres-modal', kapat: adresModalKapat },
        { id: 'odeme-modal', kapat: odemeModalKapat }
    ];

    modaller.forEach(modal => {
        const el = document.getElementById(modal.id);
        // Tıklama doğrudan modal'ın kendisine yapıldıysa (içeriğe değil) kapat
        if (el && olay.target === el) {
            modal.kapat();
        }
    });

    // Adres dropdown'unda dışarı tıklandıysa kapat
    const adresSecici = document.getElementById('adres-secici-alani');
    const adresDropdown = document.getElementById('adres-dropdown');
    if (adresSecici && adresDropdown && !adresSecici.contains(olay.target)) {
        adresDropdown.classList.add('hidden');
    }
}

/**
 * Sayfa genelindeki tıklama olayını modal kapatma işlevine bağlar.
 */
function tiklamalariBagla() {
    window.addEventListener('click', disariTiklanincaKapat);
}