"""
kampanya_api.py - Kampanya ve Slide Reklam Yönetimi
---------------------------------------------------
Ana sayfadaki kampanya kartları ve slider reklamlarını yöneten endpoint'ler.

Endpoint'ler:
  GET    /api/campaigns             → Aktif kampanyaları listele
  POST   /api/campaigns             → Yeni kampanya/slide ekle (admin)
  DELETE /api/campaigns/<id>       → Kampanya sil (admin)
  PUT    /api/campaigns/<id>       → Kampanya düzenle (admin)
  POST   /api/campaigns/<id>/toggle → Aktif/Pasif durumunu değiştir
"""
from flask import request, jsonify
from . import api_bp
import database as db


@api_bp.route('/campaigns', methods=['GET'])
def get_campaigns():
    campaign_type = request.args.get('type')
    active_only = request.args.get('active', '1') == '1'
    campaigns = db.get_campaigns(campaign_type, active_only)
    return jsonify(campaigns)


@api_bp.route('/campaigns', methods=['POST'])
def add_campaign():
    data = request.json
    if not data or not data.get('title'):
        return jsonify({'message': 'Başlık zorunludur!'}), 400
    db.add_campaign(
        data['title'],
        data.get('description', ''),
        data.get('image', ''),
        data.get('type', 'card'),
        data.get('label', ''),
        data.get('label_color', 'blue'),
        data.get('date_text', ''),
        data.get('active', 1)
    )
    return jsonify({'status': 'success', 'message': 'Kampanya eklendi!'}), 201


@api_bp.route('/campaigns/<int:campaign_id>', methods=['DELETE'])
def delete_campaign(campaign_id):
    db.delete_campaign(campaign_id)
    return jsonify({'status': 'success', 'message': 'Kampanya silindi!'})


@api_bp.route('/campaigns/<int:campaign_id>', methods=['PUT'])
def update_campaign(campaign_id):
    data = request.json
    if not data:
        return jsonify({'message': 'Güncelleme verisi gerekli!'}), 400
    db.update_campaign(
        campaign_id,
        data.get('title', ''),
        data.get('description', ''),
        data.get('image', ''),
        data.get('type', 'card'),
        data.get('label', ''),
        data.get('label_color', 'blue'),
        data.get('date_text', ''),
        data.get('active', 1)
    )
    return jsonify({'status': 'success', 'message': 'Kampanya güncellendi!'})


@api_bp.route('/campaigns/<int:campaign_id>/toggle', methods=['POST'])
def toggle_campaign(campaign_id):
    db.toggle_campaign_active(campaign_id)
    return jsonify({'status': 'success', 'message': 'Kampanya durumu değiştirildi!'})
