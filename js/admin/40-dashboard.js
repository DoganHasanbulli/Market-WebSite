/**
 * 40-dashboard.js - Dashboard İstatistikleri
 * -------------------------------------------
 * Ürünler yüklendiğinde çağrılır ve paneldeki dört özet kutusunu,
 * düşük stok listesini, kategori dağılımını ve son eklenen ürünleri doldurur.
 *
 * Bağımlılık: js/ortak/api.js (escapeHtml)
 */

// Kategori dağılımında kullanılacak çubuk renkleri
const KATEGORI_RENKLERI = {
    'Meyve': 'bg-emerald-500',
    'İçecek': 'bg-blue-500',
    'Atıştırmalık': 'bg-amber-500'
};

// Bir ürünün "düşük stok" sayılması için üst sınır
const DUSUK_STOK_ESIGI = 5;

/**
 * Dashboard'daki tüm istatistik alanlarını ürün listesine göre günceller.
 *
 * @param {Array} urunler - Tüm ürünler (tumUrunler)
 */
function istatistikleriGuncelle(urunler) {
    const toplamUrun = urunler.length;
    const dusukStokAdet = urunler.filter(u => (u.stock || 0) <= DUSUK_STOK_ESIGI).length;
    const toplamKalori = urunler.reduce((toplam, u) => toplam + (u.calories || 0), 0);
    const envanterDegeri = urunler.reduce((toplam, u) => toplam + ((u.price || 0) * (u.stock || 0)), 0);

    ozetKutusuDoldur('dash-toplam', toplamUrun);
    ozetKutusuDoldur('dash-dusuk', dusukStokAdet);
    ozetKutusuDoldur('dash-kalori', toplamKalori.toLocaleString('tr-TR'));
    ozetKutusuDoldur('dash-deger', envanterDegeri.toLocaleString('tr-TR') + ' TL');

    dusukStokListesiniDoldur(urunler);
    kategoriDagiliminiDoldur(urunler);
    sonUrunleriDoldur(urunler);
}

/**
 * Tek bir özet kutusuna değer yazar (kutu yoksa sessizce geçer).
 * @param {string} id - Elementin id'si
 * @param {string|number} deger - Yazılacak değer
 */
function ozetKutusuDoldur(id, deger) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = deger;
    }
}

/**
 * Stoku 5 ve altındaki ürünleri listeler; hepsi yeterliyse bilgi mesajı gösterir.
 * @param {Array} urunler - Tüm ürünler
 */
function dusukStokListesiniDoldur(urunler) {
    const listeEl = document.getElementById('dash-dusuk-stok-listesi');
    if (!listeEl) {
        return;
    }

    const dusukUrunler = urunler.filter(u => (u.stock || 0) <= DUSUK_STOK_ESIGI);

    if (dusukUrunler.length === 0) {
        listeEl.innerHTML =
            '<p class="text-emerald-400 text-sm flex items-center gap-2">' +
            '<i class="fas fa-check-circle"></i> Tüm ürünlerin stoku yeterli.</p>';
        return;
    }

    listeEl.innerHTML = dusukUrunler.map(u => `
        <div class="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-amber-500/20">
            <div class="flex items-center gap-3">
                <img src="${escapeHtml(u.image || 'https://via.placeholder.com/40')}" alt="${escapeHtml(u.name)}"
                     class="w-8 h-8 rounded object-cover border border-slate-700">
                <span class="text-white text-sm font-medium">${escapeHtml(u.name)}</span>
            </div>
            <span class="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-1 rounded">Stok: ${u.stock}</span>
        </div>
    `).join('');
}

/**
 * Kategori dağılımını yatay çubuk grafik olarak çizer.
 * Çubuk uzunluğu, en çok ürünü olan kategoriye göre ölçeklenir.
 * @param {Array} urunler - Tüm ürünler
 */
function kategoriDagiliminiDoldur(urunler) {
    const dagilimEl = document.getElementById('dash-kategori-dagilimi');
    if (!dagilimEl) {
        return;
    }

    // Kategori → ürün sayısı haritası
    const dagilim = {};
    urunler.forEach(u => {
        const kategori = u.category || 'Diğer';
        dagilim[kategori] = (dagilim[kategori] || 0) + 1;
    });

    const enFazla = Math.max(...Object.values(dagilim));
    if (!enFazla) {
        return; // Ürün yoksa grafik boş kalır
    }

    dagilimEl.innerHTML = Object.entries(dagilim).map(([kategori, sayi]) => {
        const yuzde = Math.round((sayi / enFazla) * 100);
        const barRenk = KATEGORI_RENKLERI[kategori] || 'bg-slate-500';

        return `
            <div>
                <div class="flex justify-between text-xs mb-1">
                    <span class="text-slate-300">${escapeHtml(kategori)}</span>
                    <span class="text-white font-bold">${sayi} ürün</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-2.5">
                    <div class="${barRenk} h-2.5 rounded-full transition-all" style="width:${yuzde}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * "Son Eklenen Ürünler" tablosuna en son eklenen 5 ürünü basar
 * (ID'si en büyük olan = en yeni eklenen).
 * @param {Array} urunler - Tüm ürünler
 */
function sonUrunleriDoldur(urunler) {
    const listeEl = document.getElementById('dash-son-urunler');
    if (!listeEl) {
        return;
    }

    const sonUrunler = [...urunler].sort((a, b) => b.id - a.id).slice(0, 5);

    listeEl.innerHTML = sonUrunler.map(u => {
        const stokRenk = (u.stock || 0) <= DUSUK_STOK_ESIGI ? 'text-amber-400' : 'text-emerald-400';

        return `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="px-4 py-3 flex items-center gap-3">
                    <img src="${escapeHtml(u.image || 'https://via.placeholder.com/32')}" alt="${escapeHtml(u.name)}"
                         class="w-8 h-8 rounded object-cover border border-slate-700">
                    <span class="text-white font-medium">${escapeHtml(u.name)}</span>
                </td>
                <td class="px-4 py-3">${escapeHtml(u.category || '-')}</td>
                <td class="px-4 py-3 text-blue-400 font-bold">${Number(u.price).toFixed(2)} TL</td>
                <td class="px-4 py-3">
                    <span class="${stokRenk} font-medium">${u.stock}</span>
                </td>
            </tr>
        `;
    }).join('');
}