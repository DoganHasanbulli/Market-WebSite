/**
 * 30-sepet.js - Alışveriş Sepeti
 * --------------------------------
 * Sepetle ilgili tüm işlevler:
 *   1. Ürün kartından veya detay panelinden sepete ekleme
 *   2. Sepet panelini açma / kapatma
 *   3. Sepet listesini, toplam tutarı ve navbar rozetini güncelleme
 *   4. Sepetteki adedi değiştirme ve adet 0 olunca ürünü çıkarma
 *   5. "Siparişi Tamamla" butonunun ödeme modalını açması
 *
 * Bağımlılık: 10-urunler.js (urunler), 20-urun-detay.js (seciliUrunIndex)
 */

// Sepetteki ürünler. Şekil: { id, ad, fiyat, resim, adet }
// Not: Sepet şu an sadece bellekte tutulur; sayfa yenilenince sıfırlanır.
let sepet = [];

/**
 * Ürün kartındaki "Sepete Ekle" butonuna tıklanınca çalışır.
 * Ürün zaten sepetteyse adedini 1 artırır, değilse adet 1 ile ekler.
 *
 * @param {number} index - `urunler` dizisindeki ürün indexi
 */
function sepeteEkle(index) {
    const urun = urunler[index];
    if (!urun) {
        return;
    }

    if (!urun.stok) {
        alert(urun.ad + ' stokta yok.');
        return;
    }

    const sepetteki = sepet.find(item => item.id === urun.id);

    if (sepetteki) {
        // Ürün zaten sepetteyse stok limitine kadar adet artır
        if (sepetteki.adet >= urun.stokAdedi) {
            alert('Stokta en fazla ' + urun.stokAdedi + ' adet ' + urun.ad + ' bulunuyor.');
            return;
        }
        sepetteki.adet += 1;
    } else {
        // Yeni ürünü sepete ekle
        sepet.push({
            id: urun.id,
            ad: urun.ad,
            fiyat: urun.fiyat,
            resim: urun.resim,
            adet: 1
        });
    }

    sepetiGuncelle();
    sepetiAc();
}

/**
 * Ürün detay panelindeki "Sepete Ekle" butonuna basınca çalışır.
 * Panelde seçilen adedi sepete ekler ve paneli kapatır.
 */
function sepeteGonder() {
    const urun = urunler[seciliUrunIndex];
    if (!urun) {
        return; // Panel açık değil
    }

    const adet = parseInt(document.getElementById('urun-adet').innerText) || 1;
    const sepetteki = sepet.find(item => item.id === urun.id);

    if (sepetteki) {
        // Sepetteki adet + paneldeki adet toplamı stoğu aşmamalı
        const toplamAdet = sepetteki.adet + adet;
        if (urun.stokAdedi > 0 && toplamAdet > urun.stokAdedi) {
            alert('Stokta en fazla ' + urun.stokAdedi + ' adet ' + urun.ad + ' bulunuyor.');
            return;
        }
        sepetteki.adet = toplamAdet;
    } else {
        // Yeni ürünü sepete ekle
        sepet.push({
            id: urun.id,
            ad: urun.ad,
            fiyat: urun.fiyat,
            resim: urun.resim,
            adet: adet
        });
    }

    sepetiGuncelle();
    sepetiAc();
    panelKapat();
}

/**
 * Sepet panelini sağdan açar ve arka planı karartır.
 */
function sepetiAc() {
    const panel = document.getElementById('sepet-paneli');
    const overlay = document.getElementById('sepet-overlay');
    if (panel) {
        panel.classList.add('aktif');
    }
    if (overlay) {
        overlay.classList.add('aktif');
    }
}

/**
 * Sepet panelini ve arka plan karartmasını kapatır.
 */
function sepetiKapat() {
    const panel = document.getElementById('sepet-paneli');
    const overlay = document.getElementById('sepet-overlay');
    if (panel) {
        panel.classList.remove('aktif');
    }
    if (overlay) {
        overlay.classList.remove('aktif');
    }
}

/**
 * Sepet listesini, toplam tutarı ve navbar'daki ürün sayısı rozetini
 * yeniden oluşturur. Sepete ekleme/çıkarma sonrası her zaman çağrılır.
 */
function sepetiGuncelle() {
    const liste = document.getElementById('sepet-urun-listesi');
    const toplamEtiket = document.getElementById('sepet-toplam-tutar');
    if (!liste || !toplamEtiket) {
        return;
    }

    let toplam = 0;

    // Sepet boşsa bilgi mesajı göster ve toplamı sıfırla
    if (sepet.length === 0) {
        liste.innerHTML = '<p class="adres-bos">Sepetiniz boş.</p>';
        toplamEtiket.innerText = '0.00 TL';

        const bosBadge = document.getElementById('sepet-sayi-badge');
        if (bosBadge) {
            bosBadge.innerText = 0;
        }
        return;
    }

    liste.innerHTML = sepet.map((urun, index) => {
        const satirToplam = urun.fiyat * urun.adet;
        toplam += satirToplam;

        // Stok sınırına ulaşıldıysa "+" butonu pasifleştirilir
        const stokAdedi = urunler.find(u => u.id === urun.id)?.stokAdedi ?? Infinity;
        const stokDolu = urun.adet >= stokAdedi;

        return `
            <div class="sepet-item">
                <img src="${escapeHtml(urun.resim)}" width="50" alt="${escapeHtml(urun.ad)}">
                <div class="sepet-item-bilgi">
                    <h4>${escapeHtml(urun.ad)}</h4>
                    <span>${satirToplam.toFixed(2)} TL</span>
                </div>
                <div class="adet-kontrol">
                    <button class="adet-btn" onclick="sepetMiktarGuncelle(${index}, -1)">-</button>
                    <span>${urun.adet}</span>
                    <button class="adet-btn" onclick="sepetMiktarGuncelle(${index}, 1)" ${stokDolu ? 'disabled' : ''}>+</button>
                </div>
            </div>
        `;
    }).join('');

    toplamEtiket.innerText = toplam.toFixed(2) + ' TL';

    // Navbar'daki rozet: toplam adet sayısı
    const badge = document.getElementById('sepet-sayi-badge');
    if (badge) {
        badge.innerText = sepet.reduce((toplamAdet, item) => toplamAdet + item.adet, 0);
    }
}

/**
 * Sepetteki bir ürünün adedini değiştirir.
 * Adet 1'in altına düşerse (0 olursa) ürün sepetten tamamen çıkarılır.
 *
 * @param {number} index - `sepet` dizisindeki index
 * @param {number} miktar - +1 (artır) veya -1 (azalt)
 */
function sepetMiktarGuncelle(index, miktar) {
    const urun = sepet[index];
    if (!urun) {
        return;
    }

    // Stok kontrolü: artırma isteğinde üst sınırı aşma
    if (miktar > 0) {
        const stokAdedi = urunler.find(u => u.id === urun.id)?.stokAdedi ?? Infinity;
        if (urun.adet >= stokAdedi) {
            alert('Stokta en fazla ' + stokAdedi + ' adet bulunuyor.');
            return;
        }
    }

    urun.adet += miktar;

    if (urun.adet <= 0) {
        sepet.splice(index, 1); // Adet 0 veya altındaysa ürünü sepetten çıkar
    }

    sepetiGuncelle();
}

/**
 * Sepetteki toplam tutarı hesaplar (ödeme modalı da bunu kullanır).
 *
 * @returns {number} Toplam tutar (TL)
 */
function sepetToplamTutar() {
    return sepet.reduce((toplam, urun) => toplam + urun.fiyat * urun.adet, 0);
}

/**
 * Sepet panelindeki "Siparişi Tamamla" butonuna tıklanınca çalışır.
 * Sepet boşsa uyarır, doluysa ödeme modalını açar.
 */
function siparisTamamla() {
    if (sepet.length === 0) {
        alert('Sepetiniz boş! Önce ürün ekleyin.');
        return;
    }
    odemeModalAc();
}