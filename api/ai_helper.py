"""
ai_helper.py - Yapay Zeka Ürün Bilgisi Doldurma
-------------------------------------------------
Bu dosya, Groq API'yi (OpenAI uyumlu) kullanarak ürün adından otomatik
bilgi çıkarımı yapar: kategori, fiyat, kalori ve besin değerleri.

API anahtarı config.py üzerinden ortam değişkeninden (GROQ_API_KEY) okunur.
Anahtar tanımlı değilse bu fonksiyon hata mesajı döndürür.

Örnek kullanım:
  from ai_helper import get_product_info_from_ai
  info, error = get_product_info_from_ai("Kırmızı Elma")
  # info = {"category": "Meyve", "price": 25.0, "calories": 52, ...}
  # error = None ise başarılı, dolu string ise hata açıklaması
"""
import json
import re
import urllib.error
import urllib.request
from config import GROQ_API_KEY, GROQ_MODEL


def get_product_info_from_ai(product_name):
    """Ürün adına göre AI'dan fiyat, kategori, kalori ve besin değerlerini alır.

    Args:
        product_name (str): Ürün adı (örn: "Kırmızı Elma", "Kola 330ml")

    Returns:
        tuple: (data dict, error str)
               data = {"category", "price", "calories", "stock", "description",
                       "carbohydrates", "fat", "weight"}
               error = None ise başarılı, str ise hata mesajı
    """
    if not GROQ_API_KEY:
        return None, (
            "Groq API anahtarı ayarlanmamış (GROQ_API_KEY).\n"
            "Anahtarı ortam değişkeni olarak tanımlayın:\n"
            "  Windows (PowerShell): $env:GROQ_API_KEY = \"gsk_...\"\n"
            "  macOS / Linux      : export GROQ_API_KEY=\"gsk_...\"\n"
            "Anahtar almak için: https://console.groq.com/keys"
        )

    prompt = (
        f"Ürün adı: '{product_name}'\n"
        f"Bu ürün hakkında aşağıdaki bilgileri Türkçe olarak JSON formatında ver:\n"
        f"{{\n"
        f'  "category": "Meyve / İçecek / Atıştırmalık / Süt Ürünleri / Temel Gıda / Tatlı / Kahvaltılık",\n'
        f'  "price": 25.00,\n'
        f'  "calories": 52,\n'
        f'  "stock": 50,\n'
        f'  "description": "Kısa ürün açıklaması (1-2 cümle)",\n'
        f'  "carbohydrates": "14g",\n'
        f'  "fat": "0.2g",\n'
        f'  "weight": "150g"\n'
        f"}}\n"
        f"Sadece JSON döndür, başka açıklama yazma.\n"
        f"Fiyatı Türkiye market fiyatlarına göre TL olarak belirle."
    )

    try:
        req_body = json.dumps({
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 300
        }).encode('utf-8')

        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=req_body,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json; charset=utf-8",
                "User-Agent": "DH-Market-App/1.0"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            content = data["choices"][0]["message"]["content"]

        # JSON bloğunu içerikten ayıkla
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if not json_match:
            return None, f"AI yanıtında JSON bulunamadı:\n{content}"

        result = json.loads(json_match.group())

        # Gerekli alanları doğrula
        required = ["category", "price", "calories", "stock", "description",
                    "carbohydrates", "fat", "weight"]
        missing = [k for k in required if k not in result]
        if missing:
            return None, f"Eksik alanlar: {', '.join(missing)}"

        # Sayısal değerleri normalize et
        result["price"] = float(result.get("price", 0))
        result["calories"] = int(result.get("calories", 0))
        result["stock"] = int(result.get("stock", 0))

        return result, None

    except urllib.error.HTTPError as e:
        return None, f"API hatası ({e.code}): {e.reason}"
    except urllib.error.URLError as e:
        return None, f"Bağlantı hatası: {e.reason}"
    except json.decoder.JSONDecodeError as e:
        return None, f"AI yanıtı geçersiz JSON: {e}"
    except Exception as e:
        return None, f"Beklenmeyen hata: {e}"
