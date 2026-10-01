/**
 * 30-kullanicilar.js - Kullanıcı Listesi
 * ---------------------------------------
 * Admin panelindeki kullanıcılar sekmesi.
 * Kayıtlı kullanıcıları (şifre hash'i olmadan) listeler ve tabloya basar.
 *
 * Bağımlılık: js/ortak/api.js (apiUrl, escapeHtml)
 */

/**
 * Tüm kayıtlı kullanıcıları API'den çeker (GET /api/users) ve tabloyu doldurur.
 */
async function kullanicilariYukle() {
    const tbody = document.getElementById('kullanici-tablosu');
    const yokMesaji = document.getElementById('kullanici-yok-mesaji');
    if (!tbody || !yokMesaji) {
        return;
    }

    try {
        const response = await fetch(apiUrl('/users'), { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Sunucu ' + response.status + ' döndü');
        }

        const kullanicilar = await response.json();

        if (kullanicilar.length === 0) {
            tbody.innerHTML = '';
            yokMesaji.classList.remove('hidden');
            return;
        }

        yokMesaji.classList.add('hidden');
        tbody.innerHTML = kullanicilar.map(u => `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="px-6 py-4 font-medium text-white">#${u.id}</td>
                <td class="px-6 py-4">${escapeHtml(u.username)}</td>
                <td class="px-6 py-4">${escapeHtml(u.email)}</td>
                <td class="px-6 py-4 text-slate-400">${escapeHtml(u.created_at || '-')}</td>
            </tr>
        `).join('');
    } catch (hata) {
        console.error('Kullanıcı yükleme hatası:', hata);
    }
}