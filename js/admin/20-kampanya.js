/**
 * 20-kampanya.js - Kampanya ve Reklam Yönetimi
 * ---------------------------------------------
 * Admin panelindeki kampanyalar sekmesi:
 *   1. Tüm kampanyaları (aktif + pasif) listeler  → GET /api/campaigns?active=0
 *   2. Yeni kampanya / slide reklam ekler
 *   3. Kampanyayı düzenler
 *   4. Kampanyayı siler
 *   5. Aktif / pasif durumunu değiştirir          → POST /api/campaigns/<id>/toggle
 *
 * Bağımlılık: js/ortak/api.js, js/ortak/dom.js
 */

// Düzenleme işlemleri için kampanya önbelleği
let tumKampanyalar = [];

// Kampanya ekleme/düzenleme formlarındaki text input ID'leri (temizleme için)
const KAMPANYA_FORM_INPUTLARI = [
    'kampanya-baslik', 'kampanya-resim', 'kampanya-etiket',
    'kampanya-tarih', 'kampanya-aciklama'
];

// Etiket rengi değerleri → badge arka plan sınıfları
// Not: 'blue' eski kayıtlar için korunmuştur (admin.html artık 'mavi' gönderiyor).
// Ana sayfadaki karşılıkları css/index/10-kampanya.css içindeki .etiket-* sınıflarıdır.
const ETIKET_RENKLERI = {
    mavi: 'bg-blue-500',
    blue: 'bg-blue-500',
    yesil: 'bg-emerald-500',
    turuncu: 'bg-amber-500',
    mor: 'bg-purple-500'
};

/**
 * Tüm kampanyaları (aktif ve pasif) API'den çeker ve tabloyu doldurur.
 */
async function kampanyalariYukle() {
    const tbody = document.getElementById('kampanya-tablosu');
    const yokMesaji = document.getElementById('kampanya-yok-mesaji');
    if (!tbody || !yokMesaji) {
        return;
    }

    try {
        // active=0 → pasif kampanyalar dahil TÜMÜ getirilir (yönetim için)
        const response = await fetch(apiUrl('/campaigns?active=0'), { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Sunucu ' + response.status + ' döndü');
        }

        tumKampanyalar = await response.json();

        if (tumKampanyalar.length === 0) {
            tbody.innerHTML = '';
            yokMesaji.classList.remove('hidden');
            return;
        }

        yokMesaji.classList.add('hidden');
        tbody.innerHTML = tumKampanyalar.map(kampanyaSatiriCiz).join('');
    } catch (hata) {
        console.error('Kampanya yükleme hatası:', hata);
    }
}

/**
 * Tek bir kampanyanın tablo satırı HTML'ini üretir.
 * @param {Object} k - Kampanya kaydı
 * @returns {string} <tr> ... </tr> HTML'i
 */
function kampanyaSatiriCiz(k) {
    const badgeRenk = ETIKET_RENKLERI[k.label_color] || 'bg-slate-500';
    const etiket = k.label || '-';
    const tur = k.type === 'slide' ? 'SLIDE' : 'KART';
    const turRenk = k.type === 'slide' ? 'text-purple-400' : 'text-blue-400';
    const durum = k.active
        ? '<span class="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs">Aktif</span>'
        : '<span class="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">Pasif</span>';

    return `
        <tr class="hover:bg-slate-800/40 transition">
            <td class="px-6 py-4">
                <img src="${escapeHtml(k.image || 'https://via.placeholder.com/60')}" alt="${escapeHtml(k.title)}"
                     class="w-16 h-10 rounded object-cover border border-slate-700">
            </td>
            <td class="px-6 py-4 font-medium text-white">${escapeHtml(k.title)}</td>
            <td class="px-6 py-4">
                <span class="${turRenk} text-xs font-bold border border-current px-2 py-1 rounded">${tur}</span>
            </td>
            <td class="px-6 py-4">
                <span class="${badgeRenk} text-white text-xs font-bold px-2 py-1 rounded">${escapeHtml(etiket)}</span>
            </td>
            <td class="px-6 py-4">${durum}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="kampanyaDuzenleAc(${k.id})" title="Düzenle"
                        class="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all mr-1">
                    <i class="fas fa-edit"></i> Düzenle
                </button>
                <button onclick="kampanyaToggle(${k.id})" title="Aktif / Pasif yap"
                        class="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all mr-1">
                    <i class="fas fa-toggle-on"></i> Aktif/Pasif
                </button>
                <button onclick="kampanyaSil(${k.id})" title="Sil"
                        class="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all">
                    <i class="fas fa-trash-alt"></i> Sil
                </button>
            </td>
        </tr>
    `;
}

// ==========================================
// YENİ KAMPANYA EKLEME
// ==========================================

/** "Yeni Kampanya / Reklam" formunu açar. */
function kampanyaFormuAc() {
    const form = document.getElementById('kampanya-formu');
    if (form) {
        form.classList.remove('hidden');
    }
}

/** "Yeni Kampanya / Reklam" formunu kapatır. */
function kampanyaFormuKapat() {
    const form = document.getElementById('kampanya-formu');
    if (form) {
        form.classList.add('hidden');
    }
}

/**
 * Kampanya ekleme formundaki verileri backend'e gönderir.
 * Başlık ve resim URL'i zorunludur.
 */
async function kampanyaKaydet() {
    const title = inputOku('kampanya-baslik');
    const image = inputOku('kampanya-resim');
    const type = inputOku('kampanya-tur') || 'card';
    const label = inputOku('kampanya-etiket');
    const label_color = inputOku('kampanya-etiket-renk') || 'mavi';
    const date_text = inputOku('kampanya-tarih');
    const description = inputOku('kampanya-aciklama');

    if (!title || !image) {
        alert('Başlık ve resim URL zorunludur!');
        return;
    }

    try {
        const response = await fetch(apiUrl('/campaigns'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title, description: description, image: image, type: type,
                label: label, label_color: label_color, date_text: date_text, active: 1
            })
        });

        if (response.ok) {
            alert('Kampanya eklendi!');
            formAlanlariniTemizle(KAMPANYA_FORM_INPUTLARI);
            kampanyaFormuKapat();
            kampanyalariYukle();
        } else {
            const veri = await response.json();
            alert(veri.message || 'Kampanya eklenemedi!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

// ==========================================
// KAMPANYA DÜZENLEME
// ==========================================

/**
 * Kampanya düzenleme formunu açar ve seçili kampanyanın bilgileriyle doldurur.
 * @param {number} id - Düzenlenecek kampanyanın ID'si
 */
function kampanyaDuzenleAc(id) {
    const kampanya = tumKampanyalar.find(k => k.id === id);
    if (!kampanya) {
        return;
    }

    formAlanlariniDoldur({
        'duzenle-kampanya-id': kampanya.id,
        'duzenle-kampanya-baslik': kampanya.title,
        'duzenle-kampanya-resim': kampanya.image,
        'duzenle-kampanya-tur': kampanya.type,
        'duzenle-kampanya-etiket': kampanya.label,
        'duzenle-kampanya-etiket-renk': kampanya.label_color,
        'duzenle-kampanya-tarih': kampanya.date_text,
        'duzenle-kampanya-aciklama': kampanya.description
    });

    document.getElementById('kampanya-duzenle-formu').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Kampanya düzenleme formunu kapatır. */
function kampanyaDuzenleKapat() {
    const form = document.getElementById('kampanya-duzenle-formu');
    if (form) {
        form.classList.add('hidden');
    }
}

/**
 * Kampanya düzenleme formundaki verileri backend'e gönderir.
 * Başlık ve resim URL'i zorunludur.
 */
async function kampanyaGuncelle() {
    const id = parseInt(inputOku('duzenle-kampanya-id'));
    const title = inputOku('duzenle-kampanya-baslik');
    const image = inputOku('duzenle-kampanya-resim');
    const type = inputOku('duzenle-kampanya-tur') || 'card';
    const label = inputOku('duzenle-kampanya-etiket');
    const label_color = inputOku('duzenle-kampanya-etiket-renk') || 'mavi';
    const date_text = inputOku('duzenle-kampanya-tarih');
    const description = inputOku('duzenle-kampanya-aciklama');

    // Mevcut kampanyanın aktif/pasif durumunu koru.
    // (Sabit 'active: 1' göndermek, düzenleme sırasında pasif kampanyayı
    //  istemeden aktifleştiriyordu.)
    const mevcut = tumKampanyalar.find(k => k.id === id);
    const active = mevcut ? mevcut.active : 1;

    if (!title || !image) {
        alert('Başlık ve resim URL zorunludur!');
        return;
    }

    try {
        const response = await fetch(apiUrl('/campaigns/' + id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title, description: description, image: image, type: type,
                label: label, label_color: label_color, date_text: date_text, active: active
            })
        });

        if (response.ok) {
            alert('Kampanya güncellendi!');
            kampanyaDuzenleKapat();
            kampanyalariYukle();
        } else {
            const veri = await response.json();
            alert(veri.message || 'Kampanya güncellenemedi!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

// ==========================================
// SİLME VE DURUM DEĞİŞTİRME
// ==========================================

/**
 * Kampanyayı kalıcı olarak siler. Silmeden önce onay ister.
 * @param {number} id - Silinecek kampanyanın ID'si
 */
async function kampanyaSil(id) {
    if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(apiUrl('/campaigns/' + id), { method: 'DELETE' });
        if (response.ok) {
            kampanyalariYukle();
        } else {
            alert('Silme işlemi başarısız!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

/**
 * Kampanyanın aktif/pasif durumunu tersine çevirir.
 * Ana sayfada yalnızca aktif olan kampanyalar görünür.
 * @param {number} id - Kampanyanın ID'si
 */
async function kampanyaToggle(id) {
    try {
        const response = await fetch(apiUrl('/campaigns/' + id + '/toggle'), { method: 'POST' });
        if (response.ok) {
            kampanyalariYukle();
        } else {
            alert('Durum değiştirilemedi!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}