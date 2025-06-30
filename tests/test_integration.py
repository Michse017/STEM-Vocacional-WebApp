import pytest
import psycopg2
from unittest.mock import patch
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TestIntegration:
    """Pruebas de integración completas"""
    
    @pytest.mark.integration
    def test_full_user_flow(self, client):
        """Probar flujo completo de usuario"""
        # 1. Login
        with patch('backend.controllers.usuario_controller.authenticate_user') as mock_auth:
            mock_auth.return_value = {
                'id_usuario': 1,
                'codigo_estudiante': '2023001',
                'nombre': 'Test User'
            }
            
            response = client.post('/', data={'user_id': '2023001'})
            assert response.status_code in [200, 302]
        
        # 2. Acceder al cuestionario
        with client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['codigo'] = '2023001'
        
        with patch('database.controller.get_usuario_full_responses') as mock_responses:
            mock_responses.return_value = {}
            response = client.get('/questionnaire')
            assert response.status_code == 200
        
        # 3. Enviar respuestas
        form_data = {
            'dim_0_q_0': '85.5',
            'dim_0_q_1': '90.0'
        }
        
        with patch('database.controller.upsert_cognitiva') as mock_upsert:
            mock_upsert.return_value = True
            response = client.post('/questionnaire', data=form_data)
            assert response.status_code in [200, 302]
    
    @pytest.mark.slow
    def test_database_operations(self):
        """Probar operaciones de base de datos reales (requiere DB de test)"""
        test_url = "postgresql://stemuser:stem2025@localhost:5432/stemvocacional_test"
        
        try:
            conn = psycopg2.connect(test_url)
            cursor = conn.cursor()
            
            # Crear tabla de prueba
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS test_users (
                    id SERIAL PRIMARY KEY,
                    codigo VARCHAR(50),
                    nombre VARCHAR(100)
                )
            """)
            
            # Insertar datos
            cursor.execute(
                "INSERT INTO test_users (codigo, nombre) VALUES (%s, %s)",
                ('TEST001', 'Test User')
            )
            
            # Verificar inserción
            cursor.execute("SELECT * FROM test_users WHERE codigo = %s", ('TEST001',))
            result = cursor.fetchone()
            
            assert result is not None
            assert result[1] == 'TEST001'
            assert result[2] == 'Test User'
            
            # Limpiar
            cursor.execute("DROP TABLE test_users")
            conn.commit()
            cursor.close()
            conn.close()
            
        except psycopg2.OperationalError:
            pytest.skip("Base de datos de prueba no disponible")