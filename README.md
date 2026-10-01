# DH Market Web

Flask + SQLite + HTML/CSS/JS ile çalışan market web uygulaması.
Admin panelinden ürün, kampanya ve kullanıcı yönetimi yapılır. AI ile ürün bilgisi otomatik doldurma desteklenir.

## Gereksinimler

- Python 3.8+
- pip
- Node.js (yalnızca testler ve söz dizimi kontrolü için)
- Modern web tarayıcısı

## Kurulum

1. Projeyi indirip klasöre gir:
```bash
cd "MArket App Web"
```

2. Bağımlılıkları kur (eğer kurulu değilse):
```bash
pip install flask flask-cors werkzeug PyJWT
```

> Not: `main.py` çalıştırıldığında veritabanı (`dh_market.db`) otomatik oluşturulur.

## Ortam Değişkenleri

Gizli anahtarlar **kod içine yazılmaz**, ortam değişkeninden okunur.

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `GROQ_API_KEY` | Hayır | Groq AI anahtarı. Boşsa AI özelliği devre dışı kalır, uygulamanın geri kalanı çalışır. |
| `SECRET_KEY` | Hayır | Flask oturum (login) imzalama anahtarı. Üretimde mutlaka tanımlanmalı. |
| `DATABASE_FILE` | Hayır | Veritabanı dosya adı (varsayılan: `dh_market.db`) |
| `PORT` | Hayır | API portu (varsayılan: `5000`) |
| `GROQ_MODEL` | Hayır | Kullanılacak Groq modeli (varsayılan: `llama-3.1-8b-instant`) |

**Tanımlama örnekleri**

```bash
# Windows (PowerShell) — yalnızca bu terminal için
$env:GROQ_API_KEY = "gsk_..."
$env:SECRET_KEY   = "kendi-gizli-anahtarin"

# Windows (kalıcı, kullanıcı seviyesi)
setx GROQ_API_KEY "gsk_..."

# macOS / Linux
export GROQ_API_KEY="gsk_..."
```

> Daha önce kaynak koda yazılmış bir Groq anahtarı varsa, o anahtarı
> [console.groq.com/keys](https://console.groq.com/keys) sayfasından **iptal edin**.

## Sunucuları Başlat

Aynı terminalde her ikisini de çalıştırabilirsin:

**Terminal 1 – Flask API (backend)**
```bash
python main.py
```
Çalışacak adres: `http://127.0.0.1:5000`

**Terminal 2 – Frontend dosyaları (aynı klasörde yeni terminal aç)**
```bash
python -m http.server 8080 --bind 127.0.0.1
```
Çalışacak adres: `http://127.0.0.1:8080`

> Windows'ta `python3` yerine `python` yazabilirsin.

## AI ile Ürün Ekleme (Otomatik Doldurma)

Admin panelinde "Yeni Ürün Ekle" formuna ürün adı yazıp **"AI ile Otomatik Doldur"** butonuna basıldığında, Groq AI şu bilgileri otomatik üretir:
- Kategori (Meyve, İçecek, Atıştırmalık...)
- Fiyat (TL, Türkiye market fiyatlarına göre)
- Kalori
- Stok miktarı
- Açıklama
- Karbonhidrat, Yağ, Ağırlık

**Kurulum:**
1. [console.groq.com/keys](https://console.groq.com/keys) adresinden ücretsiz API key al
2. `GROQ_API_KEY` ortam değişkeni olarak tanımla (yukarıya bakın)

## Admin Paneli

Tarayıcıda `http://127.0.0.1:8080/admin.html` adresine git.

**Özellikler:**
- **Dashboard:** Toplam ürün, düşük stok uyarısı, kategori dağılımı
- **Ürünler:** Ekle, sil, düzenle, stok güncelle, AI ile otomatik doldur
- **Kampanyalar:** Slide reklamları ve kampanya kartları yönetimi (aktif/pasif toggle)
- **Kullanıcılar:** Kayıtlı kullanıcı listesi

## Frontend Yapısı

JS ve CSS dosyaları bölümlere ayrılmıştır. **Yükleme sırası önemlidir:**
her ne kadar modüller birbirinden bağımsız çalışsa da, ortak yardımcılar
(`js/ortak/`) önce, `99-baslat.js` / `90-baslat.js` ise en sonda yüklenir.
CSS tarafında numara sırası da "özgüllük (cascade)" sırasını belirler.

`index.html` ve `admin.html` içindeki `onclick="..."` çağrıları nedeniyle
JS fonksiyonları **global kapsamda** tanımlıdır; bu yüzden `type="module"`
kullanılmaz, klasik `<script src>` etiketleri kullanılır.

### JS Modülleri

| Dosya | Sorumluluk |
|-------|------------|
| `js/ortak/api.js` | `API_URL`, `apiUrl()`, `escapeHtml()`, `apiHataBildir()` |
| `js/ortak/dom.js` | `inputOku()`, `formAlanlariniDoldur()`, `formAlanlariniTemizle()` (sadece admin) |
| `js/index/10-urunler.js` | Ürün listesi, arama, kategori filtresi |
| `js/index/20-urun-detay.js` | Ürün detay paneli, adet kontrolü |
| `js/index/30-sepet.js` | Sepet ekleme/çıkarma, toplam, sipariş butonu |
| `js/index/40-auth.js` | Giriş / kayıt / şifre sıfırlama |
| `js/index/50-adres.js` | Adres listesi (localStorage) |
| `js/index/60-odeme.js` | Ödeme modalı ve sipariş gönderimi |
| `js/index/70-kampanya.js` | Kampanya kartları ve slider içeriği |
| `js/index/80-arayuz.js` | Kaydırma, slider oynatma, dış tıklama |
| `js/index/99-baslat.js` | Sayfa yüklenince uygulamayı başlatır |
| `js/admin/10-urunler.js` | Ürün CRUD, stok güncelleme, AI doldurma |
| `js/admin/20-kampanya.js` | Kampanya/reklam CRUD, aktif/pasif toggle |
| `js/admin/30-kullanicilar.js` | Kullanıcı tablosu |
| `js/admin/40-dashboard.js` | İstatistik kutuları ve grafikler |
| `js/admin/90-baslat.js` | Sekme yönetimi ve başlatma |

### CSS Modülleri

`css/index/` altındaki 12 dosya sırayla yüklenir:
`01-temel` → `02-navbar` → `03-urunler` → `04-icerik-duzeni` → `05-slider` →
`06-urun-paneli` → `07-footer` → `08-sepet` → `09-modal` → `10-kampanya` →
`11-adres` → `12-odeme`

Admin paneli tek dosyada kalır: `css/admin.css`.

## Testler ve Doğrulama

```bash
# JS söz dizimi kontrolü (her dosya için)
node --check js/index/30-sepet.js

# Davranış testleri (minimal DOM taklidiyle gerçek kodu çalıştırır)
node tests/smoke-test.js .
```

`tests/smoke-test.js` ürün render, detay paneli, sepet aritmetiği, stok
sınırları, arama/kategori filtresi, slider döngüsü, adres yönetimi, ödeme
modalı, sipariş gönderimi, kampanya CRUD ve sekme yönetimi gibi akışları
doğrular. Ayrıca tüm `getElementById` referanslarının HTML'de var olduğunu
ve inline `onclick` çağrılarının tanımlı fonksiyonlara bağlandığını kontrol eder.

## Port Sorunları

Eğer "Address already in use" hatası alırsan:
```bash
# Linux / macOS
fuser -k 5000/tcp
fuser -k 8080/tcp

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Proje Dosya Yapısı

```
MArket App Web/
├── main.py                 # Flask uygulama başlatıcı
├── database.py             # SQLite CRUD fonksiyonları
├── config.py               # Ortam değişkenlerinden okunan ayarlar
├── index.html              # Ana sayfa (müşteri arayüzü)
├── admin.html              # Admin paneli
├── README.md               # Bu dosya
├── run.md                  # Sunucu başlatma adımları
├── api/                    # Modüler API endpoint'leri
│   ├── __init__.py
│   ├── token_kontrol.py
│   ├── kullanici_api.py
│   ├── urun_api.py
│   ├── kampanya_api.py
│   ├── siparis_api.py
│   └── ai_helper.py
├── js/
│   ├── ortak/              # İki sayfada da kullanılan yardımcılar
│   │   ├── api.js
│   │   └── dom.js
│   ├── index/              # Ana sayfa modülleri (10-…-99)
│   └── admin/              # Admin paneli modülleri (10-…-90)
├── css/
│   ├── index/              # Ana sayfa stilleri (01-…-12, sırayla yüklenir)
│   └── admin.css           # Admin panel stilleri
├── tests/
│   └── smoke-test.js       # Frontend davranış testleri (node tests/smoke-test.js .)
└── dh_market.db            # SQLite veritabanı (otomatik oluşur)
```