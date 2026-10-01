"""
database.py - DH Market SQLite Veritabanı Yönetimi
---------------------------------------------------
Bu dosya, Flask uygulamasının SQLite veritabanı bağlantısını ve
CRUD (Create, Read, Update, Delete) fonksiyonlarını içerir.

Tablolar:
  - products   : Ürün bilgileri (ad, fiyat, stok, resim, besin değerleri)
  - users      : Kayıtlı kullanıcılar (şifre hash ile saklanır)
  - campaigns  : Kampanya kartları ve slide reklamları

Kullanım:
  import database as db
  db.init_db()              # Veritabanını ve tabloları oluştur
  db.get_all_products()     # Tüm ürünleri listele
  db.add_user(...)          # Yeni kullanıcı kaydet
"""
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import config

def get_db_connection():
    """SQLite veritabanı bağlantısı oluşturur.

    Args:
        yok

    Returns:
        sqlite3.Connection: Satırları anahtar ile erişilebilen bağlantı

    Notlar:
        - check_same_thread=False: Flask çoklu thread kullandığı için gerekli.
        - row_factory=sqlite3.Row: Sorgu sonuçları dict gibi okunabilir olur.
    """
    conn = sqlite3.connect(config.DATABASE_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Verileri sözlük (dict) gibi okumamızı sağlar
    return conn

def init_db():
    """Veritabanını ve gerekli tabloları (products, users, campaigns) oluşturur.
    Uygulama ilk başlatıldığında main.py'den çağrılır.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Ürünler tablosu (genişletilmiş besin değerleri ve açıklama ile)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            calories INTEGER DEFAULT 0,
            image TEXT,
            description TEXT,
            carbohydrates TEXT,
            fat TEXT,
            weight TEXT
        )
    ''')

    # Kullanıcılar tablosu
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Kampanyalar ve Slide Reklamları tablosu
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            image TEXT,
            type TEXT DEFAULT 'card',
            label TEXT,
            label_color TEXT DEFAULT 'blue',
            date_text TEXT,
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()

def add_user(username, email, password):
    """Yeni kullanıcı kaydı yapar. Şifre werkzeug ile hash'lenir.

    Args:
        username (str): Benzersiz kullanıcı adı
        email (str): Benzersiz e-posta adresi
        password (str): Düz metin şifre (hash'e çevrilir)

    Returns:
        bool: True (başarılı) veya False (kullanıcı adı/e-posta zaten var)
    """
    conn = get_db_connection()
    hash = generate_password_hash(password)
    try:
        conn.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, hash)
        )
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        conn.close()
        return False  # username veya email zaten var

def get_user_by_username(username):
    """Kullanıcı adına göre kullanıcı bilgilerini döndürür.

    Args:
        username (str): Aranacak kullanıcı adı

    Returns:
        dict: Kullanıcı bilgileri (id, username, email, password_hash, created_at)
              veya None (kullanıcı bulunamazsa)
    """
    # Kullanıcı adına göre kullanıcıyı getir
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    return dict(row) if row else None

def verify_user(username, password):
    """Giriş yaparken kullanıcı adı ve şifreyi doğrular.

    Args:
        username (str): Kullanıcı adı
        password (str): Düz metin şifre

    Returns:
        dict: Kullanıcı bilgileri (şifre hash'i hariç) veya None (hatalı giriş)
    """
    # Kullanıcı adı ve şifre doğrulaması yapar
    user = get_user_by_username(username)
    if user and check_password_hash(user['password_hash'], password):
        return user
    return None

def get_all_users():
    """Admin panel için tüm kayıtlı kullanıcıları listeler.
    Şifre hash'i döndürülmez (güvenlik).

    Returns:
        list[dict]: Kullanıcı listesi (id, username, email, created_at)
    """
    # Tüm kullanıcıları listele (şifre hariç)
    conn = get_db_connection()
    rows = conn.execute('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC').fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_all_products():
    """Ana sayfa ve admin panel için tüm ürünleri listeler.

    Returns:
        list[dict]: Ürün listesi (id, name, category, price, stock, ...)
    """
    # Tüm ürünleri listele
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_product(name, category, price, stock, calories, image, description='', carbohydrates='', fat='', weight=''):
    """Admin panelden yeni ürün ekler.

    Args:
        name (str): Ürün adı
        category (str): Kategori (Meyve, İçecek, Atıştırmalık vb.)
        price (float): Birim fiyat (TL)
        stock (int): Stok miktarı
        calories (int): Kalori değeri
        image (str): Resim URL'si
        description (str): Ürün açıklaması
        carbohydrates (str): Karbonhidrat miktarı (örn: '14g')
        fat (str): Yağ miktarı (örn: '0.2g')
        weight (str): Ağırlık (örn: '150g')
    """
    # Yeni ürün ekle (tüm besin değerleri ve açıklama ile)
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO products (name, category, price, stock, calories, image, description, carbohydrates, fat, weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (name, category, price, stock, calories, image, description, carbohydrates, fat, weight)
    )
    conn.commit()
    conn.close()

def delete_product(product_id):
    """ID'ye göre ürünü veritabanından siler.

    Args:
        product_id (int): Silinecek ürünün ID'si
    """
    # Ürün sil
    conn = get_db_connection()
    conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
    conn.commit()
    conn.close()

def update_product_stock(product_id, new_stock):
    """Admin panelde stok hızlı güncelleme için kullanılır.

    Args:
        product_id (int): Güncellenecek ürünün ID'si
        new_stock (int): Yeni stok miktarı
    """
    # Stok güncelle
    conn = get_db_connection()
    conn.execute('UPDATE products SET stock = ? WHERE id = ?', (new_stock, product_id))
    conn.commit()
    conn.close()

def update_product(product_id, name, category, price, stock, calories, image, description='', carbohydrates='', fat='', weight=''):
    """Admin panelden ürün düzenleme için tüm alanları günceller.

    Args:
        product_id (int): Güncellenecek ürünün ID'si
        name, category, price, stock, calories, image, ... : Yeni değerler
    """
    # Ürün bilgilerini tamamen güncelle
    conn = get_db_connection()
    conn.execute(
        'UPDATE products SET name=?, category=?, price=?, stock=?, calories=?, image=?, description=?, carbohydrates=?, fat=?, weight=? WHERE id=?',
        (name, category, price, stock, calories, image, description, carbohydrates, fat, weight, product_id)
    )
    conn.commit()
    conn.close()

def get_campaigns(campaign_type=None, active_only=True):
    """Kampanyaları filtreleyerek listeler.

    Args:
        campaign_type (str): 'card' veya 'slide' ile filtrele (None = tümü)
        active_only (bool): True ise sadece aktif olanlar döner

    Returns:
        list[dict]: Kampanya listesi (title, image, type, label, active, ...)
    """
    conn = get_db_connection()
    query = 'SELECT * FROM campaigns WHERE 1=1'
    params = []
    if campaign_type:
        query += ' AND type = ?'
        params.append(campaign_type)
    if active_only:
        query += ' AND active = 1'
    query += ' ORDER BY created_at DESC'
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_campaign(title, description='', image='', campaign_type='card', label='', label_color='blue', date_text='', active=1):
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO campaigns (title, description, image, type, label, label_color, date_text, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (title, description, image, campaign_type, label, label_color, date_text, active)
    )
    conn.commit()
    conn.close()

def delete_campaign(campaign_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM campaigns WHERE id = ?', (campaign_id,))
    conn.commit()
    conn.close()

def update_campaign(campaign_id, title, description, image, campaign_type, label, label_color, date_text, active):
    conn = get_db_connection()
    conn.execute(
        'UPDATE campaigns SET title=?, description=?, image=?, type=?, label=?, label_color=?, date_text=?, active=? WHERE id=?',
        (title, description, image, campaign_type, label, label_color, date_text, active, campaign_id)
    )
    conn.commit()
    conn.close()

def toggle_campaign_active(campaign_id):
    conn = get_db_connection()
    row = conn.execute('SELECT active FROM campaigns WHERE id = ?', (campaign_id,)).fetchone()
    if row:
        new_active = 0 if row['active'] else 1
        conn.execute('UPDATE campaigns SET active = ? WHERE id = ?', (new_active, campaign_id))
        conn.commit()
    conn.close()

def reset_password(username, new_password):
    # Şifremi unuttum - kullanıcının şifresini güncelle
    user = get_user_by_username(username)
    if not user:
        return False
    conn = get_db_connection()
    new_hash = generate_password_hash(new_password)
    conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_hash, user['id']))
    conn.commit()
    conn.close()
    return True

if __name__ == "__main__":
    init_db()
    print("Veritabanı ve tablolar başarıyla oluşturuldu!")