"""
config.py - Uygulama Ayarları
------------------------------
Veritabanı ve API anahtarları gibi ortak ayarları toplar.

GÜVENLİK NOTU
-------------
Groq API anahtarı kaynak koda GÖMÜLMEZ. Anahtar ortam değişkeninden
(environment variable) okunur. Anahtarı tanımlamak için:

  Windows (PowerShell):
      $env:GROQ_API_KEY = "gsk_xxxx..."

  Windows (Kalıcı - Kullanıcı seviyesi):
      setx GROQ_API_KEY "gsk_xxxx..."

  macOS / Linux:
      export GROQ_API_KEY="gsk_xxxx..."

Anahtar tanımlı değilse AI özelliği çalışmaz; uygulamanın geri kalanı
etkilenmez (ai_helper.py bu durumu yakalar ve kullanıcıya bilgi verir).
"""

import os

# ------------------------------------------------------------
# Yapay Zeka (Groq) Ayarları
# OpenAI yerine Groq kullanılır (daha hızlı ve ücretsiz katılı).
# Anahtarı https://console.groq.com/keys adresinden alabilirsiniz.
# ------------------------------------------------------------
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')

# Kullanılacak model. Groq tarafından desteklenen modeller:
#   llama-3.1-8b-instant, gemma2-9b-it, mixtral-8x7b-32768, llama3-70b-8192
GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')

# ------------------------------------------------------------
# Flask / Web Sunucusu Ayarları
# ------------------------------------------------------------

# Flask oturum çerezleri (login) ve imzalama için kullanılan anahtar.
# Üretimde ortam değişkeninden okunmalı, sabit kodlanmamalıdır.
SECRET_KEY = os.getenv('SECRET_KEY', 'dh-market-gizli-anahtar-2026')

# Veritabanı dosyasının adı (proje kök dizininde oluşturulur)
DATABASE_FILE = os.getenv('DATABASE_FILE', 'dh_market.db')

# API'nin çalışacağı port
SERVER_PORT = int(os.getenv('PORT', 5000))