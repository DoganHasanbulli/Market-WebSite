/**
 * 10-urunler.js - Ürün Yönetimi
 * -----------------------------
 * Admin panelindeki ürün sekmesi:
 *   1. Ürün listesini API'den çeker ve tabloya basar (urunleriYukle, tabloyuDoldur)
 *   2. Tablodan hızlı stok güncellemesi (stokGuncelle)
 *   3. Yeni ürün ekleme formu (formuAc/Kapat, urunEkle)
 *   4. Ürün düzenleme formu (urunDuzenleAc/Kapat, urunGuncelle)
 *   5. Ürün silme (urunSil)
 *   6. Groq AI ile ürün bilgisi otomatik doldurma (aiIleDoldur)
 *
 * Bağımlılık: js/ortak/api.js (apiUrl, escapeHtml),
 *             js/ortak/dom.js (inputOku, formAlanlariniDoldur),
 *             40-dashboard.js (istatistikleriGuncelle)
 */

// Yönetim (düzenleme) işlemleri için ürün önbelleği.
// API'den her yenilemede güncellenir; düzenleme formunu doldurmak için kullanılır.
let tumUrunler = [];

// Ürün Ekleme / Düzenleme formlarındaki input ID'leri (toplu temizleme için)
const URUN_FORM_INPUTLARI = [
    'yeni-ad', 'yeni-kategori', 'yeni-fiyat', 'yeni-stok', 'yeni-kalori',
    'yeni-resim', 'yeni-aciklama', 'yeni-karbonhidrat', 'yeni-yag', 'yeni-agirlik'
];

/**
 * Ürün listesini API'den çeker, tabloyu ve dashboard istatistiklerini günceller.
 */
async function urunleriYukle() {
    const tablo = document.getElementById('urun-tablosu');

    try {
        const response = await fetch(apiUrl('/products'), { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Sunucu ' + response.status + ' döndü');
        }

        tumUrunler = await response.json();

        tabloyuDoldur(tumUrunler);
        istatistikleriGuncelle(tumUrunler);
    } catch (hata) {
        console.error('Ürün yükleme hatası:', hata);
        if (tablo) {
            tablo.innerHTML =
                '<tr><td colspan="5" class="px-6 py-4 text-center text-red-400">' +
                'Sunucuya bağlanılamadı! (Flask çalışıyor mu?)</td></tr>';
        }
    }
}

/**
 * Ürün tablosunu (tbody) verilen listeye göre yeniden oluşturur.
 * @param {Array} urunler - Gösterilecek ürünler
 */
function tabloyuDoldur(urunler) {
    const tbody = document.getElementById('urun-tablosu');
    const yokMesaji = document.getElementById('urun-yok-mesaji');
    if (!tbody || !yokMesaji) {
        return;
    }

    // Liste boşsa tabloyu gizle, "henüz ürün yok" mesajını göster
    if (!urunler || urunler.length === 0) {
        tbody.innerHTML = '';
        yokMesaji.classList.remove('hidden');
        return;
    }

    yokMesaji.classList.add('hidden');

    tbody.innerHTML = urunler.map(u => `
        <tr class="hover:bg-slate-800/40 transition">
            <td class="px-6 py-4 flex items-center gap-3">
                <img src="${escapeHtml(u.image || 'https://via.placeholder.com/50')}" alt="${escapeHtml(u.name)}"
                     class="w-10 h-10 rounded-lg object-cover border border-slate-700">
                <span class="font-medium text-white">${escapeHtml(u.name)}</span>
            </td>
            <td class="px-6 py-4">${escapeHtml(u.category || '-')}</td>
            <td class="px-6 py-4 font-bold text-blue-400">${Number(u.price).toFixed(2)} TL</td>
            <td class="px-6 py-4">
                <input type="number" value="${u.stock}" min="0"
                       onchange="stokGuncelle(${u.id}, this.value)"
                       class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white w-20 text-center focus:outline-none focus:border-emerald-500">
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="urunDuzenleAc(${u.id})" title="Düzenle"
                        class="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all mr-1">
                    <i class="fas fa-edit"></i> Düzenle
                </button>
                <button onclick="urunSil(${u.id})" title="Sil"
                        class="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all">
                    <i class="fas fa-trash-alt"></i> Sil
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Ürünü kalıcı olarak siler. Silmeden önce onay ister.
 * @param {number} id - Silinecek ürünün ID'si
 */
async function urunSil(id) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(apiUrl('/products/' + id), { method: 'DELETE' });
        if (response.ok) {
            urunleriYukle(); // Listeyi ve istatistikleri yenile
        } else {
            alert('Silme işlemi başarısız!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

/**
 * Ürün tablosundaki stok alanından hızlı stok güncellemesi yapar.
 * @param {number} id - Ürünün ID'si
 * @param {string|number} yeniStok - Input kutusunun değeri
 */
async function stokGuncelle(id, yeniStok) {
    const stok = parseInt(yeniStok);
    if (isNaN(stok) || stok < 0) {
        alert('Geçerli bir stok adedi giriniz!');
        urunleriYukle(); // Hatalı değeri tabloda düzelt
        return;
    }

    try {
        const response = await fetch(apiUrl('/products/' + id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: stok })
        });

        if (response.ok) {
            urunleriYukle(); // Stok değişti → dashboard istatistikleri de değişir
        } else {
            const veri = await response.json();
            alert(veri.message || 'Stok güncellenemedi!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

// ==========================================
// YENİ ÜRÜN EKLEME
// ==========================================

/** "Yeni Ürün Ekle" formunu açar. */
function formuAc() {
    const form = document.getElementById('yeni-urun-formu');
    if (form) {
        form.classList.remove('hidden');
    }
}

/** "Yeni Ürün Ekle" formunu kapatır. */
function formuKapat() {
    const form = document.getElementById('yeni-urun-formu');
    if (form) {
        form.classList.add('hidden');
    }
}

/** Yeni ürün formundaki inputları temizler. */
function urunFormunuTemizle() {
    formAlanlariniTemizle(URUN_FORM_INPUTLARI);
}

/**
 * "Yeni Ürün Ekle" formundaki verileri backend'e gönderir.
 * Ad ve fiyat zorunludur.
 */
async function urunEkle() {
    const name = inputOku('yeni-ad');
    const category = inputOku('yeni-kategori');
    const price = parseFloat(inputOku('yeni-fiyat'));
    const stock = parseInt(inputOku('yeni-stok')) || 0;
    const calories = parseInt(inputOku('yeni-kalori')) || 0;
    const image = inputOku('yeni-resim');
    const description = inputOku('yeni-aciklama');
    const carbohydrates = inputOku('yeni-karbonhidrat');
    const fat = inputOku('yeni-yag');
    const weight = inputOku('yeni-agirlik');

    if (!name || isNaN(price)) {
        alert('Ürün adı ve fiyat zorunludur!');
        return;
    }

    try {
        const response = await fetch(apiUrl('/products'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name, category: category, price: price, stock: stock,
                calories: calories, image: image, description: description,
                carbohydrates: carbohydrates, fat: fat, weight: weight
            })
        });

        if (response.ok) {
            alert('Ürün başarıyla eklendi!');
            urunFormunuTemizle();
            formuKapat();
            urunleriYukle();
        } else {
            const veri = await response.json();
            alert(veri.message || 'Ürün eklenemedi!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

// ==========================================
// ÜRÜN DÜZENLEME
// ==========================================

/**
 * Düzenleme formunu açar ve seçili ürünün bilgileriyle doldurur.
 * @param {number} id - Düzenlenecek ürünün ID'si
 */
function urunDuzenleAc(id) {
    const urun = tumUrunler.find(u => u.id === id);
    if (!urun) {
        return; // Ürün listede yoksa (ör. başka sekmeden çağrıldı)
    }

    // Form alanlarını ürün verisiyle doldur
    const alanlar = {
        'duzenle-urun-id': urun.id,
        'duzenle-ad': urun.name,
        'duzenle-kategori': urun.category,
        'duzenle-fiyat': urun.price,
        'duzenle-stok': urun.stock,
        'duzenle-kalori': urun.calories,
        'duzenle-resim': urun.image,
        'duzenle-aciklama': urun.description,
        'duzenle-karbonhidrat': urun.carbohydrates,
        'duzenle-yag': urun.fat,
        'duzenle-agirlik': urun.weight
    };
    formAlanlariniDoldur(alanlar);

    document.getElementById('urun-duzenle-formu').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Form yukarıda olduğu için en üste çık
}

/** Ürün düzenleme formunu kapatır. */
function urunDuzenleKapat() {
    const form = document.getElementById('urun-duzenle-formu');
    if (form) {
        form.classList.add('hidden');
    }
}

/**
 * Ürün düzenleme formundaki verileri backend'e gönderir.
 * Ad ve fiyat zorunludur.
 */
async function urunGuncelle() {
    const id = parseInt(inputOku('duzenle-urun-id'));
    const name = inputOku('duzenle-ad');
    const category = inputOku('duzenle-kategori');
    const price = parseFloat(inputOku('duzenle-fiyat'));
    const stock = parseInt(inputOku('duzenle-stok')) || 0;
    const calories = parseInt(inputOku('duzenle-kalori')) || 0;
    const image = inputOku('duzenle-resim');
    const description = inputOku('duzenle-aciklama');
    const carbohydrates = inputOku('duzenle-karbonhidrat');
    const fat = inputOku('duzenle-yag');
    const weight = inputOku('duzenle-agirlik');

    if (!name || isNaN(price)) {
        alert('Ürün adı ve fiyat zorunludur!');
        return;
    }

    try {
        const response = await fetch(apiUrl('/products/' + id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name, category: category, price: price, stock: stock,
                calories: calories, image: image, description: description,
                carbohydrates: carbohydrates, fat: fat, weight: weight
            })
        });

        if (response.ok) {
            alert('Ürün güncellendi!');
            urunDuzenleKapat();
            urunleriYukle();
        } else {
            const veri = await response.json();
            alert(veri.message || 'Ürün güncellenemedi!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

// ==========================================
// AI İLE ÜRÜN BİLGİSİ OTOMATİK DOLDURMA
// ==========================================

/**
 * Ürün adını Groq AI'ye gönderip kategori, fiyat, kalori vb. bilgileri
 * otomatik olarak forma doldurur. (POST /api/products/auto-fill)
 */
async function aiIleDoldur() {
    const name = inputOku('yeni-ad');
    const durumEl = document.getElementById('ai-durum');

    if (!name) {
        alert('Önce ürün adını girin!');
        return;
    }
    if (!durumEl) {
        return;
    }

    // Durum mesajını göster
    durumEl.classList.remove('hidden');
    durumEl.className = 'text-sm text-slate-400 mt-2';
    durumEl.innerText = 'AI ürün bilgilerini getiriyor...';

    try {
        const response = await fetch(apiUrl('/products/auto-fill'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        const sonuc = await response.json();

        if (sonuc.status === 'success' && sonuc.data) {
            const veri = sonuc.data;

            // AI'ın ürettiği bilgileri forma yaz
            formAlanlariniDoldur({
                'yeni-kategori': veri.category,
                'yeni-fiyat': veri.price,
                'yeni-stok': veri.stock,
                'yeni-kalori': veri.calories,
                'yeni-aciklama': veri.description,
                'yeni-karbonhidrat': veri.carbohydrates,
                'yeni-yag': veri.fat,
                'yeni-agirlik': veri.weight
            });

            durumEl.innerText = 'Bilgiler dolduruldu! Sadece resim linkini ekleyip kaydedin.';
            durumEl.className = 'text-sm text-emerald-400 mt-2';
        } else {
            durumEl.innerText = sonuc.message || 'AI bilgisi alınamadı.';
            durumEl.className = 'text-sm text-red-400 mt-2';
        }
    } catch (hata) {
        console.error('AI doldurma hatası:', hata);
        durumEl.innerText = 'Sunucuya bağlanılamadı.';
        durumEl.className = 'text-sm text-red-400 mt-2';
    }
}