/**
 * 90-baslat.js - Sekme Yönetimi ve Uygulama Başlatma
 * -------------------------------------------------
 * Admin panelinin yönlendirme ve başlatma dosyası:
 *   1. Sidebar'daki menülere göre sekmeleri gösterir/gizler (sekmeyiGoster)
 *   2. Aktif menü öğesini işaretler (aktifNav)
 *   3. Sayfa yüklendiğinde tüm verileri API'den çeker
 */

// Sidebar menü öğeleri → gösterilecek sekme ID'leri
const SEKMELER = {
    'dashboard': 'dashboard-sekmesi',
    'urunler': 'urunler-sekmesi',
    'kullanicilar': 'kullanicilar-sekmesi',
    'kampanyalar': 'kampanyalar-sekmesi'
};

/**
 * İstenen sekmeyi gösterir, diğerlerini gizler ve sidebar menüsünü günceller.
 * @param {string} sekme - 'dashboard' | 'urunler' | 'kullanicilar' | 'kampanyalar'
 */
function sekmeyiGoster(sekme) {
    const sekmeId = SEKMELER[sekme];
    if (!sekmeId) {
        return; // Tanımsız sekme adı
    }

    // 1) Tüm sekmeleri gizle, sonra isteneni göster
    Object.values(SEKMELER).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
        }
    });

    const hedef = document.getElementById(sekmeId);
    if (hedef) {
        hedef.classList.remove('hidden');
    }

    // 2) Sidebar'da tüm menü öğelerini pasif yap
    Object.keys(SEKMELER).forEach(anahtar => {
        const menuEl = document.getElementById('nav-' + anahtar);
        if (menuEl) {
            menuEl.classList.remove('bg-blue-500/10', 'text-blue-400', 'border-l-4', 'border-blue-500');
            menuEl.classList.add('hover:bg-slate-800', 'text-slate-400');
        }
    });

    // 3) Seçili menü öğesini aktif yap
    aktifNav('nav-' + sekme);
}

/**
 * Sidebar'daki verilen menü öğesini aktif (mavi, kenarlıklı) görünüme alır.
 * @param {string} navId - Menü öğesinin id'si (örn: 'nav-urunler')
 */
function aktifNav(navId) {
    const el = document.getElementById(navId);
    if (el) {
        el.classList.remove('hover:bg-slate-800', 'text-slate-400');
        el.classList.add('bg-blue-500/10', 'text-blue-400', 'border-l-4', 'border-blue-500');
    }
}

/**
 * Sayfa yüklendiğinde tüm bölümlerin verisini tek seferde çeker.
 */
window.addEventListener('load', function () {
    urunleriYukle();       // Ürün tablosu + dashboard istatistikleri
    kampanyalariYukle();   // Kampanya/reklam tablosu
    kullanicilariYukle();  // Kullanıcı tablosu
});