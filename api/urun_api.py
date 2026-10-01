"""
urun_api.py - Ürün CRUD İşlemleri
-----------------------------------
Ürün listeleme, ekleme, silme ve güncelleme endpoint'lerini içerir.

Endpoint'ler:
  GET    /api/products           → Tüm ürünleri listele
  POST   /api/products            → Yeni ürün ekle (admin)
  DELETE /api/products/<id>       → Ürün sil (admin)
  PUT    /api/products/<id>       → Ürün güncelle (admin)
"""
from flask import request, jsonify
from . import api_bp
import database as db


@api_bp.route('/products', methods=['GET'])
def get_products():
    products = db.get_all_products()
    return jsonify(products)


@api_bp.route('/products', methods=['POST'])
def add_product():
    data = request.json
    if not data or not data.get('name') or data.get('price') is None:
        return jsonify({'message': 'Ürün adı ve fiyat zorunludur!'}), 400

    db.add_product(
        data['name'],
        data.get('category', ''),
        data['price'],
        data.get('stock', 0),
        data.get('calories', 0),
        data.get('image', ''),
        data.get('description', ''),
        data.get('carbohydrates', ''),
        data.get('fat', ''),
        data.get('weight', '')
    )
    return jsonify({'status': 'success', 'message': 'Ürün eklendi!'}), 201


@api_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    db.delete_product(product_id)
    return jsonify({'status': 'success', 'message': 'Ürün silindi!'})


@api_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.json
    if not data:
        return jsonify({'message': 'Güncelleme verisi gerekli!'}), 400

    if 'stock' in data and len(data) == 1:
        db.update_product_stock(product_id, data['stock'])
        return jsonify({'status': 'success', 'message': 'Stok güncellendi!'})

    db.update_product(
        product_id,
        data.get('name', ''),
        data.get('category', ''),
        data.get('price', 0),
        data.get('stock', 0),
        data.get('calories', 0),
        data.get('image', ''),
        data.get('description', ''),
        data.get('carbohydrates', ''),
        data.get('fat', ''),
        data.get('weight', '')
    )
    return jsonify({'status': 'success', 'message': 'Ürün güncellendi!'})


@api_bp.route('/products/auto-fill', methods=['POST'])
def auto_fill_product():
    """AI ile ürün adından otomatik bilgi çıkarımı yapar.
    Request: {\"name\": \"Kırmızı Elma\"}
    Response: {\"status\": \"success\", \"data\": {...}} veya {\"status\": \"error\", \"message\": ...}
    """
    data = request.json
    if not data or not data.get('name'):
        return jsonify({'status': 'error', 'message': 'Ürün adı gerekli!'}), 400

    from .ai_helper import get_product_info_from_ai
    info, error = get_product_info_from_ai(data['name'])
    if error:
        return jsonify({'status': 'error', 'message': error}), 500

    return jsonify({'status': 'success', 'data': info})
