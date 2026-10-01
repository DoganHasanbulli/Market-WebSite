/**
 * 10-urunler.js - Ürün Listesi, Arama ve Kategori Filtresi
 * ---------------------------------------------------------
 * Bu dosya, ana sayfadaki ürün ızgarasını yönetir:
 *   1. API'den ürünleri çeker ve ekrana basar (ürünleriYukle)
 *   2. Ürün kartlarını HTML'e çevirip listeler (urunleriGetir)
 *   3. Arama çubuğu ile ürün adı/açıklamada filtreler (urunleriAra)
 *   4. Sol menüdeki kategori butonlarına göre filtreler (kategoriFiltrele)
 *
 * Bağımlılık: js/ortak/api.js (apiUrl, escapeHtml)
 */

// API'den çekilen ham verinin arayüzün kullandığı biçime çevrildiği dizi.
// Tüm modüller (detay paneli, sepet, kampanya) bu diziyi ortak kaynak olarak kullanır.
let urunler = [];

/**
 * Ürün listesini API'den çeker ve ekrana basar.
 * Hata olursa kullanıcıya "sunucu çalışmıyor" uyarısı gösterir.
 */
async function urunleriYukle() {
    const anaKutu = document.querySelector('.urunler-kutusu');

    try {
        // cache:'no-store' → tarayıcı önbelleğini atlayıp her seferinde güncel veri alır
        const response = await fetch(apiUrl('/products'), { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Sunucu ' + response.status + ' döndü');
        }

        const data = await response.json();

        // API alan adlarını (name, price, image...) arayüz alan adlarına (ad, fiyat, resim) çevirir
        urunler = data.map(urun => ({
            id: urun.id,
            ad: urun.name,
            fiyat: Number(urun.price) || 0, // Sayıya çevirilir (hesaplama ve biçimlendirme için)
            resim: urun.image,
            kalori: (urun.calories || 0) + ' kcal',
            karbonhidrat: urun.carbohydrates || '0g',
            yag: urun.fat || '0g',
            agirlik: urun.weight || '100g',
            aciklama: urun.description || '',
            kategori: urun.category || 'Diğer',
            stokAdedi: urun.stock || 0,
            stok: (urun.stock || 0) > 0  // Sepete eklenebilirlik için mantıksal değer
        }));

        urunleriGetir(urunler); // Çekilen veriyi ekrana bas
    } catch (hata) {
        console.error('Ürün yükleme hatası:', hata);
        if (anaKutu) {
            anaKutu.innerHTML =
                '<p class="arama-yok">Ürünler yüklenirken hata oluştu. ' +
                'Lütfen Flask sunucusunun (main.py) çalıştığından emin olun.</p>';
        }
    }
}

/**
 * Verilen ürün listesini ekranda ürün kartı olarak gösterir.
 *
 * ÖNEMLİ: onclick içine ürün adı/fiyatı gömülmez; sadece sayısal index
 * verilir. Böylece ürün adında tırnak gibi karakterler olsa bile
 * HTML/JS enjeksiyonu (XSS) mümkün olmaz. Fonksiyonlar veriyi
 * `urunler[index]` üzerinden kendileri okur.
 *
 * @param {Array} filtrelenmisListe - Gösterilecek ürünler (verilmezse tümü)
 */
function urunleriGetir(filtrelenmisListe = urunler) {
    const anaKutu = document.querySelector('.urunler-kutusu');
    if (!anaKutu) {
        return; // Ürün kutusu yoksa (ör. admin sayfası) çık
    }

    // Arama sonucu boşsa bilgi mesajı göster
    if (filtrelenmisListe.length === 0) {
        anaKutu.innerHTML = '<p class="arama-yok">Aradığınız ürün bulunamadı.</p>';
        return;
    }

    anaKutu.innerHTML = filtrelenmisListe.map(urun => {
        // Arama/kategori filtresi sonrası gerçek (orijinal) indexi bul
        const gercekIndex = urunler.indexOf(urun);

        return `
            <div class="urun-karti" onclick="panelAc(${gercekIndex})">
                <img src="${escapeHtml(urun.resim)}" alt="${escapeHtml(urun.ad)}">
                <h2>${escapeHtml(urun.ad)}</h2>
                <p class="stok-durum ${urun.stok ? '' : 'stok-yok'}">
                    ${urun.stok ? 'Stokta Var' : 'Stokta Yok'}
                </p>
                <p class="fiyat">${urun.fiyat.toFixed(2)} TL</p>
                <button class="sepete-ekle"
                    onclick="event.stopPropagation(); sepeteEkle(${gercekIndex})"
                    ${urun.stok ? '' : 'disabled'}>
                    ${urun.stok ? 'Sepete Ekle' : 'Tükendi'}
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Arama çubuğuna yazılan metne göre ürünleri filtreler.
 * Ürün adı VEYA açıklamasında geçen kelimeleri büyük/küçük harf duyarsız arar.
 *
 * @param {string} anahtarKelime - Arama kutusundaki metin
 */
function urunleriAra(anahtarKelime) {
    const kelime = anahtarKelime.toLowerCase().trim();

    // Arama kutusu boşsa filtreyi temizle
    if (kelime === '') {
        urunleriGetir(urunler);
        return;
    }

    const sonuclar = urunler.filter(urun =>
        urun.ad.toLowerCase().includes(kelime) ||
        urun.aciklama.toLowerCase().includes(kelime)
    );

    urunleriGetir(sonuclar);
}

/**
 * Sol menüdeki kategori butonuna tıklanınca çalışır.
 * Tıklanan butonu "aktif" görünüme alır ve listeyi filtreler.
 *
 * @param {string} kategori - 'Tümü', 'Meyve', 'İçecek', 'Atıştırmalık'
 * @param {HTMLElement} [btn] - Tıklanan buton (this ile gelir)
 */
function kategoriFiltrele(kategori, btn) {
    // Önce önceki aktif butondan "aktif" sınıfını kaldır
    document.querySelectorAll('.kat-btn').forEach(b => b.classList.remove('aktif'));
    if (btn) {
        btn.classList.add('aktif');
    }

    if (kategori === 'Tümü') {
        urunleriGetir(urunler);
        return;
    }

    urunleriGetir(urunler.filter(urun => urun.kategori === kategori));
}

/**
 * Arama çubuğuna her tuş basıldığında tetiklenir.
 * Element, script'ler sayfa sonunda yüklendiği için burada güvenle bulunur.
 */
function aramaKutusunuBagla() {
    const aramaCubugu = document.getElementById('arama-cubugu');
    if (aramaCubugu) {
        aramaCubugu.addEventListener('input', function (olay) {
            urunleriAra(olay.target.value);
        });
    }
}