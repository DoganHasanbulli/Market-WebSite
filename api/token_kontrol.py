"""
token_kontrol.py - JWT Token Doğrulama
---------------------------------------
Korumalı API endpoint'leri için 'token_required' decorator'ünü içerir.
Authorization header'daki Bearer token'ı çözümler ve geçerli
kullanıcıyı Flask request objesine ekler.

Kullanım:
  @api_bp.route('/me', methods=['GET'])
  @token_required
  def get_current_user(current_user):
      return jsonify(current_user)
"""
import jwt
from functools import wraps
from flask import request, jsonify, current_app
import database as db


def token_required(f):
    """JWT Bearer token'ını doğrular. Geçerli kullanıcıyı ilk argüman olarak verir."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            parts = auth_header.split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]

        if not token:
            return jsonify({'message': 'Token eksik!'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.get_user_by_username(data['username'])
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token süresi dolmuş!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Geçersiz token!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated
