/**
 * 60-odeme.js - Ödeme Modalı ve Sipariş Gönderimi
 * -----------------------------------------------
 * Sepet panelindeki "Siparişi Tamamla" butonundan sonra çalışan bölüm:
 *   1. Ödeme modalını açar; teslimat adresini ve sepet özetini doldurur
 *   2. Modalı kapatır
 *   3. Onaylandığında siparişi POST /api/order ile backend'e gönderir
 *
 * Bağımlılık: 30-sepet.js (sepet, sepetToplamTutar), 50-adres.js (adresler)
 */

/**
 * Ödeme modalını açar.
 * İçine seçili teslimat adresini ve sepet özetini (ürünler + toplam) yazar.
 */
function odemeModalAc() {
    odemeAdresAlaniniDoldur();
    odemeSepetOzetiniDoldur();

    const modal = document.getElementById('odeme-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Ödeme modalındaki teslimat adresi kutusunu doldurur.
 * Adres kaydedilmemişse uyarı mesajı gösterir.
 */
function odemeAdresAlaniniDoldur() {
    const adresAlani = document.getElementById('odeme-adres-alani');
    if (!adresAlani) {
        return;
    }

    const adresler = adresleriGetir();

    if (adresler.length === 0) {
        adresAlani.innerHTML =
            '<p style="color:#f87171;">Henüz adres eklenmemiş! Lütfen adres ekleyin.</p>';
        return;
    }

    const adres = adresler[seciliAdresIndex] || adresler[0];
    const sehirEk = adres.sehir ? ', ' + escapeHtml(adres.sehir) : '';

    adresAlani.innerHTML = `
        <div style="font-weight:bold;margin-bottom:4px;">
            <i class="fas fa-map-marker-alt" style="color:#38bdf8;margin-right:6px;"></i>
            ${escapeHtml(adres.baslik)}
        </div>
        <div>${escapeHtml(adres.metin)}${sehirEk}</div>
    `;
}

/**
 * Ödeme modalındaki sepet özetini ve toplam tutarı doldurur.
 */
function odemeSepetOzetiniDoldur() {
    const ozetEl = document.getElementById('odeme-sepet-ozeti');
    const toplamEl = document.getElementById('odeme-toplam-tutar');
    const toplam = sepetToplamTutar();

    if (ozetEl) {
        ozetEl.innerHTML = sepet.map(urun => `
            <div class="odeme-sepet-urun">
                <span>${escapeHtml(urun.ad)} x${urun.adet}</span>
                <span>${(urun.fiyat * urun.adet).toFixed(2)} TL</span>
            </div>
        `).join('');
    }

    if (toplamEl) {
        toplamEl.innerText = toplam.toFixed(2) + ' TL';
    }
}

/**
 * Ödeme modalını kapatır.
 */
function odemeModalKapat() {
    const modal = document.getElementById('odeme-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Ödeme yöntemi radio butonlarından seçili olanı okur.
 * @returns {string} 'nakit' veya 'pos'
 */
function seciliOdemeYontemi() {
    const secili = document.querySelector('input[name="odeme-yontemi"]:checked');
    return secili ? secili.value : 'nakit';
}

/**
 * Siparişi onaylar ve backend'e gönderir.
 * Başarılıysa sepeti boşaltır ve panelleri kapatır.
 */
async function siparisiOnayla() {
    const adresler = adresleriGetir();
    if (adresler.length === 0) {
        alert('Lütfen önce bir adres ekleyin!');
        return;
    }

    const adres = adresler[seciliAdresIndex] || adresler[0];
    const odemeYontemi = seciliOdemeYontemi();
    const toplam = sepetToplamTutar();

    // Sipariş satırları: sunucuya sadece gerekli alanlar gönderilir
    const siparisKalemleri = sepet.map(urun => ({
        urun_id: urun.id,
        ad: urun.ad,
        birim_fiyat: urun.fiyat,
        adet: urun.adet
    }));

    // Ödeme yöntemini okunabilir metne çevir (onay mesajında kullanılır)
    const odemeAdi = odemeYontemi === 'nakit' ? 'Nakit (Kapıda)' : 'Kart (POS Cihazı)';

    try {
        const response = await fetch(apiUrl('/order'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: siparisKalemleri,
                address: adres.baslik + ': ' + adres.metin + (adres.sehir ? ', ' + adres.sehir : ''),
                payment: odemeYontemi,
                total: toplam // Sayısal gönderilir (metin değil)
            })
        });
        const data = await response.json();

        if (response.ok) {
            alert(
                'Siparişiniz alındı!\n' +
                'Sipariş No: ' + data.order_id + '\n' +
                'Ödeme: ' + odemeAdi + '\n' +
                'Adres: ' + adres.baslik + '\n' +
                'Toplam: ' + toplam.toFixed(2) + ' TL\n\n' +
                'Teşekkür ederiz!'
            );

            // Sipariş tamamlandı: sepeti ve panelleri temizle
            sepet = [];
            sepetiGuncelle();
            odemeModalKapat();
            sepetiKapat();
        } else {
            alert(data.message || 'Sipariş oluşturulamadı!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}