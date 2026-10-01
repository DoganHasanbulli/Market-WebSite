---
description: DH Market Sunucularını Başlat
---

DH Market Flask backend ve frontend sunucularını başlatma adımları.

## Ön Hazırlık (İlk Kurulum)

1. Bağımlılıkları kur (eğer kurulu değilse)
   ```bash
   pip install flask flask-cors werkzeug PyJWT
   ```

2. (Opsiyonel) AI ile ürün otomatik doldurma için `GROQ_API_KEY` ortam değişkenini tanımla.
   - Anahtar almak için: https://console.groq.com/keys
   - Windows (PowerShell): `$env:GROQ_API_KEY = "gsk_..."`
   - macOS / Linux: `export GROQ_API_KEY="gsk_..."`
   - Anahtar tanımlı değilse AI özelliği çalışmaz; uygulamanın geri kalanı etkilenmez.

## Sunucuları Başlat

3. Flask API sunucusunu başlat
   - // turbo
   - Terminalde şu komutu çalıştır:
   ```bash
   python3 "/home/dogan/Masaüstü/MArket App Web/main.py"
   ```
   - Çalışacak adres: http://127.0.0.1:5000
   - Veritabanı (`dh_market.db`) otomatik oluşturulur.

4. Frontend statik sunucusunu başlat (aynı klasörde yeni terminal)
   - // turbo
   - Terminalde şu komutu çalıştır:
   ```bash
   python3 -m http.server 8080 --bind 127.0.0.1 --directory "/home/dogan/Masaüstü/MArket App Web"
   ```
   - Çalışacak adres: http://127.0.0.1:8080

## Erişim

- **Ana sayfa:** http://127.0.0.1:8080/index.html
- **Admin paneli:** http://127.0.0.1:8080/admin.html

## Port Sorunları ("Address already in use")

5. Portları temizle (Linux/macOS)
   ```bash
   fuser -k 5000/tcp
   fuser -k 8080/tcp
   ```

6. Veya hem Flask hem frontend'i tek komutla başlat
   ```bash
   cd "/home/dogan/Masaüstü/MArket App Web" && python3 main.py & python3 -m http.server 8080 --bind 127.0.0.1
   ```

7. Windowsda hem flask hem fronthend'i tek komutla başlat
'''bash
cd "C:\Users\dhasa\OneDrive\Masaüstü\MArket App Web"; Start-Process python "main.py"; python -m http.server 8080 --bind 127.0.0.1
'''