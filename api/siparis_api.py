"""
siparis_api.py - Sipariş Alma
-----------------------------
Ödeme modalından gelen sipariş verilerini kabul eder.
Şu an için veritabanına kaydetmek yerine sadece loglar.

Endpoint'ler:
  POST /api/order → Sipariş oluştur (adres, ödeme, ürün listesi)
"""
import datetime
from flask import request, jsonify
from . import api_bp


@api_bp.route('/order', methods=['POST'])
def create_order():
    data = request.json
    if not data or not data.get('items') or not data.get('address'):
        return jsonify({'message': 'Ürün ve adres bilgisi zorunludur!'}), 400
    print(f"YENİ SİPARİŞ: Adres: {data['address']} | Ödeme: {data.get('payment', 'Nakit')} | Tutar: {data.get('total', 0)}")
    return jsonify({
        'status': 'success',
        'message': 'Siparişiniz alındı!',
        'order_id': f"DH-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    })
