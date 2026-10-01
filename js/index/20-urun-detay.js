/**
 * 20-urun-detay.js - Ürün Detay Paneli
 * -------------------------------------
 * Ürün kartına tıklandığında sağdan açılan panelin işlevleri:
 *   1. Seçilen ürünün bilgilerini panele yazar (panelAc)
 *   2. Adet artırır/azaltır ve toplam fiyatı hesaplar (adetDegistir)
 *   3. Paneli ve arka plan karartmasını kapatır (panelKapat)
 *
 * Bağımlılık: 10-urunler.js (urunler dizisi)
 */

// Detay panelinde açık olan ürünün `urunler` dizisindeki indexi.
// Sepete ekleme işlemi bu index sayesinde ürünü ID'ye değil, konuma göre bulur.
let seciliUrunIndex = -1;

/**
 * Ürün detay panelini açar ve tıklanan ürünün bilgilerini ekrana basar.
 *
 * @param {number} index - `urunler` dizisindeki ürün indexi
 */
function panelAc(index) {
    const urun = urunler[index];
    if (!urun) {
        return; // Geçersiz index (ör. filtre değişmiş olabilir)
    }

    seciliUrunIndex = index;

    // Temel bilgileri panele yaz
    document.getElementById('panel-resim').src = urun.resim;
    document.getElementById('panel-baslik').innerText = urun.ad;
    document.getElementById('panel-aciklama').innerText = urun.aciklama;
    document.getElementById('panel-fiyat').innerText = urun.fiyat.toFixed(2) + ' TL';
    document.getElementById('urun-adet').innerText = '1'; // Her açılışta adet 1'e döner

    // Besin değerlerini panele yaz
    document.getElementById('val-kalori').innerText = urun.kalori;
    document.getElementById('val-karbonhidrat').innerText = urun.karbonhidrat;
    document.getElementById('val-yag').innerText = urun.yag;
    document.getElementById('val-agirlik').innerText = urun.agirlik;

    // Paneli ve arka plan karartmasını görünür yap
    document.getElementById('urun-detay-paneli').classList.add('aktif');
    document.getElementById('overlay').classList.add('aktif');
}

/**
 * Paneldeki adedi değiştirir ve toplam fiyatı günceller.
 * Adet 1'in altına düşemez ve ürünün stok miktarını aşamaz.
 *
 * @param {number} miktar - +1 (artır) veya -1 (azalt)
 */
function adetDegistir(miktar) {
    const adetElementi = document.getElementById('urun-adet');
    const fiyatElementi = document.getElementById('panel-fiyat');
    const urun = urunler[seciliUrunIndex];
    if (!urun) {
        return;
    }

    const yeniAdet = parseInt(adetElementi.innerText) + miktar;

    // Alt sınır: en az 1 adet
    if (yeniAdet < 1) {
        return;
    }

    // Üst sınır: stokta ne kadar varsa o kadar (stok 0 ise hiç artırma)
    if (urun.stokAdedi > 0 && yeniAdet > urun.stokAdedi) {
        alert('Stokta en fazla ' + urun.stokAdedi + ' adet ' + urun.ad + ' bulunuyor.');
        return;
    }

    adetElementi.innerText = yeniAdet;
    fiyatElementi.innerText = (yeniAdet * urun.fiyat).toFixed(2) + ' TL';
}

/**
 * Ürün detay panelini ve arka plan karartmasını kapatır.
 */
function panelKapat() {
    const panel = document.getElementById('urun-detay-paneli');
    if (panel) {
        panel.classList.remove('aktif');
    }

    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.classList.remove('aktif');
    }

    seciliUrunIndex = -1; // Açık panel kalmaması için seçimi sıfırla
}