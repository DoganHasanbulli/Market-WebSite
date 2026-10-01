from flask import Blueprint

# Tüm blueprint'ler burada tanımlanacak
api_bp = Blueprint('api', __name__, url_prefix='/api')

from .kullanici_api import *
from .urun_api import *
from .kampanya_api import *
from .siparis_api import *
