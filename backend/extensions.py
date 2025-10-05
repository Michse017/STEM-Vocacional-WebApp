from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Shared limiter extension (initialized in app factory)
limiter = Limiter(key_func=get_remote_address, default_limits=[])
