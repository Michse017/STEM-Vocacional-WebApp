from database.controller import get_usuario_by_codigo

def authenticate_user(codigo_estudiante):
    """Autenticar usuario por código de estudiante"""
    if not codigo_estudiante:
        return None
    
    try:
        usuario = get_usuario_by_codigo(codigo_estudiante)
        return usuario
    except Exception as e:
        print(f"Error autenticando usuario: {e}")
        return None

def get_user_profile(codigo_estudiante):
    """Obtener perfil del usuario"""
    usuario = authenticate_user(codigo_estudiante)
    if usuario:
        return {
            'success': True,
            'usuario': usuario
        }
    return {
        'success': False,
        'message': 'Usuario no encontrado'
    }

def create_user_session(usuario):
    """Crear sesión de usuario"""
    if usuario:
        return {
            'user_id': usuario.get('id_usuario'),
            'codigo': usuario.get('codigo_estudiante'),
            'authenticated': True
        }
    return None