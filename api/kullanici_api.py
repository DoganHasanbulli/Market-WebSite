"""
kullanici_api.py - Kullanıcı İşlemleri (Auth)
----------------------------------------------
Kullanıcı kayıt, giriş, bilgi çekme ve şifre sıfırlama endpoint'lerini içerir.

Endpoint'ler:
  POST /api/register       → Yeni kayıt
  POST /api/login          → Giriş yap, JWT token al
  GET  /api/me             → Giriş yapmış kullanıcı bilgisi
  POST /api/reset-password → Şifremi unuttum
  GET  /api/users          → Tüm kullanıcıları listele (admin)
"""
import jwt
import datetime
from flask import request, jsonify
from .token_kontrol import token_required
from . import api_bp
import database as db


@api_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Kullanıcı adı, e-posta ve şifre zorunludur!'}), 400

    success = db.add_user(data['username'], data['email'], data['password'])
    if success:
        return jsonify({'message': 'Kayıt başarılı!'}), 201
    else:
        return jsonify({'message': 'Bu kullanıcı adı veya e-posta zaten kullanılıyor!'}), 409


@api_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Kullanıcı adı ve şifre zorunludur!'}), 400

    user = db.verify_user(data['username'], data['password'])
    if user:
        from flask import current_app
        token = jwt.encode(
            {
                'username': user['username'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            },
            current_app.config['SECRET_KEY'],
            algorithm="HS256"
        )
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            }
        })
    else:
        return jsonify({'message': 'Kullanıcı adı veya şifre hatalı!'}), 401


@api_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'id': current_user['id'],
        'username': current_user['username'],
        'email': current_user['email']
    })


@api_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    if not data or not data.get('username') or not data.get('new_password'):
        return jsonify({'message': 'Kullanıcı adı ve yeni şifre zorunludur!'}), 400

    success = db.reset_password(data['username'], data['new_password'])
    if success:
        return jsonify({'message': 'Şifreniz başarıyla değiştirildi!'})
    else:
        return jsonify({'message': 'Kullanıcı bulunamadı!'}), 404


@api_bp.route('/users', methods=['GET'])
def get_users():
    users = db.get_all_users()
    return jsonify(users)
