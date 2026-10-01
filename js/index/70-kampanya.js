/**
 * 70-kampanya.js - Kampanya Kartları ve Slider Reklamları
 * --------------------------------------------------------
 * Kampanya verisi admin panelinden yönetilir ve burada iki farklı yerde
 * gösterilir:
 *   1. Slider  : type = 'slide' olanlar → üstteki büyük reklam alanı
 *   2. Kartlar : type = 'card'  olanlar → "Aktif Kampanyalar" ızgarası
 *
 * Bağımlılık: 70/80 arası slider modülü (mevcutSlayt), js/ortak/api.js
 */

// Aktif kampanyalar (kart + slider) — kampanyaDetay() detaylarını buradan bulur
let kampanyalar = [];

/**
 * Aktif kampanyaları API'den çeker ve hem slider'ı hem kart ızgarasını doldurur.
 * Kampanya yoksa alanlara bilgi mesajı yazar.
 */
async function kampanyalariYukle() {
    try {
        const response = await fetch(apiUrl('/campaigns'), { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Sunucu ' + response.status + ' döndü');
        }

        kampanyalar = await response.json();

        slaytlariCiz(kampanyalar.filter(k => k.type === 'slide'));
        kampanyaKartlariniCiz(kampanyalar.filter(k => k.type === 'card'));
    } catch (hata) {
        console.error('Kampanya yükleme hatası:', hata);
    }
}

/**
 * Slider reklamlarını çizer.
 * @param {Array} slaytKampanyalari - type='slide' olan kampanyalar
 */
function slaytlariCiz(slaytKampanyalari) {
    const slider = document.getElementById('slider');
    if (!slider) {
        return;
    }

    if (slaytKampanyalari.length === 0) {
        // Reklam yoksa marka adını gösteren tek bir slayt
        slider.innerHTML = `
            <div class="slayt" style="display:flex;align-items:center;justify-content:center;background:#1e293b;">
                <div class="slayt-yazi"><h2>DH Market</h2></div>
            </div>`;
    } else {
        slider.innerHTML = slaytKampanyalari.map(k => `
            <div class="slayt">
                <img src="${escapeHtml(k.image || 'https://via.placeholder.com/800x400')}" alt="${escapeHtml(k.title)}">
                <div class="slayt-yazi"><h2>${escapeHtml(k.title)}</h2></div>
            </div>
        `).join('');
    }

    // Yeni slaytlar yüklendiğinde ilk slayta dön
    mevcutSlayt = 0;
    slider.style.transform = 'translateX(0%)';
}

/**
 * Kampanya kartlarını ızgaraya çizer.
 * @param {Array} kartKampanyalari - type='card' olan kampanyalar
 */
function kampanyaKartlariniCiz(kartKampanyalari) {
    const grid = document.querySelector('.kampanya-grid');
    if (!grid) {
        return;
    }

    if (kartKampanyalari.length === 0) {
        grid.innerHTML =
            '<p style="color:#94a3b8;text-align:center;padding:20px;">Şu an aktif kampanya bulunmamaktadır.</p>';
        return;
    }

    grid.innerHTML = kartKampanyalari.map(k => `
        <div class="kampanya-karti" onclick="kampanyaDetay(${k.id})">
            <div class="kampanya-resim" style="background-image: url('${escapeHtml(k.image || 'https://via.placeholder.com/400')}');"></div>
            <div class="kampanya-icerik">
                <span class="kampanya-etiket etiket-${escapeHtml(k.label_color || 'blue')}">${escapeHtml(k.label || 'KAMPANYA')}</span>
                <h3>${escapeHtml(k.title)}</h3>
                <p>${escapeHtml(k.description || '')}</p>
                <div class="kampanya-alt">
                    <span class="kampanya-tarih">${escapeHtml(k.date_text || 'Süresiz')}</span>
                    <button class="kampanya-btn">Keşfet</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Kampanya kartına tıklandığında kampanya detayını gösterir.
 * Detay sayfası henüz yapılmadığı için bilgilendirme amaçlı uyarı verir.
 *
 * @param {number} kampanyaId - Tıklanan kampanyanın ID'si
 */
function kampanyaDetay(kampanyaId) {
    const kampanya = kampanyalar.find(k => k.id === kampanyaId);
    const baslik = kampanya ? kampanya.title : 'Kampanya';

    alert(baslik + ' kampanyasının detayları yakında!');
}