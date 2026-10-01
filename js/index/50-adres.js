/**
 * 50-adres.js - Adres Yönetimi (localStorage)
 * ---------------------------------------------
 * Kullanıcının kayıtlı teslimat adresleri tarayıcıda saklanır; sunucuya
 * gönderilmez. Bu dosya:
 *   1. Adres listesini okur / yazar (adresleriGetir / adresleriKaydet)
 *   2. Navbar'daki adres dropdown'unu açar ve listeler
 *   3. Bir adresi seçer veya siler
 *   4. Yeni adres ekleme modalını yönetir
 *
 * Bağımlılık: js/ortak/api.js (escapeHtml)
 */

// localStorage anahtarları
const ADRES_KEY = 'dh_market_addresses';       // Adres listesi (JSON dizi)
const SECILI_ADRES_KEY = 'dh_market_selected_address'; // Seçili adresin indexi

// Şu an seçili olan adresin `adresler` dizisindeki indexi
let seciliAdresIndex = parseInt(localStorage.getItem(SECILI_ADRES_KEY) || '0', 10) || 0;

/**
 * Kayıtlı adres listesini okur.
 * @returns {Array} [{ baslik, metin, sehir }, ...]
 */
function adresleriGetir() {
    try {
        return JSON.parse(localStorage.getItem(ADRES_KEY) || '[]');
    } catch (hata) {
        // Bozuk JSON verisi varsa sıfırdan başla
        console.error('Adresler okunamadı:', hata);
        return [];
    }
}

/**
 * Adres listesini kaydeder ve dropdown'u yeniler.
 * @param {Array} liste - Kaydedilecek adres dizisi
 */
function adresleriKaydet(liste) {
    localStorage.setItem(ADRES_KEY, JSON.stringify(liste));
    adresDropdownGuncelle();
}

/**
 * Navbar'daki adres dropdown'unu açar / kapatır.
 */
function adresDropdownAc() {
    const dropdown = document.getElementById('adres-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

/**
 * Adres dropdown listesini ve seçili adres metnini ekrana basar.
 * Sayfa yüklendiğinde ve adres değiştiğinde çağrılır.
 */
function adresDropdownGuncelle() {
    const listeEl = document.getElementById('adres-listesi');
    const metinEl = document.getElementById('secili-adres-metni');
    const adresler = adresleriGetir();

    // Hiç adres kaydedilmemişse
    if (adresler.length === 0) {
        if (listeEl) {
            listeEl.innerHTML = '<p class="adres-bos">Henüz adres eklenmemiş.</p>';
        }
        if (metinEl) {
            metinEl.innerText = 'Adres Seç';
        }
        return;
    }

    // Seçili index artık geçersizse başa dön
    if (seciliAdresIndex >= adresler.length) {
        seciliAdresIndex = 0;
    }

    if (listeEl) {
        listeEl.innerHTML = adresler.map((adres, index) => {
            const secili = index === seciliAdresIndex;
            const ikonRenk = secili ? '#38bdf8' : '#64748b';
            return `
                <div class="adres-dropdown-item ${secili ? 'aktif' : ''}" onclick="adresSec(${index})">
                    <i class="fas fa-map-marker-alt" style="color:${ikonRenk}"></i>
                    <div>
                        <div class="adres-baslik">${escapeHtml(adres.baslik || 'Adres ' + (index + 1))}</div>
                        <div class="adres-alt-metin">${escapeHtml(adres.metin)}</div>
                    </div>
                    <button class="adres-sil-btn" onclick="event.stopPropagation(); adresSil(${index})" title="Adresi sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    // Buton üzerinde görünen seçili adres (uzun metni kısalt)
    const secili = adresler[seciliAdresIndex];
    if (metinEl && secili) {
        metinEl.innerText = secili.baslik || secili.metin.substring(0, 15) + '...';
    }
}

/**
 * Listeden bir adresi seçer ve dropdown'u kapatır.
 * @param {number} index - Seçilecek adresin indexi
 */
function adresSec(index) {
    seciliAdresIndex = index;
    localStorage.setItem(SECILI_ADRES_KEY, index);
    adresDropdownGuncelle();

    const dropdown = document.getElementById('adres-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

/**
 * Listeden bir adresi siler.
 * @param {number} index - Silinecek adresin indexi
 */
function adresSil(index) {
    const adresler = adresleriGetir();
    adresler.splice(index, 1);

    // Silinen adres seçiliyse seçimi sıfırla
    if (seciliAdresIndex >= adresler.length) {
        seciliAdresIndex = 0;
    }
    localStorage.setItem(SECILI_ADRES_KEY, seciliAdresIndex);

    adresleriKaydet(adresler);
}

/**
 * "Yeni Adres Ekle" modalını açar ve formu temizler.
 */
function adresModalAc() {
    const modal = document.getElementById('adres-modal');
    if (modal) {
        modal.style.display = 'block';
    }

    // Adres seçici açıksa kapat (modal arkasında kalmasın)
    const dropdown = document.getElementById('adres-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

/**
 * "Yeni Adres Ekle" modalını kapatır.
 */
function adresModalKapat() {
    const modal = document.getElementById('adres-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Form alanlarındaki adresi listeye ekler.
 */
function adresKaydet() {
    const baslik = document.getElementById('adres-baslik').value.trim();
    const metin = document.getElementById('adres-metni').value.trim();
    const sehir = document.getElementById('adres-sehir').value.trim();

    if (!metin) {
        alert('Lütfen açık adres girin!');
        return;
    }

    const adresler = adresleriGetir();
    // Başlık girilmemişse otomatik numaralandır
    adresler.push({ baslik: baslik || 'Adres ' + (adresler.length + 1), metin: metin, sehir: sehir });
    adresleriKaydet(adresler);

    // Formu temizle ve modalı kapat
    ['adres-baslik', 'adres-metni', 'adres-sehir'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
        }
    });
    adresModalKapat();
}