"""
Servidor Flask simple para probar la funcionalidad de administración de cuestionarios
"""
import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS

# Agregar el directorio al path para importar database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'https://stem-vocacional-web-app.vercel.app'])

# Simulamos datos para probar el frontend
cuestionarios_mock = [
    {
        'id_cuestionario': 1,
        'nombre': 'Cuestionario Sociodemográfico',
        'descripcion': 'Evaluación de características demográficas y socioeconómicas',
        'tipo': 'sociodemografico',
        'activo': True,
        'fecha_creacion': '2024-01-15T10:30:00',
        'num_preguntas': 12
    },
    {
        'id_cuestionario': 2,
        'nombre': 'Test de Inteligencias Múltiples',
        'descripcion': 'Evaluación basada en la teoría de Howard Gardner',
        'tipo': 'inteligencias_multiples',
        'activo': True,
        'fecha_creacion': '2024-01-16T14:20:00',
        'num_preguntas': 40
    },
    {
        'id_cuestionario': 3,
        'nombre': 'Evaluación Vocacional',
        'descripcion': 'Cuestionario para identificar preferencias vocacionales en STEM',
        'tipo': 'vocacional',
        'activo': False,
        'fecha_creacion': '2024-01-17T09:15:00',
        'num_preguntas': 25
    }
]

@app.route('/api/admin/cuestionarios', methods=['GET'])
def get_cuestionarios():
    """Obtener lista de cuestionarios"""
    return jsonify({
        'success': True,
        'data': cuestionarios_mock,
        'count': len(cuestionarios_mock)
    })

@app.route('/api/admin/cuestionarios', methods=['POST'])
def create_cuestionario():
    """Crear nuevo cuestionario"""
    data = request.get_json()
    
    if not data or not data.get('nombre'):
        return jsonify({
            'success': False,
            'error': 'El nombre del cuestionario es requerido'
        }), 400
    
    nuevo_cuestionario = {
        'id_cuestionario': max([c['id_cuestionario'] for c in cuestionarios_mock]) + 1,
        'nombre': data['nombre'],
        'descripcion': data.get('descripcion', ''),
        'tipo': data.get('tipo', ''),
        'activo': True,
        'fecha_creacion': '2024-01-20T12:00:00',
        'num_preguntas': 0
    }
    
    cuestionarios_mock.append(nuevo_cuestionario)
    
    return jsonify({
        'success': True,
        'data': nuevo_cuestionario,
        'message': 'Cuestionario creado exitosamente'
    })

@app.route('/api/admin/cuestionarios/<int:cuestionario_id>', methods=['GET'])
def get_cuestionario(cuestionario_id):
    """Obtener cuestionario específico"""
    cuestionario = next((c for c in cuestionarios_mock if c['id_cuestionario'] == cuestionario_id), None)
    
    if not cuestionario:
        return jsonify({
            'success': False,
            'error': 'Cuestionario no encontrado'
        }), 404
    
    return jsonify({
        'success': True,
        'data': cuestionario
    })

@app.route('/api/admin/cuestionarios/<int:cuestionario_id>', methods=['PUT'])
def update_cuestionario(cuestionario_id):
    """Actualizar cuestionario"""
    data = request.get_json()
    
    cuestionario = next((c for c in cuestionarios_mock if c['id_cuestionario'] == cuestionario_id), None)
    
    if not cuestionario:
        return jsonify({
            'success': False,
            'error': 'Cuestionario no encontrado'
        }), 404
    
    if 'nombre' in data:
        cuestionario['nombre'] = data['nombre']
    if 'descripcion' in data:
        cuestionario['descripcion'] = data['descripcion']
    if 'tipo' in data:
        cuestionario['tipo'] = data['tipo']
    
    return jsonify({
        'success': True,
        'data': cuestionario,
        'message': 'Cuestionario actualizado exitosamente'
    })

@app.route('/api/admin/cuestionarios/<int:cuestionario_id>', methods=['DELETE'])
def delete_cuestionario(cuestionario_id):
    """Eliminar cuestionario"""
    global cuestionarios_mock
    
    cuestionario = next((c for c in cuestionarios_mock if c['id_cuestionario'] == cuestionario_id), None)
    
    if not cuestionario:
        return jsonify({
            'success': False,
            'error': 'Cuestionario no encontrado'
        }), 404
    
    cuestionarios_mock = [c for c in cuestionarios_mock if c['id_cuestionario'] != cuestionario_id]
    
    return jsonify({
        'success': True,
        'message': 'Cuestionario eliminado exitosamente'
    })

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de salud"""
    return jsonify({
        'status': 'healthy',
        'service': 'admin-cuestionarios',
        'version': '1.0.0'
    })

if __name__ == '__main__':
    print("🚀 Servidor Flask de prueba iniciado")
    print("📋 Endpoints disponibles:")
    print("   GET  /api/admin/cuestionarios")
    print("   POST /api/admin/cuestionarios")
    print("   GET  /api/admin/cuestionarios/<id>")
    print("   PUT  /api/admin/cuestionarios/<id>")
    print("   DELETE /api/admin/cuestionarios/<id>")
    print("   GET  /health")
    print("🔗 Servidor corriendo en http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)