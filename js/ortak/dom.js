/**
 * dom.js - Ortak DOM Yardımcıları
 * --------------------------------
 * Admin panelindeki form işlemlerinde tekrar eden satırları toplar.
 * index.html tarafından yüklenmez (orada gerek yoktur).
 */

/**
 * ID'si verilen input/textarea/select alanının değerini okur.
 * Değerlerdeki baştaki/sondaki boşluklar temizlenir; alan yoksa '' döner.
 *
 * @param {string} id - Elementin id'si
 * @returns {string} Kırpılmış değer
 */
function inputOku(id) {
    const el = document.getElementById(id);
    // String() ile güvence: select/input değeri her zaman metne çevrilir
    return el ? String(el.value == null ? '' : el.value).trim() : '';
}

/**
 * Birden çok form alanını verilen nesneyle doldurur.
 * Değeri null/undefined olan alanlar boşaltılır (yani temizlenir).
 *
 * Örnek:
 *   formAlanlariniDoldur({ 'yeni-ad': 'Elma', 'yeni-stok': 10 });
 *
 * @param {Object} alanlar - { elementId: değer } sözlüğü
 */
function formAlanlariniDoldur(alanlar) {
    Object.keys(alanlar).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Değer her zaman metne çevrilir: input.value = 5 → "5"
            // (number'ı doğrudan atamak, sonradan .trim() çağrılarını bozabilir)
            const deger = alanlar[id];
            el.value = (deger === null || deger === undefined) ? '' : String(deger);
        }
    });
}

/**
 * Birden çok form alanını temizler.
 * @param {string[]} idler - Temizlenecek elementlerin ID'leri
 */
function formAlanlariniTemizle(idler) {
    idler.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
        }
    });
}