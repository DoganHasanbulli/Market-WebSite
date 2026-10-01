/**
 * 40-auth.js - Kullanıcı Girişi, Kaydı ve Şifre İşlemleri
 * --------------------------------------------------------
 * Bu dosya, localStorage'da JWT token saklamayı ve auth işlemlerini yönetir:
 *   1. Token yardımcıları (getToken / setToken / removeToken / authHeaders)
 *   2. Login, Kayıt Ol ve Şifremi Unuttum modallarının açılıp kapanması
 *   3. Giriş, kayıt ve şifre değiştirme isteklerinin API'ye gönderilmesi
 *   4. Sayfa yenilendiğinde navbar'a giriş yapmış kullanıcı adının yazılması
 *
 * Bağımlılık: js/ortak/api.js (apiUrl, escapeHtml)
 */

// Token'ın localStorage'daki anahtarı
const TOKEN_KEY = 'dh_market_token';

// ==========================================
// 1. TOKEN YARDIMCI FONKSİYONLARI
// ==========================================

/**
 * Kaydedilmiş JWT token'ını okur.
 * @returns {string|null} Token veya (giriş yapılmamışsa) null
 */
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * JWT token'ını localStorage'a yazar.
 * @param {string} token - Backend'in döndürdüğü token
 */
function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * JWT token'ını siler (çıkış yapma).
 */
function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * Korumalı API istekleri için Authorization başlığı üretir.
 * Token yoksa yalnızca Content-Type döner (herkese açık istekler için).
 *
 * @returns {Object} Fetch options.headers içine konacak nesne
 */
function authHeaders() {
    const token = getToken();
    const basliklar = { 'Content-Type': 'application/json' };
    if (token) {
        basliklar['Authorization'] = 'Bearer ' + token;
    }
    return basliklar;
}

// ==========================================
// 2. MODAL AÇMA / KAPAMA
// ==========================================

/**
 * Giriş yap (login) modalını açar.
 */
function loginModalAc() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error("Hata: 'login-modal' ID'li element bulunamadı!");
    }
}

/**
 * Giriş yap (login) modalını kapatır.
 */
function loginModalKapat() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Kayıt ol modalını açar.
 */
function registerModalAc() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Kayıt ol modalını kapatır.
 */
function registerModalKapat() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * "Şifremi Unuttum" modalını açar.
 */
function sifremiUnuttumModalAc() {
    const modal = document.getElementById('sifremi-unuttum-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * "Şifremi Unuttum" modalını kapatır.
 */
function sifremiUnuttumModalKapat() {
    const modal = document.getElementById('sifremi-unuttum-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==========================================
// 3. KİMLİK DOĞRULAMA İSTEKLERİ
// ==========================================

/**
 * Kullanıcı adı ve şifreyle giriş yapar, gelen JWT token'ı saklar.
 */
async function girisYap() {
    const kullanici = document.getElementById('kullanici-adi').value.trim();
    const sifre = document.getElementById('sifre').value.trim();

    if (!kullanici || !sifre) {
        alert('Lütfen kullanıcı adı ve şifre girin!');
        return;
    }

    try {
        const response = await fetch(apiUrl('/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: kullanici, password: sifre })
        });
        const data = await response.json();

        if (response.ok) {
            setToken(data.token);
            alert('Hoş geldiniz, ' + data.user.username + '! Giriş başarılı.');
            loginModalKapat();
            window.location.reload(); // Navbar'daki kullanıcı adı güncellensin
        } else {
            alert(data.message || 'Giriş başarısız!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

/**
 * Form alanlarından yeni kullanıcı kaydı oluşturur.
 */
async function kayitOl() {
    const kullanici = document.getElementById('kayit-kullanici-adi').value.trim();
    const email = document.getElementById('kayit-email').value.trim();
    const sifre = document.getElementById('kayit-sifre').value.trim();
    const sifreTekrar = document.getElementById('kayit-sifre-tekrar').value.trim();

    if (!kullanici || !email || !sifre) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }
    if (sifre !== sifreTekrar) {
        alert('Şifreler eşleşmiyor!');
        return;
    }

    try {
        const response = await fetch(apiUrl('/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: kullanici, email: email, password: sifre })
        });
        const data = await response.json();

        if (response.ok) {
            alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            registerModalKapat();
            loginModalAc(); // Kayıttan sonra doğrudan giriş ekranına geç
        } else {
            alert(data.message || 'Kayıt başarısız!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

/**
 * "Şifremi Unuttum" formundan gelen yeni şifreyi backend'e gönderir.
 */
async function sifreDegistir() {
    const kullanici = document.getElementById('sifre-sifirla-kullanici').value.trim();
    const yeniSifre = document.getElementById('sifre-sifirla-yeni').value.trim();
    const tekrar = document.getElementById('sifre-sifirla-tekrar').value.trim();

    if (!kullanici || !yeniSifre) {
        alert('Kullanıcı adı ve yeni şifre zorunludur!');
        return;
    }
    if (yeniSifre !== tekrar) {
        alert('Şifreler eşleşmiyor!');
        return;
    }

    try {
        const response = await fetch(apiUrl('/reset-password'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: kullanici, new_password: yeniSifre })
        });
        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'Şifreniz güncellendi!');
            sifremiUnuttumModalKapat();
            loginModalAc();
        } else {
            alert(data.message || 'Şifre değiştirilemedi!');
        }
    } catch (hata) {
        apiHataBildir(hata, 'Sunucuya bağlanılamadı!');
    }
}

// ==========================================
// 4. OTURUM DURUMUNU EKRANA YANSITMA
// ==========================================

/**
 * Sayfa yüklendiğinde token varsa kullanıcı adını navbar'a yazar.
 * Giriş yapılmamışsa buton "Giriş Yap" olarak kalır.
 */
async function kullaniciBilgisiniYukle() {
    if (!getToken()) {
        girisButonunuSifirla(); // Giriş yapılmamış → butonu normal haline getir
        return;
    }

    try {
        const response = await fetch(apiUrl('/me'), { headers: authHeaders() });
        if (!response.ok) {
            // Token geçersiz/expired olmuşsa temizle
            removeToken();
            girisButonunuSifirla();
            return;
        }

        const user = await response.json();
        girisButonunuKullaniciyaBagla(user.username);
    } catch (hata) {
        console.error('Kullanıcı bilgisi yüklenemedi:', hata);
    }
}

/**
 * Navbar'daki giriş butonunu "Giriş Yap" haline döndürür ve
 * tıklanınca login modalını açacak şekilde bağlar.
 */
function girisButonunuSifirla() {
    const girisBtn = document.querySelector('.giris-btn');
    if (!girisBtn) {
        return;
    }
    girisBtn.innerText = 'Giriş Yap';
    girisBtn.style.background = '';
    girisBtn.onclick = function () {
        loginModalAc();
        return false;
    };
}

/**
 * Navbar'daki giriş butonunu kullanıcı adına çevirir.
 * Artık tıklanınca "çıkış yap" onayı sorar.
 *
 * @param {string} kullaniciAdi - Giriş yapan kullanıcının adı
 */
function girisButonunuKullaniciyaBagla(kullaniciAdi) {
    const girisBtn = document.querySelector('.giris-btn');
    if (!girisBtn) {
        return;
    }
    girisBtn.innerText = escapeHtml(kullaniciAdi);
    girisBtn.style.background = '#4ade80'; // Yeşil = giriş yapılmış
    girisBtn.onclick = function () {
        if (confirm('Çıkış yapmak istiyor musunuz?')) {
            removeToken();
            window.location.reload();
        }
        return false;
    };
}