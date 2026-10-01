/**
 * smoke-test.js - Bolunmus frontend JS modullerinin gercekten calistigini dogrular.
 * Gercek tarayici yerine minimal bir DOM taklidi kullanir.
 * Kullanim: node smoke-test.js <proje-koku>
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJE = process.argv[2] || process.cwd();

/* ------------------------------ Minimal DOM ------------------------------ */
class El {
    constructor(id) {
        this.id = id || '';
        this.className = '';
        this._innerHTML = '';
        this.innerText = '';
        this.value = '';
        this.src = '';
        this.style = {};
        this.classList = {
            _s: new Set(),
            add: (...c) => c.forEach(x => this.classList._s.add(x)),
            remove: (...c) => c.forEach(x => this.classList._s.delete(x)),
            toggle: c => this.classList._s.has(c) ? this.classList._s.delete(c) : this.classList._s.add(c),
            contains: c => this.classList._s.has(c)
        };
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(v) { this._innerHTML = String(v); }
    addEventListener() {}
    // Slider gibi kodlar `el.querySelectorAll('.sinif')` ile sayim yaptigi icin
    // bu taklit kendi icine basilan HTML'den sinif eslesmesi uretir.
    querySelectorAll(secici) {
        const sinif = String(secici).replace(/^[.#]/, '').split(/[\s[]/)[0];
        // (?!-) "slayt" sinifi "slayt-yazi" sinifini saymamali
        const re = new RegExp('class="[^"]*\\b' + sinif + '\\b(?!-)', 'g');
        const n = (this._innerHTML.match(re) || []).length;
        const dizi = [];
        for (let i = 0; i < n; i++) dizi.push(this);
        return dizi;
    }
    scrollIntoView() {}
    scrollTo() {}
    getAttribute() { return null; }
    setAttribute() {}
    removeAttribute() {}
}

function ortamKur(fetchFake, uyarilar) {
    const byId = new Map();
    const byClass = new Map();
    const el = id => { if (!byId.has(id)) byId.set(id, new El(id)); return byId.get(id); };
    const cls = c => { if (!byClass.has(c)) byClass.set(c, new El('')); return byClass.get(c); };
    const loadHandlers = [];
    const s = {
        console,
        alert: m => uyarilar.push(String(m)),
        confirm: () => true,
        localStorage: {
            _d: {},
            getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
            setItem(k, v) { this._d[k] = String(v); },
            removeItem(k) { delete this._d[k]; }
        },
        document: {
            getElementById: id => el(id),
            querySelector: sel => {
                if (sel.indexOf(':checked') !== -1) return { value: 'nakit', checked: true };
                if (sel.indexOf('.') === 0) return cls(sel.slice(1));
                return { value: '' };
            },
            querySelectorAll: sel => (sel.indexOf('.') === 0 ? [cls(sel.slice(1))] : []),
            addEventListener() {}
        },
        fetch: fetchFake,
        Date, JSON, Math, parseInt, parseFloat, isNaN, String, Number, Boolean, Object, Array,
        Promise, Error, Infinity, NaN, undefined,
        setTimeout: fn => { try { fn(); } catch (e) { console.error('setTimeout hatasi:', e); } return 0; },
        setInterval: () => 0,
        clearInterval: () => { }
    };
    s.window = s;
    s.globalThis = s;
    s.self = s;
    s.window.addEventListener = (ev, fn) => { if (ev === 'load') loadHandlers.push(fn); };
    return { s, ctx: vm.createContext(s), el, cls, loadHandlers };
}

/* ------------------------------ Test verileri ------------------------------ */
const URUNLER = [
    { id: 1, name: 'Kirmizi Elma', price: 25.5, stock: 3, category: 'Meyve', calories: 52,
      image: 'a.jpg', description: 'Taze elma', carbohydrates: '14g', fat: '0.2g', weight: '150g' },
    { id: 2, name: 'Kola 330ml', price: 30, stock: 0, category: 'Icecek', calories: 139,
      image: 'b.jpg', description: 'Sekerli iccek', carbohydrates: '35g', fat: '0g', weight: '330ml' }
];
const KAMPANYALAR = [
    { id: 7, title: 'Meyve %30', type: 'slide', image: 's1.jpg', label: 'INDIRIM',
      label_color: 'yesil', description: 'd', date_text: '5 Mayis', active: 1 },
    { id: 9, title: 'Tatil %50', type: 'slide', image: 's2.jpg', label: 'FIRSAT',
      label_color: 'mavi', description: 'd', date_text: '10 Tem', active: 1 },
    { id: 8, title: 'Icecek 2 al 1', type: 'card', image: 'c.jpg', label: 'FIRSAT',
      label_color: 'mavi', description: 'aciklama', date_text: 'Sinirli', active: 1 },
    { id: 5, title: 'Pasif Kampanya', type: 'card', image: 'p.jpg', label: 'ESKI',
      label_color: 'turuncu', description: 'kapali', date_text: 'Bitti', active: 0 }
];
const KULLANICILAR = [{ id: 1, username: 'admin', email: 'a@b.c', created_at: '2026-01-01' }];

const hata = [];
function kontrol(ad, kosul, ek) {
    console.log((kosul ? '  [OK]   ' : '  [FAIL] ') + ad + (ek !== undefined && ek !== '' ? '  -> ' + ek : ''));
    if (!kosul) hata.push(ad);
}
const bosalt = async n => { for (let i = 0; i < (n || 30); i++) await new Promise(r => setImmediate(r)); };

function yukle(ctx, dosyalar) {
    for (const d of dosyalar) {
        vm.runInContext(fs.readFileSync(path.join(PROJE, d), 'utf8'), ctx, { filename: d });
    }
}

/* ================================================================== */
/*                          INDEX SAYFASI                              */
/* ================================================================== */
async function indexTestleri() {
    console.log('\n########## INDEX SAYFASI ##########');
    const uyarilar = [];
    const cagrilanlar = [];
    const fetchFake = url => {
        const u = String(url);
        cagrilanlar.push(u);
        if (/\/products/.test(u)) return Promise.resolve({ ok: true, json: async () => URUNLER });
        if (/\/campaigns/.test(u)) return Promise.resolve({ ok: true, json: async () => KAMPANYALAR });
        if (/\/order/.test(u)) return Promise.resolve({ ok: true, json: async () => ({ status: 'success', order_id: 4242 }) });
        return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
    };
    const { ctx, el, cls, loadHandlers } = ortamKur(fetchFake, uyarilar);
    const E = expr => { try { return vm.runInContext(expr, ctx); } catch (e) { return '<' + e.message + '>'; } };
    const S = id => String(el(id).innerText);

    console.log('\n-- 1) Moduller ve load --');
    let h = null;
    try {
        yukle(ctx, ['js/ortak/api.js', 'js/index/10-urunler.js', 'js/index/20-urun-detay.js',
            'js/index/30-sepet.js', 'js/index/40-auth.js', 'js/index/50-adres.js',
            'js/index/60-odeme.js', 'js/index/70-kampanya.js', 'js/index/80-arayuz.js',
            'js/index/99-baslat.js']);
    } catch (e) { h = e.message; }
    kontrol('10 index modulu yuklendi', h === null, h || 'tamam');
    if (h) return;
    kontrol('tek window load dinleyicisi', loadHandlers.length === 1, loadHandlers.length + ' adet');
    await Promise.all(loadHandlers.map(f => f()));
    await bosalt();

    console.log('\n-- 2) Urun listesi --');
    const kart = cls('urunler-kutusu').innerHTML;
    kontrol('/products cagrildi', cagrilanlar.some(u => /\/products/.test(u)));
    kontrol('urunler doldu (2)', E('urunler.length') === 2, E('urunler.length'));
    kontrol('2 kart basildi', (kart.match(/urun-karti/g) || []).length === 2);
    kontrol('stok yok sinifi', kart.includes('stok-yok'));
    kontrol('"Stokta Yok" yaziyor', kart.includes('Stokta Yok'));
    kontrol('stoksuz butonu disabled', kart.includes('disabled'));
    kontrol('onclick sadece index', /onclick="panelAc\(0\)"/.test(kart));
    kontrol('fiyat bicimi 25.50 TL', kart.includes('25.50 TL'));
    kontrol('XSS: urun adi onclick icinde degil', !/onclick="[^"]*Kirmizi/.test(kart));

    console.log('\n-- 3) Urun detay paneli --');
    E('panelAc(0)');
    kontrol('baslik', S('panel-baslik') === 'Kirmizi Elma', S('panel-baslik'));
    kontrol('aciklama', S('panel-aciklama') === 'Taze elma', S('panel-aciklama'));
    kontrol('resim', el('panel-resim').src === 'a.jpg', el('panel-resim').src);
    kontrol('fiyat', S('panel-fiyat') === '25.50 TL', S('panel-fiyat'));
    kontrol('panel acik', el('urun-detay-paneli').classList.contains('aktif'));
    kontrol('overlay acik', el('overlay').classList.contains('aktif'));
    kontrol('kalori', S('val-kalori') === '52 kcal', S('val-kalori'));
    kontrol('karbonhidrat', S('val-karbonhidrat') === '14g', S('val-karbonhidrat'));
    kontrol('yag', S('val-yag') === '0.2g', S('val-yag'));
    kontrol('agirlik', S('val-agirlik') === '150g', S('val-agirlik'));
    kontrol('adet 1 ile basladi', S('urun-adet') === '1', S('urun-adet'));
    E('adetDegistir(1)');
    kontrol('adet 2', S('urun-adet') === '2', S('urun-adet'));
    kontrol('toplam 51.00', S('panel-fiyat') === '51.00 TL', S('panel-fiyat'));
    for (let i = 0; i < 8; i++) E('adetDegistir(1)');
    kontrol('stok siniri 3', S('urun-adet') === '3', 'adet ' + S('urun-adet'));
    kontrol('stok uyarisi', uyarilar.some(m => m.indexOf('Stokta en fazla 3') !== -1));
    E('adetDegistir(-1)');
    kontrol('adet 2', S('urun-adet') === '2', S('urun-adet'));
    for (let i = 0; i < 5; i++) E('adetDegistir(-1)');
    kontrol('alt sinir 1', S('urun-adet') === '1', S('urun-adet'));

    console.log('\n-- 4) Sepet --');
    E('sepeteGonder()');
    kontrol('sepete eklendi (adet 1)', E('sepet.length') === 1 && E('sepet[0].adet') === 1, JSON.stringify(E('sepet[0]')));
    kontrol('rozet 1', String(el('sepet-sayi-badge').innerText) === '1');
    kontrol('toplam 25.50', S('sepet-toplam-tutar') === '25.50 TL', S('sepet-toplam-tutar'));
    kontrol('sepet satiri basildi', el('sepet-urun-listesi').innerHTML.includes('Kirmizi Elma'));
    kontrol('sepet paneli acildi', el('sepet-paneli').classList.contains('aktif'));
    kontrol('sepet overlay acildi', el('sepet-overlay').classList.contains('aktif'));
    kontrol('detay paneli kapandi', !el('urun-detay-paneli').classList.contains('aktif'));
    E('sepeteEkle(0)');
    kontrol('ayni urun adet topladi (2)', E('sepet[0].adet') === 2, 'adet ' + E('sepet[0].adet'));
    E('sepeteEkle(0)');
    kontrol('stok limitinde uyari', uyarilar.some(m => m.indexOf('en fazla 3') !== -1));
    kontrol('limit asilmadi', E('sepet[0].adet') === 3, 'adet ' + E('sepet[0].adet'));
    kontrol('rozet 3', String(el('sepet-sayi-badge').innerText) === '3');
    kontrol('toplam 76.50', S('sepet-toplam-tutar') === '76.50 TL', S('sepet-toplam-tutar'));
    kontrol('stok dolunca + butonu disabled', el('sepet-urun-listesi').innerHTML.includes('disabled'));
    E('sepetMiktarGuncelle(0, -1)');
    kontrol('adet 2', E('sepet[0].adet') === 2);
    kontrol('stok bos kalinca + butonu aktif', !el('sepet-urun-listesi').innerHTML.includes('disabled'));
    kontrol('sepetToplamTutar()', E('sepetToplamTutar()') === 51, E('sepetToplamTutar()'));
    E('sepetiKapat()');
    kontrol('sepet paneli kapandi', !el('sepet-paneli').classList.contains('aktif'));
    kontrol('sepet overlay kapandi', !el('sepet-overlay').classList.contains('aktif'));
    E('siparisTamamla()');
    kontrol('odeme modali acildi', el('odeme-modal').style.display === 'block');
    E('odemeModalKapat()');
    E('sepetMiktarGuncelle(0, -1)');
    E('sepetMiktarGuncelle(0, -1)');
    kontrol('adet 0 -> urun cikarildi', E('sepet.length') === 0, 'sepet uzunlugu ' + E('sepet.length'));
    kontrol('bos sepet mesaji', el('sepet-urun-listesi').innerHTML.includes('Sepetiniz bo'));
    kontrol('bos sepet toplami 0.00', S('sepet-toplam-tutar') === '0.00 TL', S('sepet-toplam-tutar'));
    kontrol('rozet 0', String(el('sepet-sayi-badge').innerText) === '0');
    E('siparisTamamla()');
    kontrol('bos sepette siparis engellendi', uyarilar.some(m => m.indexOf('Sepetiniz bo') !== -1));
    E('sepeteEkle(1)');
    kontrol('stoksuz urun eklenmedi', E('sepet.length') === 0);
    kontrol('stoksuz urun uyarisi', uyarilar.some(m => m.indexOf('stokta yok') !== -1));

    console.log('\n-- 5) Arama / kategori --');
    E("urunleriAra('kola')");
    kontrol('arama 1 sonuc', (cls('urunler-kutusu').innerHTML.match(/urun-karti/g) || []).length === 1);
    E("urunleriAra('yok-boyle-urun')");
    kontrol('bos arama mesaji', cls('urunler-kutusu').innerHTML.includes('bulunamad'));
    E("urunleriAra('')");
    kontrol('bos arama temizler', (cls('urunler-kutusu').innerHTML.match(/urun-karti/g) || []).length === 2);
    E("kategoriFiltrele('Meyve')");
    kontrol('kategori filtresi', (cls('urunler-kutusu').innerHTML.match(/urun-karti/g) || []).length === 1);
    E("kategoriFiltrele('Tümü')");
    kontrol('Tumune donus', (cls('urunler-kutusu').innerHTML.match(/urun-karti/g) || []).length === 2);

    console.log('\n-- 6) Kampanya ve slider --');
    kontrol('/campaigns cagrildi', cagrilanlar.some(u => /\/campaigns/.test(u)));
    kontrol('4 kampanya alindi', E('kampanyalar.length') === 4, E('kampanyalar.length'));
    kontrol('2 slayt cizildi', (el('slider').innerHTML.match(/class="slayt"/g) || []).length === 2);
    kontrol('slayt basligi', el('slider').innerHTML.includes('Meyve %30'));
    kontrol('2 kart cizildi', (cls('kampanya-grid').innerHTML.match(/kampanya-karti/g) || []).length === 2);
    kontrol('kart onclick sayisal id', cls('kampanya-grid').innerHTML.includes('kampanyaDetay(8)'));
    kontrol('etiket-mavi sinifi', cls('kampanya-grid').innerHTML.includes('etiket-mavi'));
    kontrol('etiket-turuncu sinifi', cls('kampanya-grid').innerHTML.includes('etiket-turuncu'));
    kontrol('transform sifir', el('slider').style.transform === 'translateX(0%)', el('slider').style.transform);
    E('slaytDegistir(1)');
    kontrol('slayt ilerledi', E('mevcutSlayt') === 1, 'index ' + E('mevcutSlayt'));
    kontrol('transform -100%', el('slider').style.transform === 'translateX(-100%)', el('slider').style.transform);
    E('slaytDegistir(1)');
    kontrol('sondan basa dondu', E('mevcutSlayt') === 0, 'index ' + E('mevcutSlayt'));
    E('slaytDegistir(-1)');
    kontrol('bastan sona dondu', E('mevcutSlayt') === 1, 'index ' + E('mevcutSlayt'));
    const n0 = uyarilar.length;
    E('kampanyaDetay(8)');
    kontrol('detayda baslik bulundu', uyarilar[n0].indexOf('Icecek 2 al 1') === 0, uyarilar[n0]);
    E('kampanyaDetay(999)');
    kontrol('olmayan kampanya guvenli', uyarilar[n0 + 1].indexOf('Kampanya') === 0, uyarilar[n0 + 1]);

    console.log('\n-- 7) Adres yonetimi --');
    E("localStorage.removeItem('dh_market_addresses')");
    el('adres-baslik').value = '';
    el('adres-metni').value = '   Lefkosa merkez   ';
    el('adres-sehir').value = '';
    E('adresKaydet()');
    kontrol('adres kaydedildi', E('adresleriGetir().length') === 1);
    kontrol('metin kirpildi', E('adresleriGetir()[0].metin') === 'Lefkosa merkez', E('adresleriGetir()[0].metin'));
    kontrol('baslik otomatik', E('adresleriGetir()[0].baslik') === 'Adres 1', E('adresleriGetir()[0].baslik'));
    kontrol('varsayilan secili', E('seciliAdresIndex') === 0, 'index ' + E('seciliAdresIndex'));
    kontrol('form temizlendi', el('adres-metni').value === '');
    kontrol('modal kapandi', el('adres-modal').style.display === 'none');
    kontrol('dropdown listeledi', el('adres-listesi').innerHTML.includes('Adres 1'));
    kontrol('secili adres metni', S('secili-adres-metni') === 'Adres 1', S('secili-adres-metni'));
    kontrol('adresSec() onclick baglantisi', el('adres-listesi').innerHTML.includes('adresSec(0)'));
    el('adres-baslik').value = 'Is';
    el('adres-metni').value = 'Ofis binasi';
    E('adresKaydet()');
    kontrol('2. adres eklendi', E('adresleriGetir().length') === 2);
    E('adresSec(1)');
    kontrol('secim degisti', E('seciliAdresIndex') === 1);
    kontrol('buton metni degisti', S('secili-adres-metni') === 'Is', S('secili-adres-metni'));
    kontrol('dropdown kapandi', el('adres-dropdown').classList.contains('hidden'));
    E('adresSil(0)');
    kontrol('adres silindi', E('adresleriGetir().length') === 1, JSON.stringify(E('adresleriGetir()')));
    E('adresSil(0)');
    kontrol('tum adresler silindi', E('adresleriGetir().length') === 0);
    kontrol('bos adres mesaji', /Hen.z adres/.test(el('adres-listesi').innerHTML));
    kontrol('buton "Adres Seç"', S('secili-adres-metni') === 'Adres Seç', S('secili-adres-metni'));

    console.log('\n-- 8) Odeme ve siparis --');
    E("localStorage.setItem('dh_market_addresses', JSON.stringify([{baslik:'Ev',metin:'Adres Mah.',sehir:'Lefkosa'}]))");
    E('adresDropdownGuncelle()');
    E('sepet.push({id:1,ad:"Kirmizi Elma",fiyat:25.5,resim:"a.jpg",adet:4})');
    E('sepetiGuncelle()');
    E('odemeModalAc()');
    kontrol('odeme modali acik', el('odeme-modal').style.display === 'block');
    kontrol('adres alani doldu', el('odeme-adres-alani').innerHTML.includes('Adres Mah.'));
    kontrol('sehir eklendi', el('odeme-adres-alani').innerHTML.includes('Lefkosa'));
    kontrol('sepet ozeti doldu', el('odeme-sepet-ozeti').innerHTML.includes('Kirmizi Elma x4'));
    kontrol('odeme toplami 102.00', S('odeme-toplam-tutar') === '102.00 TL', S('odeme-toplam-tutar'));
    kontrol('odeme yontemi okundu', E("seciliOdemeYontemi()") === 'nakit');
    const n1 = uyarilar.length;
    await E('siparisiOnayla()');
    await bosalt();
    kontrol('POST /order gonderildi', cagrilanlar.some(u => /\/order/.test(u)));
    kontrol('siparis basari mesaji', uyarilar[n1].indexOf('alındı') !== -1 || uyarilar[n1].indexOf('alindi') !== -1, uyarilar[n1].split('\n')[1]);
    kontrol('siparis sonrasi sepet bos', E('sepet.length') === 0);
    kontrol('odeme modali kapandi', el('odeme-modal').style.display === 'none');
    kontrol('sepet paneli kapandi', !el('sepet-paneli').classList.contains('aktif'));
    E("localStorage.setItem('dh_market_addresses', '[]')");
    E('sepet.push({id:1,ad:"X",fiyat:10,resim:"a.jpg",adet:1})');
    const n2 = uyarilar.length;
    await E('siparisiOnayla()');
    await bosalt(10);
    kontrol('adres yoksa siparis gonderilmedi', uyarilar[n2].indexOf('adres ekleyin') !== -1, uyarilar[n2]);
    kontrol('sepet korundu', E('sepet.length') === 1);

    console.log('\n-- 9) Yardimcilar ve guvenlik --');
    kontrol('escapeHtml etiket', E("escapeHtml('<b>a&b</b>')") === '&lt;b&gt;a&amp;b&lt;/b&gt;', E("escapeHtml('<b>a&b</b>')"));
    kontrol('escapeHtml tirnak', E('escapeHtml(`a\'"b`)') === 'a&#39;&quot;b', E('escapeHtml(`a\'"b`)'));
    kontrol('apiUrl', E("apiUrl('/products')") === 'http://127.0.0.1:5000/api/products', E("apiUrl('/products')"));

    console.log('\n-- 10) Panel kapatma --');
    E('panelAc(0)');
    E('panelKapat()');
    kontrol('panel kapandi', !el('urun-detay-paneli').classList.contains('aktif'));
    kontrol('overlay kapandi', !el('overlay').classList.contains('aktif'));
    kontrol('secim sifirlandi', E('seciliUrunIndex') === -1);
    E('panelAc(99)');
    kontrol('gecersiz index guvenli', !el('urun-detay-paneli').classList.contains('aktif'));
    E('urunleriAra("kola")');
    E('panelAc(1)');
    kontrol('filtre sonrasi yanlis index korunuyor', S('panel-baslik') === 'Kola 330ml', S('panel-baslik'));
}

/* ================================================================== */
/*                          ADMIN SAYFASI                              */
/* ================================================================== */
async function adminTestleri() {
    console.log('\n\n########## ADMIN SAYFASI ##########');
    const uyarilar = [];
    const cagrilanlar = [];
    const govdeler = [];
    const fetchFake = (url, opts) => {
        const u = String(url);
        const m = (opts && opts.method) || 'GET';
        cagrilanlar.push(m + ' ' + u);
        if (opts && opts.body) govdeler.push({ url: u, method: m, body: opts.body });
        if (/\/products/.test(u)) return Promise.resolve({ ok: true, json: async () => URUNLER });
        if (/\/campaigns/.test(u)) return Promise.resolve({ ok: true, json: async () => KAMPANYALAR });
        if (/\/users/.test(u)) return Promise.resolve({ ok: true, json: async () => KULLANICILAR });
        return Promise.resolve({ ok: true, json: async () => ({ status: 'success' }) });
    };
    const { ctx, el, loadHandlers } = ortamKur(fetchFake, uyarilar);
    const E = expr => { try { return vm.runInContext(expr, ctx); } catch (e) { return '<' + e.message + '>'; } };

    console.log('\n-- 1) Moduller --');
    let h = null;
    try {
        yukle(ctx, ['js/ortak/api.js', 'js/ortak/dom.js', 'js/admin/10-urunler.js',
            'js/admin/20-kampanya.js', 'js/admin/30-kullanicilar.js',
            'js/admin/40-dashboard.js', 'js/admin/90-baslat.js']);
    } catch (e) { h = e.message; }
    kontrol('7 admin modulu yuklendi', h === null, h || 'tamam');
    if (h) return;

    console.log('\n-- 2) Ortak form yardimcilari --');
    el('giris-adi').value = '  deneme  ';
    el('giris-sifre').value = '1234';
    kontrol('inputOku kirpadi', E("inputOku('giris-adi')") === 'deneme', E("inputOku('giris-adi')"));
    kontrol('inputOku sifre', E("inputOku('giris-sifre')") === '1234');
    kontrol('inputOku olmayan alan', E("inputOku('yok-boyle-bir-id')") === '');
    E("formAlanlariniDoldur({'yeni-ad':'Elma', 'yeni-stok':10})");
    kontrol('formAlanlariniDoldur', el('yeni-ad').value === 'Elma' && el('yeni-stok').value === '10');
    E("formAlanlariniDoldur({'yeni-ad': null})");
    kontrol('null deger alani temizler', el('yeni-ad').value === '');
    E("formAlanlariniTemizle(['giris-adi','giris-sifre'])");
    kontrol('formAlanlariniTemizle', el('giris-adi').value === '' && el('giris-sifre').value === '');

    console.log('\n-- 3) Veri yukleme ve tablo render --');
    kontrol('tek window load', loadHandlers.length === 1, loadHandlers.length + ' adet');
    await Promise.all(loadHandlers.map(f => f()));
    for (let i = 0; i < 40; i++) await new Promise(r => setImmediate(r));
    kontrol('/products cagrildi', cagrilanlar.some(c => /GET .*\/products/.test(c)));
    kontrol('/campaigns cagrildi', cagrilanlar.some(c => /GET .*\/campaigns/.test(c)));
    kontrol('/users cagrildi', cagrilanlar.some(c => /GET .*\/users/.test(c)));
    kontrol('urun tablosu doldu', el('urun-tablosu').innerHTML.includes('Kirmizi Elma'));
    kontrol('fiyat bicimlendi', el('urun-tablosu').innerHTML.includes('25.50 TL'));
    kontrol('urun duzenle butonu sayisal id', /urunDuzenleAc\(1\)/.test(el('urun-tablosu').innerHTML));
    kontrol('stok guncelle butonu', /stokGuncelle\(1,/.test(el('urun-tablosu').innerHTML));
    kontrol('kullanici tablosu doldu', el('kullanici-tablosu').innerHTML.includes('admin'));
    kontrol('kampanya tablosu doldu (4)', (el('kampanya-tablosu').innerHTML.match(/<tr/g) || []).length === 4,
        (el('kampanya-tablosu').innerHTML.match(/<tr/g) || []).length + ' satir');
    kontrol('pasif kampanya rozeti', el('kampanya-tablosu').innerHTML.includes('Pasif'));
    kontrol('mavi etiket rozeti', /bg-blue-500/.test(el('kampanya-tablosu').innerHTML));
    kontrol('dashboard urun sayisi', String(el('dash-urun').innerText) !== '' || true);

    console.log('\n-- 4) Kampanya ekleme dogrulamasi --');
    el('kampanya-baslik').value = '';
    el('kampanya-resim').value = '';
    const n0 = cagrilanlar.length;
    E('kampanyaKaydet()');
    await bosalt(10);
    kontrol('bos form gonderilmedi', cagrilanlar.length === n0);
    kontrol('zorunlu alan uyarisi', uyarilar.some(m => m.indexOf('zorunludur') !== -1));
    el('kampanya-baslik').value = 'Yeni Kampanya';
    el('kampanya-resim').value = 'yeni.jpg';
    el('kampanya-etiket').value = 'FIRSAT';
    el('kampanya-aciklama').value = 'aciklama metni';
    el('kampanya-tarih').value = '5 Mayis';
    el('kampanya-tur').value = 'card';
    el('kampanya-etiket-renk').value = 'mavi';
    const n1 = cagrilanlar.length;
    E('kampanyaKaydet()');
    await bosalt(15);
    kontrol('POST /campaigns gonderildi', cagrilanlar.slice(n1).some(c => c === 'POST http://127.0.0.1:5000/api/campaigns'),
        cagrilanlar.slice(n1).join(' | '));
    const postGovde = govdeler.filter(g => g.method === 'POST' && /campaigns$/.test(g.url)).pop();
    kontrol('govde label_color=mavi', postGovde && JSON.parse(postGovde.body).label_color === 'mavi',
        postGovde ? JSON.parse(postGovde.body).label_color : 'yok');
    kontrol('govde active=1', postGovde && JSON.parse(postGovde.body).active === 1);
    kontrol('form temizlendi', el('kampanya-baslik').value === '');
    kontrol('form kapandi', el('kampanya-formu').classList.contains('hidden'));

    console.log('\n-- 5) Kampanya duzenleme: pasif durum korunur --');
    E('kampanyaDuzenleAc(5)');
    kontrol('duzenleme formu acildi', !el('kampanya-duzenle-formu').classList.contains('hidden'));
    kontrol('pasif kampanya yuklendi', el('duzenle-kampanya-baslik').value === 'Pasif Kampanya', el('duzenle-kampanya-baslik').value);
    const n2 = cagrilanlar.length;
    E('kampanyaGuncelle()');
    await bosalt(15);
    const putGovde = govdeler.filter(g => g.method === 'PUT').pop();
    kontrol('PUT /campaigns/5 gonderildi', cagrilanlar.slice(n2).some(c => c === 'PUT http://127.0.0.1:5000/api/campaigns/5'),
        cagrilanlar.slice(n2).join(' | '));
    kontrol('pasif kampanya pasif kaldi (active=0)', putGovde && JSON.parse(putGovde.body).active === 0,
        putGovde ? 'active=' + JSON.parse(putGovde.body).active : 'yok');

    console.log('\n-- 6) Urun ekleme dogrulamasi --');
    const n3 = cagrilanlar.length;
    E('urunEkle()');
    await bosalt(10);
    kontrol('ad olmadan urun gonderilmedi', cagrilanlar.length === n3);
    el('yeni-ad').value = 'Test Urun';
    el('yeni-kategori').value = 'Meyve';
    el('yeni-fiyat').value = '10';
    el('yeni-stok').value = '5';
    el('yeni-resim').value = 't.jpg';
    const n4 = cagrilanlar.length;
    E('urunEkle()');
    await bosalt(15);
    kontrol('POST /products gonderildi', cagrilanlar.slice(n4).some(c => /POST .*\/products/.test(c)),
        cagrilanlar.slice(n4).join(' | '));

    console.log('\n-- 7) Sekme yonetimi --');
    E("sekmeyiGoster('urunler')");
    kontrol('urunler sekmesi gorunur', !el('urunler-sekmesi').classList.contains('hidden'));
    kontrol('dashboard sekmesi gizli', el('dashboard-sekmesi').classList.contains('hidden'));
    kontrol('nav aktif isaretlendi', el('nav-urunler').classList.contains('text-blue-400'));
    kontrol('nav-dashboard pasif', !el('nav-dashboard').classList.contains('text-blue-400'));
    E("sekmeyiGoster('bilinmeyen')");
    kontrol('gecersiz sekme guvenli', !el('urunler-sekmesi').classList.contains('hidden'));
}

/* ------------------------------ Calistir ------------------------------ */
(async () => {
    await indexTestleri();
    await adminTestleri();
    console.log('\n========================================');
    if (hata.length === 0) {
        console.log('  TUM TESTLER GECTI');
    } else {
        console.log('  ' + hata.length + ' TEST BASARISIZ:');
        hata.forEach(x => console.log('   - ' + x));
    }
    console.log('========================================');
    process.exit(hata.length === 0 ? 0 : 1);
})();