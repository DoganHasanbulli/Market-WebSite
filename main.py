"""
main.py - DH Market Flask Uygulaması
------------------------------------
Bu dosya Flask web sunucusunu oluşturur, veritabanını başlatır ve
api/ klasöründeki modüler endpoint'leri (Blueprint) kaydeder.

Çalıştırma:
  python main.py

Sonucunda http://127.0.0.1:5000 adresinde API çalışır.
"""

from flask import Flask
from flask_cors import CORS

import config
import database as db

# ------------------------------------------------------------
# Uygulama kurulumu
# ------------------------------------------------------------
app = Flask(__name__)

# Frontend (8080) ve API (5000) farklı portlarda çalıştığı için
# tarayıcı istekleri için CORS izni verilir.
CORS(app)

# Ayarlar config.py'den okunur (sabit kod içermez)
app.config['SECRET_KEY'] = config.SECRET_KEY

# ------------------------------------------------------------
# Başlangıç
# ------------------------------------------------------------
# Veritabanı ve tablolar yoksa oluşturulur
db.init_db()

# Tüm API endpoint'lerini içeren Blueprint'i kaydet
from api import api_bp
app.register_blueprint(api_bp)

# ------------------------------------------------------------
# Sunucuyu başlat
# ------------------------------------------------------------
if __name__ == '__main__':
    print('DH Market Sunucusu Başlatılıyor: http://127.0.0.1:%d' % config.SERVER_PORT)
    app.run(debug=True, port=config.SERVER_PORT)